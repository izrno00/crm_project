import "server-only";
import { requireBusiness } from "@/lib/dal";
import {
  escapeLikePattern,
  PAGE_SIZE,
  type InquiryListParams,
} from "@/lib/inquiry-list";
import { toStatus, type InquirySummary } from "@/lib/queries/dashboard";

// Inquiry list reads (Tech.md §11.3). Every query runs with the signed-in owner's own client, so
// Row Level Security limits it to their business. Nothing here is cached across requests (Tech.md §3).

const HOURS_48_MS = 48 * 60 * 60 * 1000;

// Postgres error code PostgREST returns when the requested page starts past the last row.
const RANGE_NOT_SATISFIABLE = "PGRST103";

export type InquiryListItem = InquirySummary & {
  customerEmail: string;
  sourceId: string | null;
};

export type InquiryListResult =
  | {
      outOfRange: false;
      items: InquiryListItem[];
      total: number;
      page: number;
      pageCount: number;
      /** Connected website names by source id. */
      sourceNames: Record<string, string>;
      /** The Website column is only shown when the business has more than one source (LIST-1). */
      showSource: boolean;
    }
  | { outOfRange: true; lastPage: number };

// The filter methods the list needs. Both the page query and the out-of-range count use the
// same filters, so they are applied by one function.
interface Filterable {
  eq(column: string, value: string): this;
  is(column: string, value: null): this;
  not(column: string, operator: "is", value: null): this;
  gt(column: string, value: string): this;
  lte(column: string, value: string): this;
  ilike(column: string, pattern: string): this;
}

// Filters go on the base columns (answered_at, created_at, archived_at), never on the derived
// `status`, so the indexes are used (DB.md §6).
function applyFilters<T extends Filterable>(
  query: T,
  businessId: string,
  { status, q }: Pick<InquiryListParams, "status" | "q">,
  now: number,
): T {
  const cutoff = new Date(now - HOURS_48_MS).toISOString();
  let filtered = query.eq("business_id", businessId);

  switch (status) {
    case "archived":
      filtered = filtered.not("archived_at", "is", null);
      break;
    case "answered":
      filtered = filtered.is("archived_at", null).not("answered_at", "is", null);
      break;
    case "unanswered":
      filtered = filtered.is("archived_at", null).is("answered_at", null);
      break;
    case "new":
      filtered = filtered.is("archived_at", null).is("answered_at", null).gt("created_at", cutoff);
      break;
    case "awaiting":
      filtered = filtered.is("archived_at", null).is("answered_at", null).lte("created_at", cutoff);
      break;
    default:
      filtered = filtered.is("archived_at", null);
  }

  // search_text is a generated, trigram-indexed column: lower(name || email || subject).
  if (q) filtered = filtered.ilike("search_text", `%${escapeLikePattern(q)}%`);
  return filtered;
}

const LIST_COLUMNS =
  "id, customer_name, customer_email, subject, created_at, status, is_unread, source_id";

// One page of the owner's inquiries plus the total, for the current filter, search, sort and page.
// `now` is the request time (see lib/time.ts); it decides which unanswered inquiries are New.
export async function getInquiryList(
  params: InquiryListParams,
  now: number,
): Promise<InquiryListResult> {
  const { supabase, business } = await requireBusiness();
  const from = (params.page - 1) * PAGE_SIZE;

  const [rows, sources] = await Promise.all([
    applyFilters(
      supabase.from("inquiries_view").select(LIST_COLUMNS, { count: "exact" }),
      business.id,
      params,
      now,
    )
      .order("created_at", { ascending: params.sort === "asc" })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1),
    supabase.from("inquiry_sources").select("id, name").eq("business_id", business.id),
  ]);

  if (sources.error) throw sources.error;

  if (rows.error) {
    if (rows.error.code !== RANGE_NOT_SATISFIABLE) throw rows.error;
    // The page is past the end: count the matches so the caller can redirect to the last page.
    const counted = await applyFilters(
      supabase.from("inquiries_view").select("id", { count: "exact", head: true }),
      business.id,
      params,
      now,
    );
    if (counted.error) throw counted.error;
    return { outOfRange: true, lastPage: Math.max(1, Math.ceil((counted.count ?? 0) / PAGE_SIZE)) };
  }

  const total = rows.count ?? 0;
  const sourceNames = Object.fromEntries((sources.data ?? []).map((s) => [s.id, s.name]));

  const items = (rows.data ?? []).flatMap((row): InquiryListItem[] =>
    row.id && row.created_at
      ? [
          {
            id: row.id,
            customerName: row.customer_name ?? "",
            customerEmail: row.customer_email ?? "",
            subject: row.subject ?? "",
            createdAt: row.created_at,
            status: toStatus(row.status),
            isUnread: row.is_unread ?? false,
            sourceId: row.source_id,
          },
        ]
      : [],
  );

  return {
    outOfRange: false,
    items,
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    sourceNames,
    showSource: Object.keys(sourceNames).length > 1,
  };
}
