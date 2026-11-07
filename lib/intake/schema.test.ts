import { describe, expect, it } from "vitest";
import { parseInquiry } from "@/lib/intake/schema";

const valid = {
  name: "Ana Horvat",
  email: "ana@example.com",
  subject: "Quote for a bathroom",
  message: "Hello,\nCould you send me a quote?",
};

describe("parseInquiry", () => {
  it("accepts a valid inquiry and trims the values", () => {
    const result = parseInquiry({
      name: "  Ana Horvat ",
      email: " ana@example.com ",
      subject: " Quote ",
      message: "  Hi  ",
    });
    expect(result).toEqual({
      ok: true,
      data: { name: "Ana Horvat", email: "ana@example.com", subject: "Quote", message: "Hi" },
    });
  });

  it("keeps line breaks inside the message", () => {
    const result = parseInquiry(valid);
    expect(result.ok && result.data.message).toBe("Hello,\nCould you send me a quote?");
  });

  it("reports every missing field with one message each", () => {
    const result = parseInquiry({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fields).sort()).toEqual(["email", "message", "name", "subject"]);
      expect(result.fields.email).toBe("Enter your email address.");
    }
  });

  it("treats whitespace-only values as missing", () => {
    const result = parseInquiry({ ...valid, name: "   ", message: "\n\n" });
    expect(!result.ok && Object.keys(result.fields).sort()).toEqual(["message", "name"]);
  });

  it("rejects an invalid email address", () => {
    const result = parseInquiry({ ...valid, email: "not-an-email" });
    expect(!result.ok && result.fields.email).toBe("Enter a valid email address.");
  });

  it("rejects line breaks in the subject (email header injection)", () => {
    for (const subject of ["Hi\r\nBcc: victim@example.com", "Hi\nthere", "Hi there"]) {
      const result = parseInquiry({ ...valid, subject });
      expect(!result.ok && result.fields.subject).toBe("Remove line breaks from the subject.");
    }
  });

  it("rejects control characters in the name", () => {
    const result = parseInquiry({ ...valid, name: "Ana\nHorvat" });
    expect(!result.ok && result.fields.name).toBe("Remove line breaks and special characters.");
  });

  it("rejects a NUL character in the message", () => {
    const result = parseInquiry({ ...valid, message: "Hi\u0000there" });
    expect(result.ok).toBe(false);
  });

  it("enforces the maximum lengths", () => {
    expect(parseInquiry({ ...valid, name: "a".repeat(200) }).ok).toBe(true);
    expect(parseInquiry({ ...valid, name: "a".repeat(201) }).ok).toBe(false);
    expect(parseInquiry({ ...valid, subject: "a".repeat(201) }).ok).toBe(false);
    expect(parseInquiry({ ...valid, message: "a".repeat(5000) }).ok).toBe(true);
    expect(parseInquiry({ ...valid, message: "a".repeat(5001) }).ok).toBe(false);
    expect(parseInquiry({ ...valid, email: `${"a".repeat(250)}@x.co` }).ok).toBe(false);
  });

  it("never repeats the submitted values in its error messages", () => {
    const secret = "very-secret-value-123";
    const result = parseInquiry({ ...valid, email: secret });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rejects non-string values", () => {
    expect(parseInquiry({ ...valid, name: 42 }).ok).toBe(false);
    expect(parseInquiry({ ...valid, message: ["a"] }).ok).toBe(false);
  });
});
