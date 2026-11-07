// Pure helpers for the inquiry list (Tech.md §11.3). No server-only import, so the server queries,
// the client toolbar and the unit tests can all share them.

export const PAGE_SIZE = 20;
export const MAX_SEARCH_LENGTH = 100;

export const STATUS_FILTERS = ["all", "unanswered", "new", "awaiting", "answered", "archived"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SORT_ORDERS = ["desc", "asc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export type InquiryListParams = {
  status: StatusFilter;
  q: string;
  sort: SortOrder;
  page: number;
};

/** Link to the list. Values that match the defaults are left out, so URLs stay short and clean. */
export function inquiriesHref(params: Partial<InquiryListParams> = {}): string {
  const search = new URLSearchParams();
  if (params.status && params.status !== "all") search.set("status", params.status);
  const q = params.q?.trim();
  if (q) search.set("q", q);
  if (params.sort && params.sort !== "desc") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/inquiries?${query}` : "/inquiries";
}

/**
 * Makes user text safe inside an `ilike` pattern: `\`, `%`, `_` and `,` are matched literally
 * instead of acting as wildcards or separators. In LIKE, a backslash makes the next character literal.
 */
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_,]/g, "\\$&");
}

export type PageItem = number | "…";

/** The page numbers to show: always 7 slots when there are more than 7 pages, e.g. 1 … 4 5 6 … 10. */
export function pageWindow(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

/** First and last row number on a page, for "Showing 21–40 of 134". */
export function pageRange(page: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * PAGE_SIZE + 1;
  return { from, to: Math.min(page * PAGE_SIZE, total) };
}
