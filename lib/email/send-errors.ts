import { en } from "@/lib/strings/en";

// Failed replies (PRD REP-8, Tech.md §9.1). The provider's raw error is stored in
// `messages.error_message` for support, as "{name} ({statusCode}): {message}". The owner only
// ever sees a short, plain-language reason. Resend's test-mode error, for example, names the
// Resend account's own email address, which must not be shown to businesses.

const t = en.sendErrors;

/** The shape of Resend's `error` result (`{ name, statusCode, message }`). */
export type ProviderError = { name: string; statusCode?: number | null; message: string };

/** The raw error as stored in `messages.error_message`. */
export function formatProviderError(error: ProviderError): string {
  const status = error.statusCode ? ` (${error.statusCode})` : "";
  return `${error.name}${status}: ${error.message}`.slice(0, 2000);
}

/** For an exception thrown while sending (a network failure, a missing API key, …). */
export function formatThrownError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return formatProviderError({ name: "exception", message });
}

const STORED = /^([a-z_]+)(?: \((\d+)\))?: ([\s\S]*)$/;

/** The plain-language reason for a stored provider error. */
export function describeSendError(raw: string | null): string {
  if (!raw) return t.rejected;
  const match = raw.match(STORED);
  const name = match?.[1] ?? "";
  const message = (match?.[3] ?? raw).toLowerCase();

  // Resend's test mode only delivers to the Resend account's own address.
  if (message.includes("testing emails") || message.includes("your own email")) return t.testing;

  switch (name) {
    case "invalid_from_address":
      return t.sender;
    case "rate_limit_exceeded":
    case "concurrent_idempotent_requests":
      return t.rateLimited;
    case "daily_quota_exceeded":
    case "monthly_quota_exceeded":
      return t.quota;
    case "missing_api_key":
    case "restricted_api_key":
    case "invalid_api_key":
      return t.config;
    case "application_error":
    case "internal_server_error":
    case "exception":
      return message.includes("resend_api_key") ? t.config : t.unavailable;
  }

  if (message.includes("domain is not verified") || message.includes("not verified")) return t.sender;
  if (message.includes("`to`") || message.includes("recipient")) return t.recipient;
  return t.rejected;
}
