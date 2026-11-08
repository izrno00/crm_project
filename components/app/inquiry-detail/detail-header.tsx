import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { InquiryActions } from "@/components/app/inquiry-detail/inquiry-actions";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { InquiryDetail } from "@/lib/queries/inquiry-detail";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail;

type Props = {
  inquiry: InquiryDetail;
  /** The list link the owner came from (filter, search, sort, page). */
  backHref: string;
  /** The same view as a query string, passed to the actions that return to the list. */
  backQuery: string;
};

// The back link, the subject as the page heading, the status and the actions (DET-2, DET-3, DET-7).
export function DetailHeader({ inquiry, backHref, backQuery }: Props) {
  const replyCount = inquiry.timeline.filter((item) => item.kind === "message").length;

  return (
    <header className="flex flex-col gap-4">
      <Link
        href={backHref}
        aria-label={t.backLabel}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2.5 self-start" })}
      >
        <RiArrowLeftLine data-icon="inline-start" />
        {t.back}
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-heading text-3xl font-medium [overflow-wrap:anywhere]">
            {inquiry.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={inquiry.status} />
            {inquiry.isArchived ? <Badge variant="outline">{t.archivedBadge}</Badge> : null}
          </div>
        </div>

        <InquiryActions inquiry={inquiry} replyCount={replyCount} back={backQuery} />
      </div>
    </header>
  );
}
