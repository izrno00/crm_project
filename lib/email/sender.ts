import type { Database } from "@/lib/database.types";

// Sender identity for customer replies (PRD REP-3, REP-4, REP-7; Tech.md §8.1). Pure: the
// environment is passed in, so the composer, the Email settings tab, the send action and the unit
// tests all resolve the same From / Reply-To / BCC.

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];

export type SenderBusiness = Pick<
  BusinessRow,
  "sender_name" | "sender_email" | "email" | "reply_to_email" | "bcc_replies"
>;

export type SenderEnv = {
  /** Set once Flowdesk's mail domain is verified. Without it, development mode applies. */
  platformSendingDomain?: string;
  /** Development sender. Resend's shared test address only delivers to the account owner. */
  resendFromEmail?: string;
};

export type ResolvedSender = {
  /** The full From header: `Acme Plumbing <acme@mail.example.com>`. */
  from: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  /** The business email when "BCC me on replies" is on. */
  bcc: string | null;
  /** The domain used in our own `Message-ID` headers: the From address's domain. */
  messageIdDomain: string;
};

const DEV_FROM_EMAIL = "onboarding@resend.dev";

export const senderEnvFromProcess = (): SenderEnv => ({
  platformSendingDomain: process.env.PLATFORM_SENDING_DOMAIN,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
});

// RESEND_FROM_EMAIL may be a bare address or already carry a name ("Name <a@b.c>").
function bareAddress(value: string): string {
  const match = value.match(/<([^<>]+)>/);
  return (match ? match[1] : value).trim();
}

// RFC 5322 "atext" plus spaces: such a name can be used as-is. Anything else is quoted.
const PLAIN_NAME = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~ ]+$/;

/** A display name that is safe in an address header: no line breaks, quoted when needed. */
export function formatAddress(name: string, email: string): string {
  const clean = name.replace(/\p{Cc}+/gu, " ").replace(/\s+/g, " ").trim();
  if (!clean) return email;
  if (PLAIN_NAME.test(clean)) return `${clean} <${email}>`;
  return `"${clean.replace(/["\\]/g, (c) => `\\${c}`)}" <${email}>`;
}

export function resolveSender(business: SenderBusiness, env: SenderEnv): ResolvedSender {
  const production = !!env.platformSendingDomain?.trim();
  const fromEmail = production
    ? business.sender_email
    : bareAddress(env.resendFromEmail?.trim() || DEV_FROM_EMAIL);
  const fromName = business.sender_name;

  return {
    from: formatAddress(fromName, fromEmail),
    fromName,
    fromEmail,
    replyTo: business.reply_to_email || business.email,
    bcc: business.bcc_replies ? business.email : null,
    messageIdDomain: fromEmail.split("@").pop()!.toLowerCase(),
  };
}

/** Our own `Message-ID` for a reply, stored in `messages.rfc_message_id`. */
export const rfcMessageId = (messageId: string, domain: string) => `<${messageId}@${domain}>`;
