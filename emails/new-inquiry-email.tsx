import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout, emailColors } from "@/emails/components/email-layout";
import { renderEmail } from "@/lib/email/render";
import { en } from "@/lib/strings/en";

const t = en.emails.newInquiry;

export type NewInquiryEmailProps = {
  brand: string;
  businessName: string;
  customerName: string;
  subject: string;
  /** The first part of the message, already shortened. */
  messagePreview: string;
  /** Name of the connected website, when the inquiry has one. */
  sourceName: string | null;
  /** Already formatted in the business timezone. */
  receivedAt: string;
  openUrl: string;
};

const label = { fontSize: 12, color: emailColors.muted, margin: "0 0 2px" } as const;
const value = { fontSize: 15, color: emailColors.text, margin: "0 0 14px" } as const;

// All visitor text is rendered as text nodes, never as raw HTML (Tech.md §8.2).
export function NewInquiryEmail(props: NewInquiryEmailProps) {
  return (
    <EmailLayout
      brand={props.brand}
      preview={t.preview(props.customerName)}
      footer={t.footer(props.businessName)}
    >
      <Heading as="h1" style={{ fontSize: 22, fontWeight: 600, color: emailColors.text, margin: "0 0 20px" }}>
        {t.heading}
      </Heading>

      <Text style={label}>{t.from}</Text>
      <Text style={value}>{props.customerName}</Text>

      <Text style={label}>{t.subjectLabel}</Text>
      <Text style={value}>{props.subject}</Text>

      {props.sourceName ? (
        <>
          <Text style={label}>{t.website}</Text>
          <Text style={value}>{props.sourceName}</Text>
        </>
      ) : null}

      <Text style={label}>{t.received}</Text>
      <Text style={value}>{props.receivedAt}</Text>

      <Hr style={{ borderColor: emailColors.border, margin: "6px 0 18px" }} />

      <Text style={{ fontSize: 15, lineHeight: "22px", color: emailColors.text, margin: "0 0 24px", whiteSpace: "pre-wrap" }}>
        {props.messagePreview}
      </Text>

      <Button
        href={props.openUrl}
        style={{
          backgroundColor: emailColors.text,
          color: "#ffffff",
          borderRadius: 999,
          padding: "12px 22px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {t.open}
      </Button>
    </EmailLayout>
  );
}

export const renderNewInquiryEmail = (props: NewInquiryEmailProps) =>
  renderEmail(<NewInquiryEmail {...props} />);
