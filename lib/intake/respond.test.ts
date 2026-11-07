import { describe, expect, it } from "vitest";
import {
  corsHeaders,
  errorJson,
  errorRedirectUrl,
  isErrorCode,
  isNavigationRequest,
  isRedirectMode,
  redirectTo,
  successJson,
  successRedirectUrl,
} from "@/lib/intake/respond";

const APP = "https://app.example.com";

describe("redirect mode", () => {
  it("is on for a browser navigating (a plain HTML form)", () => {
    expect(isNavigationRequest(new Headers({ "sec-fetch-mode": "navigate" }))).toBe(true);
  });

  it("is off for fetch() calls", () => {
    expect(isNavigationRequest(new Headers({ "sec-fetch-mode": "cors", accept: "*/*" }))).toBe(false);
    // Sec-Fetch-Mode wins over Accept.
    expect(isNavigationRequest(new Headers({ "sec-fetch-mode": "cors", accept: "text/html" }))).toBe(false);
  });

  it("falls back to Accept when Sec-Fetch-Mode is missing", () => {
    expect(isNavigationRequest(new Headers({ accept: "text/html,application/xhtml+xml" }))).toBe(true);
    expect(isNavigationRequest(new Headers({ accept: "*/*" }))).toBe(false);
    expect(isNavigationRequest(new Headers())).toBe(false);
  });

  it("is on when the form names its own redirect pages, even from fetch()", () => {
    const fetchHeaders = new Headers({ "sec-fetch-mode": "cors" });
    expect(isRedirectMode(fetchHeaders, {})).toBe(false);
    expect(isRedirectMode(fetchHeaders, { _redirect: "https://acme.com/thanks" })).toBe(true);
    expect(isRedirectMode(fetchHeaders, { _error_redirect: "https://acme.com/oops" })).toBe(true);
    expect(isRedirectMode(fetchHeaders, { _redirect: "" })).toBe(false);
  });
});

describe("redirect targets", () => {
  it("uses the website's own thank-you page when given", () => {
    expect(successRedirectUrl({ custom: "https://acme.com/thanks", appUrl: APP })).toBe("https://acme.com/thanks");
  });

  it("falls back to Flowdesk's success page", () => {
    expect(successRedirectUrl({ custom: null, appUrl: APP })).toBe(`${APP}/form-result?status=success`);
  });

  it("adds ?error=<code> to the website's own error page", () => {
    expect(
      errorRedirectUrl({ custom: "https://acme.com/oops?src=form", appUrl: APP, code: "rate_limited" }),
    ).toBe("https://acme.com/oops?src=form&error=rate_limited");
  });

  it("falls back to Flowdesk's error page, with the invalid field names", () => {
    expect(
      errorRedirectUrl({
        custom: null,
        appUrl: APP,
        code: "validation_failed",
        fieldNames: ["email", "subject"],
      }),
    ).toBe(`${APP}/form-result?status=error&code=validation_failed&fields=email%2Csubject`);
  });

  it("redirects with 303 and never caches", () => {
    const response = redirectTo("https://acme.com/thanks");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://acme.com/thanks");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("CORS", () => {
  it("adds the allow headers only for an allowed origin", () => {
    const headers = corsHeaders("https://acme.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://acme.com");
    expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(headers["Access-Control-Allow-Headers"]).toBe("Content-Type");
    expect(headers["Access-Control-Max-Age"]).toBe("86400");
    expect(headers.Vary).toBe("Origin");
  });

  it("sends no Access-Control headers otherwise, but still varies on Origin", () => {
    expect(corsHeaders(null)).toEqual({ Vary: "Origin" });
  });
});

describe("JSON responses", () => {
  it("returns 201 { ok: true }", async () => {
    const response = successJson("https://acme.com");
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("access-control-allow-origin")).toBe("https://acme.com");
  });

  it("returns the documented error shape and status", async () => {
    const response = errorJson("validation_failed", { fields: { email: "Enter a valid email address." } }, null);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "validation_failed",
        message: "Some fields are missing or invalid.",
        fields: { email: "Enter a valid email address." },
      },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("maps every code to its documented HTTP status", () => {
    const expected = {
      invalid_body: 400,
      validation_failed: 400,
      invalid_form_key: 403,
      origin_not_allowed: 403,
      payload_too_large: 413,
      unsupported_media_type: 415,
      rate_limited: 429,
      server_error: 500,
    } as const;
    for (const [code, status] of Object.entries(expected)) {
      expect(errorJson(code as keyof typeof expected, {}, null).status).toBe(status);
    }
  });

  it("sets Retry-After for rate limits", () => {
    expect(errorJson("rate_limited", { retryAfter: 42 }, null).headers.get("retry-after")).toBe("42");
  });

  it("recognises only real error codes", () => {
    expect(isErrorCode("rate_limited")).toBe(true);
    expect(isErrorCode("toString")).toBe(false);
    expect(isErrorCode("<script>")).toBe(false);
    expect(isErrorCode(undefined)).toBe(false);
  });
});
