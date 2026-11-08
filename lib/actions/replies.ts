"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { renderReplyEmail } from "@/emails/reply-email";
import { getProfile, requireBusiness } from "@/lib/dal";
import { businessLogoUrl, replySubject, signatureFor } from "@/lib/email/reply-content";
import { describeSendError, formatProviderError, formatThrownError } from "@/lib/email/send-errors";
import { resolveSender, rfcMessageId, senderEnvFromProcess } from "@/lib/email/sender";
import { formatDateTime } from "@/lib/format";
import { messageState } from "@/lib/inquiry-timeline";
import { en } from "@/lib/strings/en";
import { idSchema, replySchema } from "@/lib/validation";
import type { ActionResult, ReplyResult } from "@/lib/actions/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendEmail } from "@/utils/resend/client";

// Replies to customers (PRD §5.6, Tech.md §9). Owners cannot write `messages` through the API
// (DB.md §8), so each action first checks access with an RLS read through the owner's own client,
// builds the email entirely on the server from database rows, and only then writes with the admin
// client. The recipient, sender and business never come from the browser.

const t = en.inquiries.detail;

type Outgoing = {
  from: string;
  to: string;
  replyTo: string;
  bcc: string | null;
  subject: string;
  html: string | null;
  text: string;
  rfcMessageId: string;
};

type Delivery = { ok: true; providerId: string } | { ok: false; error: string };

// One attempt at the provider. Never throws: an exception counts as a failed attempt.
async function deliver(email: Outgoing, idempotencyKey: string, messageId: string): Promise<Delivery> {
  try {
    const { data, error } = await sendEmail(
      {
        from: email.from,
        to: email.to,
        replyTo: email.replyTo,
        bcc: email.bcc ?? undefined,
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
        headers: { "Message-ID": email.rfcMessageId },
      },
      { idempotencyKey },
    );
    if (error) {
      // Ids only: the provider's message can contain the customer's address (Tech.md §14).
      console.error("[reply] email provider rejected the reply", {
        messageId,
        name: error.name,
        statusCode: error.statusCode,
      });
      return { ok: false, error: formatProviderError(error) };
    }
    if (!data?.id) return { ok: false, error: formatThrownError("The provider returned no email id.") };
    return { ok: true, providerId: data.id };
  } catch (error) {
    console.error("[reply] sending the reply failed", { messageId });
    return { ok: false, error: formatThrownError(error) };
  }
}

// Stores the attempt's outcome. The on_message_status trigger then sets `answered_at` on the
// first success and logs the reply_sent / reply_failed event (DB.md §7.4).
async function recordDelivery(messageId: string, delivery: Delivery) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("messages")
    .update(
      delivery.ok
        ? {
            status: "sent" as const,
            sent_at: new Date().toISOString(),
            provider_message_id: delivery.providerId,
            error_message: null,
          }
        : { status: "failed" as const, error_message: delivery.error },
    )
    .eq("id", messageId);
  // The row then stays "sending" and shows as Unknown after two minutes, with Retry.
  if (error) console.error("[reply] could not store the send result", { messageId, code: error.code });
}

const deliveryResult = (delivery: Delivery): ReplyResult =>
  delivery.ok
    ? { ok: true, message: t.toasts.replySent }
    : { ok: false, saved: true, error: t.toasts.replyFailed(describeSendError(delivery.error)) };

/**
 * Sends the inquiry's reply (PRD REP-1 to REP-13). One reply per inquiry (REP-11): a second one is
 * refused here, and the partial unique index on `messages` refuses it even under a race.
 */
export async function sendReply(input: {
  inquiryId: string;
  messageId: string;
  content: string;
}): Promise<ReplyResult> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    const contentError = z.flattenError(parsed.error).fieldErrors.content?.[0];
    return { ok: false, saved: false, error: contentError ?? t.errors.generic };
  }
  const { inquiryId, messageId, content } = parsed.data;
  const { supabase, business, userId } = await requireBusiness();
  const notSaved = (error: string): ReplyResult => ({ ok: false, saved: false, error });

  // RLS read: another business's inquiry is simply not found.
  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries_view")
    .select("id, customer_id, customer_name, customer_email, subject, message, created_at, is_archived")
    .eq("business_id", business.id)
    .eq("id", inquiryId)
    .maybeSingle();
  if (inquiryError) return notSaved(t.errors.generic);
  if (!inquiry?.id || !inquiry.customer_id || !inquiry.customer_email || !inquiry.created_at) {
    return notSaved(t.errors.notFound);
  }
  if (inquiry.is_archived) return notSaved(t.errors.archivedReadOnly);

  const { count, error: countError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("inquiry_id", inquiryId)
    .eq("direction", "outbound");
  if (countError) return notSaved(t.errors.generic);
  if (count) {
    refresh();
    return notSaved(t.errors.alreadyReplied);
  }

  const profile = await getProfile();
  const sender = resolveSender(business, senderEnvFromProcess());
  const subject = replySubject(inquiry.subject ?? "");
  const { html, text } = await renderReplyEmail({
    businessName: business.name,
    logoUrl: businessLogoUrl(business.logo_path, process.env.NEXT_PUBLIC_SUPABASE_URL),
    parts: {
      content,
      signature: signatureFor(business, profile.fullName),
      customerName: inquiry.customer_name ?? "",
      receivedAt: formatDateTime(inquiry.created_at, business.timezone),
      original: inquiry.message ?? "",
    },
  });
  const email: Outgoing = {
    from: sender.from,
    to: inquiry.customer_email,
    replyTo: sender.replyTo,
    bcc: sender.bcc,
    subject,
    html,
    text,
    rfcMessageId: rfcMessageId(messageId, sender.messageIdDomain),
  };

  // Saved before the provider is called, so a crash mid-send leaves a row that can be retried.
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("messages").insert({
    id: messageId,
    business_id: business.id,
    inquiry_id: inquiryId,
    customer_id: inquiry.customer_id,
    direction: "outbound",
    status: "sending",
    from_name: sender.fromName,
    from_email: sender.fromEmail,
    to_email: email.to,
    reply_to_email: sender.replyTo,
    bcc_email: sender.bcc,
    subject,
    content,
    body_text: text,
    body_html: html,
    rfc_message_id: email.rfcMessageId,
    attempt_count: 1,
    last_attempt_at: new Date().toISOString(),
    sent_by: userId,
  });
  if (insertError) {
    // 23505: this message id was already used, or the inquiry already has its one reply.
    if (insertError.code === "23505") {
      refresh();
      return notSaved(t.errors.alreadyReplied);
    }
    console.error("[reply] could not save the reply", { inquiryId, code: insertError.code });
    return notSaved(t.errors.generic);
  }

  const delivery = await deliver(email, `${messageId}:1`, messageId);
  await recordDelivery(messageId, delivery);

  refresh();
  return deliveryResult(delivery);
}

/**
 * Sends a failed (or stuck) reply again (PRD REP-9): the stored text, subject, recipient and
 * Message-ID, with the business's current sender settings. Not available on archived inquiries.
 */
export async function retryMessage(messageId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(messageId).success) return { ok: false, error: t.errors.generic };
  const { supabase, business } = await requireBusiness();

  const { data: message, error } = await supabase
    .from("messages")
    .select(
      "id, inquiry_id, direction, status, created_at, last_attempt_at, attempt_count, to_email, subject, body_html, body_text, rfc_message_id",
    )
    .eq("business_id", business.id)
    .eq("id", messageId)
    .maybeSingle();
  if (error) return { ok: false, error: t.errors.generic };
  if (!message || message.direction !== "outbound") return { ok: false, error: t.errors.notFound };

  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .select("archived_at")
    .eq("business_id", business.id)
    .eq("id", message.inquiry_id)
    .maybeSingle();
  if (inquiryError) return { ok: false, error: t.errors.generic };
  if (!inquiry) return { ok: false, error: t.errors.notFound };
  if (inquiry.archived_at) return { ok: false, error: t.errors.archivedReadOnly };

  const now = Date.now();
  const state = messageState(message, now);
  if (state !== "failed" && state !== "unknown") {
    refresh();
    return { ok: false, error: t.errors.cannotRetry };
  }

  // Claim the attempt: the update only matches while the row is still exactly as read, so a
  // second click (or a second tab) finds nothing to claim and stops here.
  const sender = resolveSender(business, senderEnvFromProcess());
  const attempt = message.attempt_count + 1;
  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin
    .from("messages")
    .update({
      status: "sending",
      attempt_count: attempt,
      last_attempt_at: new Date(now).toISOString(),
      from_name: sender.fromName,
      from_email: sender.fromEmail,
      reply_to_email: sender.replyTo,
      bcc_email: sender.bcc,
    })
    .eq("id", message.id)
    .eq("business_id", business.id)
    .eq("status", message.status)
    .eq("attempt_count", message.attempt_count)
    .select("id");
  if (claimError) return { ok: false, error: t.errors.generic };
  if (!claimed?.length) {
    refresh();
    return { ok: false, error: t.errors.cannotRetry };
  }

  const delivery = await deliver(
    {
      from: sender.from,
      to: message.to_email,
      replyTo: sender.replyTo,
      bcc: sender.bcc,
      subject: message.subject,
      html: message.body_html,
      text: message.body_text,
      rfcMessageId: message.rfc_message_id,
    },
    `${message.id}:${attempt}`,
    message.id,
  );
  await recordDelivery(message.id, delivery);

  refresh();
  const result = deliveryResult(delivery);
  return result.ok ? result : { ok: false, error: result.error };
}
