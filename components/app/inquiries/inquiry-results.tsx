import { redirect } from "next/navigation";
import { InquiryListEmpty } from "@/components/app/inquiries/inquiry-list-empty";
import { InquiryPagination } from "@/components/app/inquiries/inquiry-pagination";
import { InquiryTable } from "@/components/app/inquiries/inquiry-table";
import { InquiryRow } from "@/components/app/inquiry-row";
import { requireBusiness } from "@/lib/dal";
import { formatReceived } from "@/lib/format";
import { inquiriesHref, pageRange, type InquiryListParams } from "@/lib/inquiry-list";
import { getInquiryList } from "@/lib/queries/inquiries";
import { requestTime } from "@/lib/time";
import { en } from "@/lib/strings/en";

const t = en.inquiries;

// The list itself: a table on large screens, stacked rows on small ones, then the result
// summary and pagination (LIST-1, LIST-6). It reads the search params through a promise, so the
// page stays synchronous and the heading and toolbar frame can be part of the static shell.
export async function InquiryResults({ params }: { params: Promise<InquiryListParams> }) {
  const query = await params;
  const { business } = await requireBusiness();
  // Read after the session check, so the time is only taken at request time (lib/time.ts).
  const now = requestTime();

  const result = await getInquiryList(query, now);

  // A page number past the end (an old link, or rows deleted since) goes to the last page.
  if (result.outOfRange) redirect(inquiriesHref({ ...query, page: result.lastPage }));

  const { items, total, page, pageCount, sourceNames, showSource } = result;
  if (total === 0) return <InquiryListEmpty params={query} />;

  const { from, to } = pageRange(page, total);

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden overflow-hidden rounded-4xl border lg:block">
        <InquiryTable
          items={items}
          timeZone={business.timezone}
          now={now}
          sourceNames={sourceNames}
          showSource={showSource}
        />
      </div>

      <ul className="flex flex-col rounded-4xl border p-2 lg:hidden">
        {items.map((inquiry) => (
          <li key={inquiry.id}>
            <InquiryRow
              inquiry={inquiry}
              meta={formatReceived(inquiry.createdAt, business.timezone, now)}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {t.summary(from, to, total)}
        </p>
        {pageCount > 1 ? <InquiryPagination params={query} page={page} pageCount={pageCount} /> : null}
      </div>
    </div>
  );
}
