import Link from "next/link";
import { RiInboxLine, RiSearchLine } from "@remixicon/react";
import { DashboardEmpty } from "@/components/app/dashboard/dashboard-empty";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { inquiriesHref, type InquiryListParams } from "@/lib/inquiry-list";
import { en } from "@/lib/strings/en";

const t = en.inquiries;

// What the list shows when the current view has no rows. Each case says why it is empty and offers
// the way back: a search with no match, a filter with no inquiries, or a business with none at all.
export function InquiryListEmpty({ params }: { params: InquiryListParams }) {
  if (params.q) {
    return (
      <Empty className="rounded-4xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiSearchLine />
          </EmptyMedia>
          <EmptyTitle className="font-heading text-xl font-medium">
            {t.empty.searchTitle(params.q)}
          </EmptyTitle>
          <EmptyDescription>{t.empty.searchDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href={inquiriesHref({ status: params.status, sort: params.sort })}
            className={buttonVariants({ variant: "outline" })}
          >
            {t.empty.clearSearch}
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  if (params.status !== "all") {
    return (
      <Empty className="rounded-4xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiInboxLine />
          </EmptyMedia>
          <EmptyTitle className="font-heading text-xl font-medium">{t.empty.filterTitle}</EmptyTitle>
          <EmptyDescription>{t.empty.filterDescription(t.filters[params.status])}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href={inquiriesHref({ sort: params.sort })}
            className={buttonVariants({ variant: "outline" })}
          >
            {t.empty.showAll}
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return <DashboardEmpty />;
}
