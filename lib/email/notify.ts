import "server-only";
import { renderNewInquiryEmail } from "@/emails/new-inquiry-email";
import { formatDateTime } from "@/lib/format";
import { en } from "@/lib/strings/en";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendEmail } from "@/utils/resend/client";

const PREVIEW_LENGTH = 300;

// Sender for platform emails: "Flowdesk <notifications@{domain}>". Without a verified sending
// domain (development), sendEmail() falls back to RESEND_FROM_EMAIL.
function platformFrom(brand: string): string | undefined {
  const domain = process.env.PLATFORM_SENDING_DOMAIN?.trim();
  return domain ? `${brand} <notifications@${domain}>` : undefined;
}

const shorten = (text: string) =>
  text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;

/**
 * Emails the business that a new inquiry arrived (PRD NOT-1 to NOT-3, Tech.md §9.3).
 * Runs inside `after()`, so it never delays the visitor's response. It never throws:
 * a failed notification must not lose or reject the inquiry. Failures are logged without
 * any visitor data (Tech.md §14).
 */
export async function notifyNewInquiry(inquiryId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: inquiry } = await admin
      .from("inquiries")
      .select("id, business_id, source_id, customer_name, subject, message, created_at")
      .eq("id", inquiryId)
      .maybeSingle();
    if (!inquiry) {
      console.error("[notify] inquiry not found", { inquiryId });
      return;
    }

    const { data: business } = await admin
      .from("businesses")
      .select("name, email, timezone, notify_new_inquiry")
      .eq("id", inquiry.business_id)
      .maybeSingle();
    if (!business) {
      console.error("[notify] business not found", { inquiryId });
      return;
    }
    // Notifications are on by default and can be turned off in business settings (NOT-2).
    if (!business.notify_new_inquiry) return;

    let sourceName: string | null = null;
    if (inquiry.source_id) {
      const { data: source } = await admin
        .from("inquiry_sources")
        .select("name")
        .eq("id", inquiry.source_id)
        .maybeSingle();
      sourceName = source?.name ?? null;
    }

    const brand = process.env.PLATFORM_NAME?.trim() || en.brand;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { html, text } = await renderNewInquiryEmail({
      brand,
      businessName: business.name,
      customerName: inquiry.customer_name,
      subject: inquiry.subject,
      messagePreview: shorten(inquiry.message),
      sourceName,
      receivedAt: formatDateTime(inquiry.created_at, business.timezone),
      openUrl: `${appUrl}/inquiries/${inquiry.id}`,
    });

    const { error } = await sendEmail(
      {
        from: platformFrom(brand),
        to: business.email,
        // Subjects are validated at intake to have no line breaks; strip them anyway for the header.
        subject: en.emails.newInquiry.subject(inquiry.subject.replace(/[\r\n]+/g, " ")),
        html,
        text,
      },
      { idempotencyKey: `notify:${inquiry.id}` },
    );
    if (error) {
      console.error("[notify] email provider rejected the notification", {
        inquiryId,
        name: error.name,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("[notify] notification failed", {
      inquiryId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
