import { en } from "@/lib/strings/en";

// The parts of a customer reply email (PRD REP-5, REP-6; Tech.md §8.2). Pure, so the send action,
// the composer preview and the unit tests share one definition of what the customer receives.

/** The longest reply an owner can write (PRD REP-1, DB.md §5.8). */
export const MAX_REPLY_LENGTH = 10_000;

/** The longest signature a business can save (DB.md §5.1). */
export const MAX_SIGNATURE_LENGTH = 1_000;

/** Line breaks from a textarea or the database, normalised to "\n". */
export const normalizeNewlines = (text: string) => text.replace(/\r\n?/g, "\n");

/** `Re: {subject}` on one line, without a second "Re:" when the subject already has one. */
export function replySubject(subject: string): string {
  const clean = subject.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

/** Used when the business has not written its own signature: owner name, then business name. */
export function defaultSignature(ownerName: string, businessName: string): string {
  return [ownerName.trim(), businessName.trim()].filter(Boolean).join("\n");
}

/** The signature added below every reply. */
export function signatureFor(
  business: { signature: string | null; name: string },
  ownerName: string,
): string {
  const own = business.signature ? normalizeNewlines(business.signature).trim() : "";
  return own || defaultSignature(ownerName, business.name);
}

export type ReplyParts = {
  /** What the owner wrote. */
  content: string;
  signature: string;
  customerName: string;
  /** When the inquiry was received, already formatted in the business timezone. */
  receivedAt: string;
  /** The customer's original message. */
  original: string;
};

export const quoteHeader = (parts: Pick<ReplyParts, "receivedAt" | "customerName">) =>
  en.emails.reply.quoteHeader(parts.receivedAt, parts.customerName);

/** Every line prefixed with "> " (a bare ">" for empty lines), as mail clients quote. */
export function quoteLines(text: string): string {
  return normalizeNewlines(text)
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

/**
 * The plain-text email exactly as sent: the reply, the signature, then the quoted original.
 * It is also stored in `messages.body_text` and shown by "Show full email".
 */
export function buildReplyText(parts: ReplyParts): string {
  const sections = [
    normalizeNewlines(parts.content).trim(),
    parts.signature.trim(),
    `${quoteHeader(parts)}\n${quoteLines(parts.original.trim())}`,
  ].filter(Boolean);
  return sections.join("\n\n");
}

/** The public URL of a business logo, for the email header (the bucket is public, DB.md §10). */
export function businessLogoUrl(logoPath: string | null, supabaseUrl: string | undefined) {
  if (!logoPath || !supabaseUrl) return null;
  const path = logoPath.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/business-logos/${path}`;
}
