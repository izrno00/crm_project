import { describe, expect, it } from "vitest";
import {
  buildReplyText,
  businessLogoUrl,
  defaultSignature,
  quoteLines,
  replySubject,
  signatureFor,
} from "@/lib/email/reply-content";

describe("replySubject", () => {
  it("prefixes Re: to the inquiry subject", () => {
    expect(replySubject("Quote for a renovation")).toBe("Re: Quote for a renovation");
  });

  it("does not add a second Re:", () => {
    expect(replySubject("Re: Quote")).toBe("Re: Quote");
    expect(replySubject("RE: Quote")).toBe("RE: Quote");
  });

  it("keeps the subject on one line", () => {
    expect(replySubject("Line one\r\nline two")).toBe("Re: Line one line two");
  });
});

describe("signatures", () => {
  it("defaults to the owner name and the business name", () => {
    expect(defaultSignature("Ana Horvat", "Acme Plumbing")).toBe("Ana Horvat\nAcme Plumbing");
    expect(defaultSignature("", "Acme Plumbing")).toBe("Acme Plumbing");
  });

  it("uses the business's own signature when it has one", () => {
    expect(signatureFor({ signature: "Best,\r\nThe Acme team", name: "Acme" }, "Ana")).toBe(
      "Best,\nThe Acme team",
    );
    expect(signatureFor({ signature: null, name: "Acme" }, "Ana")).toBe("Ana\nAcme");
    expect(signatureFor({ signature: "   ", name: "Acme" }, "Ana")).toBe("Ana\nAcme");
  });
});

describe("buildReplyText", () => {
  it("is the reply, the signature, then the quoted original", () => {
    const text = buildReplyText({
      content: "Hi Ana,\r\n\r\nYes, we can help.\n",
      signature: "Marko\nAcme Plumbing",
      customerName: "Ana Horvat",
      receivedAt: "7 Nov 2026, 14:05",
      original: "Hello,\n\nCould you send me a quote?",
    });

    expect(text).toBe(
      [
        "Hi Ana,",
        "",
        "Yes, we can help.",
        "",
        "Marko",
        "Acme Plumbing",
        "",
        "On 7 Nov 2026, 14:05, Ana Horvat wrote:",
        "> Hello,",
        ">",
        "> Could you send me a quote?",
      ].join("\n"),
    );
  });

  it("quotes every line", () => {
    expect(quoteLines("a\r\n\r\nb")).toBe("> a\n>\n> b");
  });
});

describe("businessLogoUrl", () => {
  it("builds the public storage URL", () => {
    expect(businessLogoUrl("biz-1/logo-1.png", "https://abc.supabase.co/")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/business-logos/biz-1/logo-1.png",
    );
  });

  it("returns null without a logo", () => {
    expect(businessLogoUrl(null, "https://abc.supabase.co")).toBeNull();
    expect(businessLogoUrl("biz-1/logo.png", undefined)).toBeNull();
  });
});
