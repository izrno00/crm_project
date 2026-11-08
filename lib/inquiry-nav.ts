import { inquiriesHref, type InquiryListParams } from "@/lib/inquiry-list";
import { inquiryListParamsSchema } from "@/lib/validation";

// Links between the inquiry list and the detail page (Tech.md §11.4). The list view (filter,
// search, sort, page) travels in a `back` search param, so "← Inquiries" returns to the exact
// view the owner came from. No server-only import: the server components, the client action
// buttons and the unit tests all share these.
//
// Safety: the `back` value is never used as a link on its own. It is parsed with the same schema
// as the list page and the link is rebuilt with `inquiriesHref()`, so a crafted value can only
// ever lead to `/inquiries?…` on this site.

const MAX_BACK_LENGTH = 300;

/** The list view a `back` value stands for. Anything invalid falls back to the defaults. */
export function parseBackParams(raw: unknown): InquiryListParams {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const text = typeof value === "string" ? value.slice(0, MAX_BACK_LENGTH) : "";

  // Keep the first value of a repeated key, like the list page does.
  const fields: Record<string, string> = {};
  for (const [key, entry] of new URLSearchParams(text)) {
    if (!(key in fields)) fields[key] = entry;
  }
  return inquiryListParamsSchema.parse(fields);
}

/** The link back to the list: always a clean `/inquiries` URL rebuilt from parsed values. */
export function backHref(raw: unknown): string {
  return inquiriesHref(parseBackParams(raw));
}

/** The list view as a query string ("status=new&page=2"), empty for the default view. */
export function listQuery(view?: Partial<InquiryListParams>): string {
  return inquiriesHref(view).split("?")[1] ?? "";
}

/** Link to an inquiry. The list view is remembered in `back` unless it is the default one. */
export function inquiryHref(id: string, view?: Partial<InquiryListParams>): string {
  const query = listQuery(view);
  return query ? `/inquiries/${id}?${new URLSearchParams({ back: query })}` : `/inquiries/${id}`;
}

/** Adds `?notice=<key>`, which the NoticeToast component turns into a toast on the next page. */
export function withNotice(href: string, key: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}notice=${encodeURIComponent(key)}`;
}
