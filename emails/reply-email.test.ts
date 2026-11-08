import { describe, expect, it } from "vitest";
import { renderReplyEmail, type ReplyEmailProps } from "@/emails/reply-email";

const props: ReplyEmailProps = {
  businessName: "Acme Plumbing",
  logoUrl: null,
  parts: {
    content: "Hi Ana,\n\nYes, we can help with the renovation.",
    signature: "Marko Kovač\nAcme Plumbing",
    customerName: "Ana Horvat",
    receivedAt: "7 Nov 2026, 14:05",
    original: "Hello,\nCould you send me a quote?",
  },
};

describe("customer reply email", () => {
  it("renders the reply, the signature and the quoted original", async () => {
    const { html, text } = await renderReplyEmail(props);

    for (const part of [
      "Yes, we can help with the renovation.",
      "Marko Kovač",
      "On 7 Nov 2026, 14:05, Ana Horvat wrote:",
      "Could you send me a quote?",
    ]) {
      expect(html).toContain(part);
      expect(text).toContain(part);
    }
    expect(text).toContain("> Could you send me a quote?");
    expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);
  });

  it("shows the business name, or the logo when there is one", async () => {
    const withName = await renderReplyEmail(props);
    expect(withName.html).toContain("Acme Plumbing");
    expect(withName.html).not.toContain("<img");

    const withLogo = await renderReplyEmail({
      ...props,
      logoUrl: "https://abc.supabase.co/storage/v1/object/public/business-logos/b/logo-1.png",
    });
    expect(withLogo.html).toMatch(/<img[^>]+src="https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/business-logos\/b\/logo-1\.png"/);
    expect(withLogo.html).toContain('alt="Acme Plumbing"');
  });

  it("has no Flowdesk branding: the email carries the business's identity", async () => {
    const { html, text } = await renderReplyEmail(props);
    expect(html).not.toContain("Flowdesk");
    expect(text).not.toContain("Flowdesk");
  });

  it("renders owner and customer text as text, never as HTML", async () => {
    const { html } = await renderReplyEmail({
      ...props,
      businessName: "<b>Acme</b>",
      parts: {
        ...props.parts,
        content: "<script>alert(1)</script>",
        signature: "<img src=x onerror=alert(1)>",
        original: "<a href='https://evil.example'>click</a>",
      },
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toMatch(/<a\s[^>]*evil\.example/i);
    expect(html).not.toContain("<b>Acme</b>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
