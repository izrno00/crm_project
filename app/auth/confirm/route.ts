import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { appendQuery, safeNextPath } from "@/lib/auth/redirect";

const LINK_TYPES: EmailOtpType[] = ["invite", "recovery", "email_change"];

const isLinkType = (value: string | null): value is EmailOtpType =>
  !!value && (LINK_TYPES as string[]).includes(value);

// Exchanges the link from an invitation, password reset or email change email
// for a session, then sends the user on to `next` (a validated relative path).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const next = safeNextPath(params.get("next")) ?? "/dashboard";

  const supabase = createClient(await cookies());

  let failed = true;
  if (tokenHash && isLinkType(type)) {
    // Flowdesk's email templates use the token-hash format.
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    failed = !!error;
  } else if (code) {
    // Fallback for Supabase's default (PKCE) templates, which link with ?code=.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = !!error;
  }

  if (failed) redirect("/login?error=link_invalid");

  // An email change needs a confirmation from both addresses. If the other one
  // is still outstanding, tell the user instead of showing a plain success.
  // (The code flow carries no `type`, so it is recognised by its target page.)
  if (type === "email_change" || (!type && next.startsWith("/settings/account"))) {
    const { data } = await supabase.auth.getUser();
    redirect(
      appendQuery(
        next,
        "notice",
        data.user?.new_email ? "email_change_partial" : "email_changed",
      ),
    );
  }

  redirect(next);
}
