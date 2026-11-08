import { describe, expect, it } from "vitest";
import { formatAddress, resolveSender, rfcMessageId, type SenderBusiness } from "@/lib/email/sender";

const business: SenderBusiness = {
  sender_name: "Acme Plumbing",
  sender_email: "acme@mail.flowdesk.app",
  email: "owner@acme.example",
  reply_to_email: null,
  bcc_replies: false,
};

describe("resolveSender", () => {
  it("uses the business sender address once the platform domain is set", () => {
    const sender = resolveSender(business, { platformSendingDomain: "mail.flowdesk.app" });
    expect(sender.from).toBe("Acme Plumbing <acme@mail.flowdesk.app>");
    expect(sender.fromEmail).toBe("acme@mail.flowdesk.app");
    expect(sender.messageIdDomain).toBe("mail.flowdesk.app");
  });

  it("falls back to the development sender without a platform domain", () => {
    const sender = resolveSender(business, { resendFromEmail: "onboarding@resend.dev" });
    expect(sender.from).toBe("Acme Plumbing <onboarding@resend.dev>");
    expect(sender.messageIdDomain).toBe("resend.dev");
    // A blank domain counts as not set.
    expect(resolveSender(business, { platformSendingDomain: "  " }).fromEmail).toBe("onboarding@resend.dev");
  });

  it("accepts a development sender that already carries a name", () => {
    const sender = resolveSender(business, { resendFromEmail: "Flowdesk <dev@test.example>" });
    expect(sender.fromEmail).toBe("dev@test.example");
    expect(sender.from).toBe("Acme Plumbing <dev@test.example>");
  });

  it("replies go to the reply-to address, or the business email by default", () => {
    expect(resolveSender(business, {}).replyTo).toBe("owner@acme.example");
    expect(resolveSender({ ...business, reply_to_email: "help@acme.example" }, {}).replyTo).toBe(
      "help@acme.example",
    );
  });

  it("BCCs the business email only when the toggle is on", () => {
    expect(resolveSender(business, {}).bcc).toBeNull();
    expect(resolveSender({ ...business, bcc_replies: true }, {}).bcc).toBe("owner@acme.example");
  });
});

describe("formatAddress", () => {
  it("leaves plain names unquoted", () => {
    expect(formatAddress("O'Brien & Sons", "a@b.co")).toBe("O'Brien & Sons <a@b.co>");
  });

  it("quotes and escapes names with special characters", () => {
    expect(formatAddress("Acme, Inc.", "a@b.co")).toBe('"Acme, Inc." <a@b.co>');
    expect(formatAddress('Say "hi"', "a@b.co")).toBe('"Say \\"hi\\"" <a@b.co>');
    expect(formatAddress("Kovač d.o.o.", "a@b.co")).toBe('"Kovač d.o.o." <a@b.co>');
  });

  it("never lets a name inject another header line", () => {
    const address = formatAddress("Acme\r\nBcc: victim@example.com", "a@b.co");
    expect(address).not.toMatch(/[\r\n]/);
    expect(address).toBe('"Acme Bcc: victim@example.com" <a@b.co>');
  });

  it("uses the bare address when there is no name", () => {
    expect(formatAddress("  ", "a@b.co")).toBe("a@b.co");
  });
});

describe("rfcMessageId", () => {
  it("builds an angle-bracketed Message-ID", () => {
    expect(rfcMessageId("3f2a", "mail.flowdesk.app")).toBe("<3f2a@mail.flowdesk.app>");
  });
});
