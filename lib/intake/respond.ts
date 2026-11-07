import { en } from "@/lib/strings/en";
import type { IntakeFields } from "@/lib/intake/body";

// Responses for the public intake API (Tech.md §7.4 and the redirect-mode rules in §7.3).

export type IntakeErrorCode = keyof typeof en.intake.errors;

const STATUS: Record<IntakeErrorCode, number> = {
  invalid_body: 400,
  validation_failed: 400,
  invalid_form_key: 403,
  origin_not_allowed: 403,
  payload_too_large: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  server_error: 500,
};

export const isErrorCode = (value: string | null | undefined): value is IntakeErrorCode =>
  !!value && Object.hasOwn(STATUS, value);

/** The browser is navigating to this URL (a plain HTML form post), so it expects a page, not JSON. */
export function isNavigationRequest(headers: Headers): boolean {
  const mode = headers.get("sec-fetch-mode");
  if (mode) return mode === "navigate";
  // Older clients send no Sec-Fetch-Mode. Fall back to what they say they accept.
  return (headers.get("accept") ?? "").includes("text/html");
}

/**
 * Redirect mode is for plain HTML forms. A request is in redirect mode when the browser is
 * navigating, or when the form names its own success or error page. A JavaScript `fetch`
 * is never in redirect mode unless it sends one of those two fields.
 */
export function isRedirectMode(headers: Headers, fields: IntakeFields): boolean {
  return isNavigationRequest(headers) || !!fields._redirect || !!fields._error_redirect;
}

/** CORS headers. Only an allowed origin gets the `Access-Control-*` headers (Tech.md §7.4). */
export function corsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return { Vary: "Origin" };
  return {
    Vary: "Origin",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function successJson(allowedOrigin: string | null): Response {
  return Response.json({ ok: true }, { status: 201, headers: corsHeaders(allowedOrigin) });
}

export function errorJson(
  code: IntakeErrorCode,
  extra: { fields?: Record<string, string>; retryAfter?: number },
  allowedOrigin: string | null,
): Response {
  const headers: Record<string, string> = corsHeaders(allowedOrigin);
  if (extra.retryAfter) headers["Retry-After"] = String(extra.retryAfter);
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message: en.intake.errors[code],
        ...(extra.fields ? { fields: extra.fields } : {}),
      },
    },
    { status: STATUS[code], headers },
  );
}

/** A 303 sends the browser to the target with a GET, which is what a form post needs. */
export function redirectTo(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

/** Where a visitor goes after a successful form post. */
export function successRedirectUrl(opts: { custom: string | null; appUrl: string }): string {
  if (opts.custom) return opts.custom;
  const url = new URL("/form-result", opts.appUrl);
  url.searchParams.set("status", "success");
  return url.toString();
}

/**
 * Where a visitor goes after a rejected form post: the website's own error page with
 * `?error=<code>`, or Flowdesk's result page (which also lists the invalid field names).
 */
export function errorRedirectUrl(opts: {
  custom: string | null;
  appUrl: string;
  code: IntakeErrorCode;
  fieldNames?: string[];
}): string {
  if (opts.custom) {
    const url = new URL(opts.custom);
    url.searchParams.set("error", opts.code);
    return url.toString();
  }
  const url = new URL("/form-result", opts.appUrl);
  url.searchParams.set("status", "error");
  url.searchParams.set("code", opts.code);
  if (opts.fieldNames?.length) url.searchParams.set("fields", opts.fieldNames.join(","));
  return url.toString();
}
