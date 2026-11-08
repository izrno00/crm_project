import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArchivedBanner } from "@/components/app/inquiry-detail/archived-banner";
import { DetailHeader } from "@/components/app/inquiry-detail/detail-header";
import { DetailSkeleton } from "@/components/app/inquiry-detail/detail-skeleton";
import { InquiryTimeline } from "@/components/app/inquiry-detail/inquiry-timeline";
import { MarkRead } from "@/components/app/inquiry-detail/mark-read";
import { OriginalMessage } from "@/components/app/inquiry-detail/original-message";
import { ReplyComposer } from "@/components/app/inquiry-detail/reply-composer";
import { CustomerCard, DetailsCard } from "@/components/app/inquiry-detail/side-cards";
import { requireBusiness } from "@/lib/dal";
import { inquiriesHref, type InquiryListParams } from "@/lib/inquiry-list";
import { listQuery, parseBackParams } from "@/lib/inquiry-nav";
import { getInquiryDetail } from "@/lib/queries/inquiry-detail";

export const metadata: Metadata = { title: "Inquiry" };

// The page itself stays synchronous (Tech.md §3): it never awaits the route or search params. Both
// are read behind the Suspense boundary, so the loading skeleton is part of the static shell.
export default function InquiryDetailPage({ params, searchParams }: PageProps<"/inquiries/[id]">) {
  const id = params.then((p) => p.id);
  // `back` holds the list view the owner came from (lib/inquiry-nav.ts).
  const view = searchParams.then((raw) => parseBackParams(raw.back));

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <InquiryDetailView id={id} view={view} />
    </Suspense>
  );
}

async function InquiryDetailView({
  id,
  view,
}: {
  id: Promise<string>;
  view: Promise<InquiryListParams>;
}) {
  const [inquiryId, listView] = await Promise.all([id, view]);
  const { business } = await requireBusiness();

  // null = not found, not a valid id, or another business's inquiry (RLS hides it).
  const inquiry = await getInquiryDetail(inquiryId);
  if (!inquiry) notFound();

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        inquiry={inquiry}
        backHref={inquiriesHref(listView)}
        backQuery={listQuery(listView)}
      />

      {inquiry.isArchived ? <ArchivedBanner id={inquiry.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <OriginalMessage inquiry={inquiry} timeZone={business.timezone} />
          <InquiryTimeline
            items={inquiry.timeline}
            timeZone={business.timezone}
            isArchived={inquiry.isArchived}
          />
          {/* One reply per inquiry (PRD REP-11): no composer once a reply exists (a failed one is
              sent again with its Retry button), and none on an archived inquiry, which is read-only. */}
          {!inquiry.isArchived && !inquiry.hasReply ? (
            <ReplyComposer
              key={inquiry.id}
              inquiryId={inquiry.id}
              customerName={inquiry.customerName}
              context={inquiry.composer}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <CustomerCard inquiry={inquiry} />
          <DetailsCard inquiry={inquiry} timeZone={business.timezone} />
        </div>
      </div>

      {inquiry.isUnread ? <MarkRead id={inquiry.id} /> : null}
    </div>
  );
}
