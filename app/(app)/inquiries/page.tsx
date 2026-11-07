import type { Metadata } from "next";
import { Suspense } from "react";
import { InquiryResults } from "@/components/app/inquiries/inquiry-results";
import {
  InquiryResultsSkeleton,
  InquiryToolbarSkeleton,
} from "@/components/app/inquiries/inquiry-skeletons";
import { InquiryToolbar } from "@/components/app/inquiries/inquiry-toolbar";
import type { InquiryListParams } from "@/lib/inquiry-list";
import { en } from "@/lib/strings/en";
import { inquiryListParamsSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Inquiries" };

// The page itself stays synchronous (Tech.md §3): it never awaits the search params. The heading
// is part of the static shell; the toolbar and the results read the params behind their own
// Suspense boundaries and stream in. The URL holds the whole view (LIST-7): status, search, sort, page.
export default function InquiriesPage({ searchParams }: PageProps<"/inquiries">) {
  const params = searchParams.then((raw) => inquiryListParamsSchema.parse(raw));

  return (
    // `group` lets the results dim while the toolbar reports a pending navigation (`data-pending`).
    <div className="group flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-medium">{en.inquiries.listTitle}</h1>

      <Suspense fallback={<InquiryToolbarSkeleton />}>
        <Toolbar params={params} />
      </Suspense>

      <div className="transition-opacity group-has-data-pending:opacity-60">
        <Suspense fallback={<InquiryResultsSkeleton />}>
          <InquiryResults params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Toolbar({ params }: { params: Promise<InquiryListParams> }) {
  const { status, q, sort } = await params;
  return <InquiryToolbar status={status} q={q} sort={sort} />;
}
