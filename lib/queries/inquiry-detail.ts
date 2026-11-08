import "server-only";
import { getProfile, requireBusiness } from "@/lib/dal";
import { replySubject, signatureFor } from "@/lib/email/reply-content";
import { describeSendError } from "@/lib/email/send-errors";
import { formatAddress, resolveSender, senderEnvFromProcess } from "@/lib/email/sender";
import { buildTimeline, TIMELINE_EVENT_TYPES, type TimelineItem } from "@/lib/inquiry-timeline";
import { toStatus, type InquiryStatus } from "@/lib/queries/dashboard";
import { requestTime } from "@/lib/time";
import { idSchema } from "@/lib/validation";

// Inquiry detail reads (Tech.md §11.4). Every query runs with the signed-in owner's own client, so
// Row Level Security limits it to their business. Nothing here is cached across requests (Tech.md §3).

export type InquiryDetail = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  createdAt: string;
  status: InquiryStatus;
  isUnread: boolean;
  isArchived: boolean;
  answeredManually: boolean;
  /** At least one reply was accepted by the email provider. */
  hasSentReply: boolean;
  /** The inquiry has its one reply (sent, failed or sending), so the composer is not shown (REP-11). */
  hasReply: boolean;
  /** What the composer shows above and below the textarea: the email as the customer will get it. */
  composer: ReplyComposerContext;
  /** The connected website it came from; null when that website was removed. */
  sourceName: string | null;
  timeline: TimelineItem[];
  /** For the "Delete customer" dialog: everything that would be removed with the customer. */
  customerInquiryCount: number;
  customerMessageCount: number;
};

export type ReplyComposerContext = {
  /** `Customer Name <customer@example.com>` */
  to: string;
  /** `Sender Name <sender@example.com>`, as customers see it. */
  from: string;
  subject: string;
  /** The signature added below the reply. */
  signature: string;
};

const DETAIL_COLUMNS =
  "id, customer_id, customer_name, customer_email, subject, message, created_at, status, is_unread, is_archived, answered_manually, source_id";

// The inquiry with its replies and status events, or null when it does not exist, belongs to
// another business (RLS hides it) or the id is not a valid uuid. The caller turns null into a 404.
export async function getInquiryDetail(id: string): Promise<InquiryDetail | null> {
  if (!idSchema.safeParse(id).success) return null;
  const { supabase, business } = await requireBusiness();

  const [inquiry, messages, events, sources, profile] = await Promise.all([
    supabase
      .from("inquiries_view")
      .select(DETAIL_COLUMNS)
      .eq("business_id", business.id)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, status, created_at, last_attempt_at, sent_at, content, body_text, error_message, from_name")
      .eq("business_id", business.id)
      .eq("inquiry_id", id)
      .eq("direction", "outbound")
      .order("created_at", { ascending: true }),
    supabase
      .from("inquiry_events")
      .select("id, type, created_at")
      .eq("business_id", business.id)
      .eq("inquiry_id", id)
      .in("type", [...TIMELINE_EVENT_TYPES])
      .order("created_at", { ascending: true }),
    supabase.from("inquiry_sources").select("id, name").eq("business_id", business.id),
    getProfile(),
  ]);

  if (inquiry.error) throw inquiry.error;
  if (messages.error) throw messages.error;
  if (events.error) throw events.error;
  if (sources.error) throw sources.error;

  const row = inquiry.data;
  if (!row?.id || !row.customer_id || !row.created_at) return null;

  const [inquiryCount, messageCount] = await Promise.all([
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("customer_id", row.customer_id),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("customer_id", row.customer_id),
  ]);
  if (inquiryCount.error) throw inquiryCount.error;
  if (messageCount.error) throw messageCount.error;

  // Read after the session check and the queries, so the time is only taken at request time (lib/time.ts).
  const now = requestTime();
  // A failed reply shows a plain-language reason. The provider's raw error is mapped here, on the
  // server, so it never reaches the page (Tech.md §9.1).
  const messageRows = (messages.data ?? []).map((m) => ({
    ...m,
    error_message: m.status === "failed" ? describeSendError(m.error_message) : null,
  }));
  const customerName = row.customer_name ?? "";
  const customerEmail = row.customer_email ?? "";

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName,
    customerEmail,
    subject: row.subject ?? "",
    message: row.message ?? "",
    createdAt: row.created_at,
    status: toStatus(row.status),
    isUnread: row.is_unread ?? false,
    isArchived: row.is_archived ?? false,
    answeredManually: row.answered_manually ?? false,
    hasSentReply: messageRows.some((m) => m.status === "sent"),
    hasReply: messageRows.length > 0,
    composer: {
      to: formatAddress(customerName, customerEmail),
      from: resolveSender(business, senderEnvFromProcess()).from,
      subject: replySubject(row.subject ?? ""),
      signature: signatureFor(business, profile.fullName),
    },
    sourceName: (sources.data ?? []).find((s) => s.id === row.source_id)?.name ?? null,
    timeline: buildTimeline(messageRows, events.data ?? [], now),
    customerInquiryCount: inquiryCount.count ?? 0,
    customerMessageCount: messageCount.count ?? 0,
  };
}
