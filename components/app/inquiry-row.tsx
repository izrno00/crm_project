import Link from "next/link";
import { StatusBadge } from "@/components/app/status-badge";
import type { InquirySummary } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import { en } from "@/lib/strings/en";

// One inquiry in the "Recent inquiries" and "Needs attention" cards and in the small-screen list.
// Unread ones are bold with a dot. `href` lets the list keep its view in the link (lib/inquiry-nav.ts).
export function InquiryRow({
  inquiry,
  meta,
  href,
}: {
  inquiry: InquirySummary;
  meta: string;
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/inquiries/${inquiry.id}`}
      className="flex items-start justify-between gap-3 rounded-2xl px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {inquiry.isUnread ? (
          <>
            <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            <span className="sr-only">{en.dashboard.unread}</span>
          </>
        ) : (
          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0" />
        )}
        <div className="min-w-0">
          <p className={cn("truncate text-sm", inquiry.isUnread ? "font-semibold" : "font-medium")}>
            {inquiry.customerName}
          </p>
          <p className="truncate text-sm text-muted-foreground">{inquiry.subject}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={inquiry.status} />
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
    </Link>
  );
}
