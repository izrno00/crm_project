import { describe, expect, it } from "vitest";
import { renderNewInquiryEmail, type NewInquiryEmailProps } from "@/emails/new-inquiry-email";

const props: NewInquiryEmailProps = {
  brand: "Flowdesk",
  businessName: "Test Business A",
  customerName: "Ana Horvat",
  subject: "Quote for a renovation project",
  messagePreview: "Hello,\nCould you send me a quote?",
  sourceName: "Main website",
  receivedAt: "7 Nov 2026, 14:05",
  openUrl: "https://app.example.com/inquiries/3f2a",
};

describe("new-inquiry notification email", () => {
  it("renders an HTML and a plain-text version with the key details and the link", async () => {
    const { html, text } = await renderNewInquiryEmail(props);

    for (const part of [
      "Ana Horvat",
      "Quote for a renovation project",
      "Main website",
      "7 Nov 2026, 14:05",
      "Could you send me a quote?",
      "Test Business A",
    ]) {
      expect(html).toContain(part);
      expect(text).toContain(part);
    }
    expect(html).toContain("You have a new inquiry");
    // The plain-text conversion upper-cases headings.
    expect(text.toLowerCase()).toContain("you have a new inquiry");
    expect(html).toContain('href="https://app.example.com/inquiries/3f2a"');
    expect(text).toContain("https://app.example.com/inquiries/3f2a");
    expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);
  });

  it("renders visitor text as text, never as HTML", async () => {
    const { html } = await renderNewInquiryEmail({
      ...props,
      customerName: "<script>alert(1)</script>",
      subject: '<img src=x onerror="alert(1)">',
      messagePreview: "<b>bold</b> & <a href='https://evil.example'>click</a>",
    });

    // No visitor-supplied tag becomes a real element...
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>bold</b>");
    expect(html).not.toMatch(/<a\s[^>]*evil\.example/i);
    // ...they are shown as escaped text instead.
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;a href=");
  });

  it("leaves out the website row when the inquiry has no connected website", async () => {
    const { html } = await renderNewInquiryEmail({ ...props, sourceName: null });
    expect(html).not.toContain("Main website");
  });
});
