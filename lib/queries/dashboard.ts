import "server-only";
import { cache } from "react";
import { requireBusiness } from "@/lib/dal";

// Dashboard reads (Tech.md §11.2). Every query runs with the signed-in owner's own client, so
// Row Level Security limits it to their business. Nothing here is cached across requests
// (Tech.md §3); `cache()` only de-duplicates calls within one request.

export type InquiryStatus = "new" | "awaiting" | "answered";

export const toStatus = (value: string | null): InquiryStatus =>
  value === "answered" || value === "awaiting" ? value : "new";

export type DashboardStats = {
  total: number;
  new: number;
  awaiting: number;
  answered: number;
  unread: number;
};

// Shared by the stat cards, the empty-state check and the sidebar's unread badge.
export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const { supabase, business } = await requireBusiness();
  const { data, error } = await supabase
    .rpc("get_dashboard_stats", { p_business_id: business.id })
    .single();
  if (error) throw error;
  return {
    total: Number(data.total),
    new: Number(data.new),
    awaiting: Number(data.awaiting),
    answered: Number(data.answered),
    unread: Number(data.unread),
  };
});

export type ActivityDay = { day: string; inquiries: number };

// Inquiries per day for the last 30 days, in the business timezone. Archived ones are left out.
export const getInquiryActivity = cache(async (): Promise<ActivityDay[]> => {
  const { supabase, business } = await requireBusiness();
  const { data, error } = await supabase.rpc("get_inquiry_activity", {
    p_business_id: business.id,
    p_days: 30,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({ day: row.day, inquiries: Number(row.inquiries) }));
});

export type InquirySummary = {
  id: string;
  customerName: string;
  subject: string;
  createdAt: string;
  status: InquiryStatus;
  isUnread: boolean;
};

const SUMMARY_COLUMNS = "id, customer_name, subject, created_at, status, is_unread";

type SummaryRow = {
  id: string | null;
  customer_name: string | null;
  subject: string | null;
  created_at: string | null;
  status: string | null;
  is_unread: boolean | null;
};

const toSummary = (row: SummaryRow): InquirySummary | null =>
  row.id && row.created_at
    ? {
        id: row.id,
        customerName: row.customer_name ?? "",
        subject: row.subject ?? "",
        createdAt: row.created_at,
        status: toStatus(row.status),
        isUnread: row.is_unread ?? false,
      }
    : null;

const present = (items: (InquirySummary | null)[]) =>
  items.filter((item): item is InquirySummary => item !== null);

// The 5 most recent non-archived inquiries (DASH-3).
export async function getRecentInquiries(): Promise<InquirySummary[]> {
  const { supabase, business } = await requireBusiness();
  const { data, error } = await supabase
    .from("inquiries_view")
    .select(SUMMARY_COLUMNS)
    .eq("business_id", business.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return present((data ?? []).map(toSummary));
}

// Unanswered, non-archived inquiries, oldest first (DASH-4). Includes New and Awaiting response.
export async function getNeedsAttention(): Promise<InquirySummary[]> {
  const { supabase, business } = await requireBusiness();
  const { data, error } = await supabase
    .from("inquiries_view")
    .select(SUMMARY_COLUMNS)
    .eq("business_id", business.id)
    .is("answered_at", null)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .limit(5);
  if (error) throw error;
  return present((data ?? []).map(toSummary));
}

export type EventType =
  | "received"
  | "reply_sent"
  | "reply_failed"
  | "marked_answered"
  | "marked_unanswered"
  | "archived"
  | "restored";

export type ActivityEvent = {
  id: string;
  type: EventType;
  createdAt: string;
  inquiryId: string;
  customerName: string;
  subject: string;
};

// The last 10 events for the business (DASH-5).
export async function getActivityFeed(): Promise<ActivityEvent[]> {
  const { supabase, business } = await requireBusiness();
  const { data, error } = await supabase
    .from("inquiry_events")
    .select("id, type, created_at, inquiry_id, inquiry:inquiries(customer_name, subject)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const inquiry = Array.isArray(row.inquiry) ? row.inquiry[0] : row.inquiry;
    return {
      id: row.id,
      type: row.type,
      createdAt: row.created_at,
      inquiryId: row.inquiry_id,
      customerName: inquiry?.customer_name ?? "",
      subject: inquiry?.subject ?? "",
    };
  });
}
