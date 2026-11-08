import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text, render } from "@react-email/components";
import { emailColors } from "@/emails/components/email-layout";
import {
  buildReplyText,
  normalizeNewlines,
  quoteHeader,
  type ReplyParts,
} from "@/lib/email/reply-content";

// The email a customer receives when the owner replies (PRD REP-6, Tech.md §8.2). It carries the
// business's identity, not Flowdesk's: the logo (or the business name), the owner's text, the
// signature and the quoted original message. All user text is rendered as text nodes, never as
// raw HTML. The plain-text part comes from buildReplyText(), so it matches `messages.body_text`.

export type ReplyEmailProps = {
  businessName: string;
  /** Public URL of the business logo, or null to show the business name instead. */
  logoUrl: string | null;
  parts: ReplyParts;
};

const PREVIEW_LENGTH = 120;

const font = "Helvetica, Arial, sans-serif";
const paragraph = {
  fontSize: 15,
  lineHeight: "23px",
  color: emailColors.text,
  margin: "0 0 20px",
  whiteSpace: "pre-wrap",
} as const;

export function ReplyEmail({ businessName, logoUrl, parts }: ReplyEmailProps) {
  const content = normalizeNewlines(parts.content).trim();
  const preview = content.replace(/\s+/g, " ").slice(0, PREVIEW_LENGTH);

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#ffffff", margin: 0, padding: "24px 0", fontFamily: font }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>
          <Section style={{ borderBottom: `1px solid ${emailColors.border}`, paddingBottom: 16, marginBottom: 24 }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={businessName}
                height="40"
                style={{ height: 40, width: "auto", maxWidth: 200, border: 0 }}
              />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: 600, color: emailColors.text, margin: 0 }}>
                {businessName}
              </Text>
            )}
          </Section>

          <Text style={paragraph}>{content}</Text>
          <Text style={paragraph}>{parts.signature.trim()}</Text>

          <Hr style={{ borderColor: emailColors.border, margin: "8px 0 20px" }} />

          <Text style={{ fontSize: 13, lineHeight: "20px", color: emailColors.muted, margin: "0 0 8px" }}>
            {quoteHeader(parts)}
          </Text>
          <Section style={{ borderLeft: `3px solid ${emailColors.border}`, paddingLeft: 12 }}>
            <Text
              style={{
                fontSize: 14,
                lineHeight: "21px",
                color: emailColors.muted,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {normalizeNewlines(parts.original).trim()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** The HTML and plain-text versions of a reply email. */
export async function renderReplyEmail(props: ReplyEmailProps): Promise<{ html: string; text: string }> {
  const html = await render(<ReplyEmail {...props} />);
  return { html, text: buildReplyText(props.parts) };
}
