import Link from "next/link";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatReceived } from "@/lib/format";
import type { InquiryListParams } from "@/lib/inquiry-list";
import { inquiryHref } from "@/lib/inquiry-nav";
import type { InquiryListItem } from "@/lib/queries/inquiries";
import { cn } from "@/lib/utils";
import { en } from "@/lib/strings/en";

const t = en.inquiries;

type Props = {
  items: InquiryListItem[];
  timeZone: string;
  now: number;
  /** Website names by source id; the column only appears when `showSource` is true (LIST-1). */
  sourceNames: Record<string, string>;
  showSource: boolean;
  /** The current list view; each row link remembers it so the detail page can return to it. */
  view: InquiryListParams;
};

// The desktop list (LIST-1). The whole row is clickable through one stretched link in the
// customer cell, so keyboard users get a single tab stop per inquiry. Unread rows (LIST-2) are
// bold with a dot.
export function InquiryTable({ items, timeZone, now, sourceNames, showSource, view }: Props) {
  return (
    <Table className="table-fixed">
      <TableCaption className="sr-only">{t.tableCaption}</TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-40">{t.columns.status}</TableHead>
          <TableHead className="w-[28%]">{t.columns.customer}</TableHead>
          <TableHead>{t.columns.subject}</TableHead>
          {showSource ? <TableHead className="w-40">{t.columns.website}</TableHead> : null}
          <TableHead className="w-36 text-right">{t.columns.received}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((inquiry) => (
          <TableRow
            key={inquiry.id}
            className="relative has-[a:focus-visible]:bg-muted has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-ring"
          >
            <TableCell>
              <StatusBadge status={inquiry.status} />
            </TableCell>
            <TableCell>
              <Link
                href={inquiryHref(inquiry.id, view)}
                className="flex items-start gap-2.5 outline-none after:absolute after:inset-0"
              >
                {inquiry.isUnread ? (
                  <>
                    <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <span className="sr-only">{t.unread}</span>
                  </>
                ) : (
                  <span aria-hidden="true" className="mt-1.5 size-2 shrink-0" />
                )}
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm",
                      inquiry.isUnread ? "font-semibold" : "font-medium",
                    )}
                  >
                    {inquiry.customerName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {inquiry.customerEmail}
                  </span>
                </span>
              </Link>
            </TableCell>
            <TableCell className={cn("truncate", inquiry.isUnread && "font-semibold")}>
              {inquiry.subject}
            </TableCell>
            {showSource ? (
              <TableCell className="truncate text-muted-foreground">
                {(inquiry.sourceId && sourceNames[inquiry.sourceId]) || t.unknownWebsite}
              </TableCell>
            ) : null}
            <TableCell className="text-right text-muted-foreground tabular-nums">
              <time dateTime={inquiry.createdAt}>
                {formatReceived(inquiry.createdAt, timeZone, now)}
              </time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
