import { after } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { readIntakeBody, type IntakeFields } from "@/lib/intake/body";
import { getRequestOrigin, isAllowedOrigin, originOf, safeRedirect } from "@/lib/intake/origin";
import { checkIntakeLimits, getClientIp, hashIp } from "@/lib/intake/rate-limit";
import {
  corsHeaders,
  errorJson,
  errorRedirectUrl,
  isNavigationRequest,
  isRedirectMode,
  redirectTo,
  successJson,
  successRedirectUrl,
  type IntakeErrorCode,
} from "@/lib/intake/respond";
import { parseInquiry } from "@/lib/intake/schema";
import { notifyNewInquiry } from "@/lib/email/notify";

// Public intake API (Tech.md §7, PRD §5.1).
//
//   POST    /api/v1/forms/{formKey}/inquiries
//   OPTIONS /api/v1/forms/{formKey}/inquiries   (CORS preflight)
//
// Nothing here trusts the visitor: the business comes from the form key, the origin is checked
// against that website's allowed list, and all writes go through the `submit_inquiry` function.

type Ctx = RouteContext<"/api/v1/forms/[formKey]/inquiries">;

const FORM_KEY = /^pk_[0-9a-f]{40}$/;

// Looks up the connected website and its business. Returns null for an unknown key, an inactive
// website or a business that isn't active, so callers answer all three the same way.
async function findSource(formKey: string) {
  if (!FORM_KEY.test(formKey)) return { source: null };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inquiry_sources")
    .select("id, name, allowed_origins, is_active, business:businesses(status)")
    .eq("public_key", formKey)
    .maybeSingle();
  if (error) throw new Error(`source lookup failed (${error.code})`);

  const business = Array.isArray(data?.business) ? data.business[0] : data?.business;
  if (!data || !data.is_active || business?.status !== "active") return { source: null };
  return { source: data, admin };
}

export async function OPTIONS(request: Request, ctx: Ctx) {
  const { formKey } = await ctx.params;
  try {
    const { source } = await findSource(formKey);
    const origin = originOf(request.headers.get("origin"));
    const allowed = source && isAllowedOrigin(origin, source.allowed_origins) ? origin : null;
    return new Response(null, { status: 204, headers: corsHeaders(allowed) });
  } catch (error) {
    console.error("[intake] preflight failed", { error: error instanceof Error ? error.message : "unknown" });
    return new Response(null, { status: 204, headers: corsHeaders(null) });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const { formKey } = await ctx.params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  // Learned as the request is processed. They decide how a failure is reported.
  let fields: IntakeFields = {};
  let allowedOrigins: string[] | null = null;
  let corsOrigin: string | null = null;

  // Plain HTML forms get a redirect; JavaScript callers get JSON (Tech.md §7.3).
  const fail = (
    code: IntakeErrorCode,
    extra: { fields?: Record<string, string>; retryAfter?: number } = {},
  ) => {
    if (isNavigationRequest(request.headers) || isRedirectMode(request.headers, fields)) {
      // The custom error page is only trusted once we know the website's allowed origins.
      const custom = allowedOrigins ? safeRedirect(fields._error_redirect, allowedOrigins) : null;
      return redirectTo(
        errorRedirectUrl({ custom, appUrl, code, fieldNames: extra.fields ? Object.keys(extra.fields) : undefined }),
      );
    }
    return errorJson(code, extra, corsOrigin);
  };

  const succeed = () => {
    if (isNavigationRequest(request.headers) || isRedirectMode(request.headers, fields)) {
      const custom = allowedOrigins ? safeRedirect(fields._redirect, allowedOrigins) : null;
      return redirectTo(successRedirectUrl({ custom, appUrl }));
    }
    return successJson(corsOrigin);
  };

  try {
    // 1-2. Size limit and body parsing.
    const body = await readIntakeBody(request);
    if (!body.ok) return fail(body.code);
    fields = body.fields;

    // 3. Form key, active website, active business. One answer for all failures.
    const { source, admin } = await findSource(formKey);
    if (!source || !admin) return fail("invalid_form_key");
    allowedOrigins = source.allowed_origins;

    // 4. The request must come from one of the website's allowed addresses.
    const origin = getRequestOrigin(request.headers);
    if (!isAllowedOrigin(origin, source.allowed_origins) || !origin) return fail("origin_not_allowed");
    corsOrigin = origin;

    // 5. Rate limits: per visitor, then per website.
    const ipHash = hashIp(getClientIp(request.headers));
    const limit = await checkIntakeLimits(admin, source.id, ipHash);
    if (!limit.allowed) return fail("rate_limited", { retryAfter: limit.retryAfter });

    // 6. Honeypot: humans never fill this in. Bots get a normal success and nothing is stored.
    if (fields._hp) return succeed();

    // 7. Validate. Messages never repeat the submitted values.
    const parsed = parseInquiry(fields);
    if (!parsed.ok) return fail("validation_failed", { fields: parsed.fields });

    // 8. Store: customer, inquiry and its "received" event, in one transaction.
    const { data: inquiryId, error } = await admin.rpc("submit_inquiry", {
      p_source_id: source.id,
      p_name: parsed.data.name,
      p_email: parsed.data.email,
      p_subject: parsed.data.subject,
      p_message: parsed.data.message,
      p_ip_hash: ipHash,
      p_origin: origin,
      p_user_agent: request.headers.get("user-agent") ?? "",
    });
    if (error || !inquiryId) {
      // The source or business was deactivated between the lookup and the insert.
      if (error?.message.includes("source_inactive")) return fail("invalid_form_key");
      console.error("[intake] could not store inquiry", { code: error?.code ?? "no_id" });
      return fail("server_error");
    }

    // 9. Notify the business after the response. A failed email never affects the visitor.
    after(() => notifyNewInquiry(inquiryId));

    // 10. Done.
    return succeed();
  } catch (error) {
    console.error("[intake] unexpected error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return fail("server_error");
  }
}
