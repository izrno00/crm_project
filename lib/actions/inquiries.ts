"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/dal";
import { backHref, withNotice } from "@/lib/inquiry-nav";
import { idSchema } from "@/lib/validation";
import { en } from "@/lib/strings/en";
import type { ActionResult } from "@/lib/actions/types";

// Inquiry actions (Tech.md §11.4). Server actions are reachable by direct POST, so each one calls
// the DAL itself (Tech.md §5.3), validates its input, and relies on Row Level Security plus the
// owner RPCs from DB.md §7.3 for the actual permission check. The owner never sends a business id.

const t = en.inquiries.detail;

const invalid: ActionResult = { ok: false, error: t.errors.generic };

// Opening an inquiry marks it read (DET-6). Only an unread inquiry is touched, so a second call
// (React runs effects twice in development) changes nothing.
export async function markInquiryRead(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return invalid;
  const { supabase, business } = await requireBusiness();

  const { error } = await supabase
    .from("inquiries")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id)
    .is("read_at", null);
  if (error) return invalid;

  refresh(); // the sidebar's unread count
  return { ok: true };
}

// "Mark as unread" (DET-6) takes the owner back to the list they came from, like a mail inbox.
export async function markInquiryUnread(id: string, back: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return invalid;
  const { supabase, business } = await requireBusiness();

  const { data, error } = await supabase
    .from("inquiries")
    .update({ read_at: null })
    .eq("id", id)
    .eq("business_id", business.id)
    .select("id");
  if (error) return invalid;
  if (!data?.length) return { ok: false, error: t.errors.notFound };

  // The sidebar's unread count lives in the layout, which a redirect alone does not refresh.
  refresh();
  redirect(withNotice(backHref(back), "inquiry_marked_unread"));
}

export async function markInquiryAnswered(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return invalid;
  const { supabase } = await requireBusiness();

  const { data, error } = await supabase.rpc("mark_inquiry_answered", { p_inquiry_id: id });
  refresh();
  if (error) return invalid;
  // false = nothing changed: it was already answered, or it no longer exists.
  if (!data) return { ok: false, error: t.errors.alreadyAnswered };
  return { ok: true, message: t.toasts.answered };
}

export async function markInquiryUnanswered(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return invalid;
  const { supabase } = await requireBusiness();

  const { data, error } = await supabase.rpc("mark_inquiry_unanswered", { p_inquiry_id: id });
  refresh();
  if (error) return invalid;
  // false = it was not marked answered manually, or a reply has been sent (STAT-3).
  if (!data) return { ok: false, error: t.errors.cannotUnanswer };
  return { ok: true, message: t.toasts.unanswered };
}

export async function setInquiryArchived(id: string, archived: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success || typeof archived !== "boolean") return invalid;
  const { supabase } = await requireBusiness();

  const { data, error } = await supabase.rpc("set_inquiry_archived", {
    p_inquiry_id: id,
    p_archived: archived,
  });
  refresh();
  if (error) return invalid;
  if (!data) return { ok: false, error: archived ? t.errors.alreadyArchived : t.errors.notArchived };
  return { ok: true, message: archived ? t.toasts.archived : t.toasts.restored };
}

// Permanently deletes one inquiry and, by cascade, its replies and history (DET-8).
export async function deleteInquiry(id: string, back: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return invalid;
  const { supabase, business } = await requireBusiness();

  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)
    .select("id");
  if (error) return invalid;
  if (!data?.length) return { ok: false, error: t.errors.notFound };

  refresh(); // the sidebar's unread count
  redirect(withNotice(backHref(back), "inquiry_deleted"));
}

// Permanently deletes a customer with all their inquiries and replies (DET-9, privacy erasure).
// The cascade runs inside the database in one statement (DB.md §2).
export async function deleteCustomer(customerId: string, back: string): Promise<ActionResult> {
  if (!idSchema.safeParse(customerId).success) return invalid;
  const { supabase, business } = await requireBusiness();

  const { data, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId)
    .eq("business_id", business.id)
    .select("id");
  if (error) return invalid;
  if (!data?.length) return { ok: false, error: t.errors.notFound };

  refresh(); // the sidebar's unread count
  redirect(withNotice(backHref(back), "customer_deleted"));
}
