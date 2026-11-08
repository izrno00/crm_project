import { describe, expect, it } from "vitest";
import {
  describeSendError,
  formatProviderError,
  formatThrownError,
} from "@/lib/email/send-errors";
import { en } from "@/lib/strings/en";

const t = en.sendErrors;

describe("formatProviderError", () => {
  it("stores the name, status and message", () => {
    expect(
      formatProviderError({ name: "validation_error", statusCode: 422, message: "Invalid `to` field." }),
    ).toBe("validation_error (422): Invalid `to` field.");
    expect(formatProviderError({ name: "application_error", statusCode: null, message: "x" })).toBe(
      "application_error: x",
    );
  });
});

describe("describeSendError", () => {
  it("never shows the address in Resend's test-mode error", () => {
    const raw = formatProviderError({
      name: "validation_error",
      statusCode: 403,
      message:
        "You can only send testing emails to your own email address (owner@platform.example). To send emails to other recipients, please verify a domain.",
    });
    expect(describeSendError(raw)).toBe(t.testing);
    expect(describeSendError(raw)).not.toContain("owner@platform.example");
  });

  it("explains sender problems", () => {
    expect(
      describeSendError(
        formatProviderError({
          name: "validation_error",
          statusCode: 403,
          message: "The unverified.example domain is not verified. Please, add and verify your domain.",
        }),
      ),
    ).toBe(t.sender);
    expect(describeSendError(formatProviderError({ name: "invalid_from_address", statusCode: 422, message: "x" }))).toBe(
      t.sender,
    );
    // Rows stored before this mapping existed (the dev seed) are recognised too.
    expect(describeSendError("The sender domain is not verified with the email provider.")).toBe(t.sender);
  });

  it("explains recipient, rate, quota and configuration problems", () => {
    const of = (name: string, message = "x") => describeSendError(formatProviderError({ name, statusCode: 422, message }));
    expect(of("validation_error", "Invalid `to` field. The email address needs to follow the format.")).toBe(t.recipient);
    expect(of("rate_limit_exceeded")).toBe(t.rateLimited);
    expect(of("daily_quota_exceeded")).toBe(t.quota);
    expect(of("invalid_api_key")).toBe(t.config);
    expect(of("application_error")).toBe(t.unavailable);
  });

  it("treats exceptions as a temporary problem, except a missing API key", () => {
    expect(describeSendError(formatThrownError(new Error("fetch failed")))).toBe(t.unavailable);
    expect(describeSendError(formatThrownError(new Error("RESEND_API_KEY is not set.")))).toBe(t.config);
  });

  it("falls back to a general reason", () => {
    expect(describeSendError(null)).toBe(t.rejected);
    expect(describeSendError("something odd")).toBe(t.rejected);
  });
});
