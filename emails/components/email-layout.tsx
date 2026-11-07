import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

// Shared frame for Flowdesk's own emails (platform notifications and account emails).
// Customer reply emails carry the business's identity instead (a later phase).

const colors = {
  background: "#f4f5f4",
  card: "#ffffff",
  text: "#1c1f1d",
  muted: "#6b716d",
  border: "#e3e6e3",
};

export function EmailLayout({
  brand,
  preview,
  footer,
  children,
}: {
  brand: string;
  preview: string;
  footer: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.background, margin: 0, padding: "32px 0", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
          <Text style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>{brand}</Text>
          <Section style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28 }}>
            {children}
          </Section>
          <Hr style={{ borderColor: colors.border, margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, lineHeight: "18px", color: colors.muted, margin: 0 }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailColors = colors;
