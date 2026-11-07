import Link from "next/link";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { inquiriesHref, pageWindow, type InquiryListParams } from "@/lib/inquiry-list";
import { en } from "@/lib/strings/en";

const t = en.inquiries.pagination;

type Props = { params: InquiryListParams; page: number; pageCount: number };

// Previous / Next with page numbers and "…" gaps (LIST-6). The controls are real links, so they
// work without JavaScript and keep the filter, search and sort in the address (LIST-7). The
// shadcn PaginationLink renders a plain <a>, so the links are built from Link + buttonVariants,
// the same way the dashboard does.
export function InquiryPagination({ params, page, pageCount }: Props) {
  const href = (target: number) => inquiriesHref({ ...params, page: target });

  return (
    <Pagination aria-label={t.label} className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              aria-label={t.previous}
              className={buttonVariants({ variant: "ghost" })}
            >
              <RiArrowLeftSLine data-icon="inline-start" />
              <span className="hidden sm:inline">{t.previous}</span>
            </Link>
          ) : (
            <Button variant="ghost" disabled>
              <RiArrowLeftSLine data-icon="inline-start" />
              <span className="hidden sm:inline">{t.previous}</span>
            </Button>
          )}
        </PaginationItem>

        {/* Small screens have no room for the numbers, so they get "Page 2 of 7" instead. */}
        <PaginationItem className="sm:hidden">
          <span className="px-2 text-sm text-muted-foreground">{t.pageOf(page, pageCount)}</span>
        </PaginationItem>

        {pageWindow(page, pageCount).map((item, index) =>
          item === "…" ? (
            <PaginationItem key={`gap-${index}`} className="hidden sm:block">
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item} className="hidden sm:block">
              <Link
                href={href(item)}
                aria-label={t.goToPage(item)}
                aria-current={item === page ? "page" : undefined}
                className={buttonVariants({
                  variant: item === page ? "outline" : "ghost",
                  size: "icon",
                })}
              >
                {item}
              </Link>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          {page < pageCount ? (
            <Link
              href={href(page + 1)}
              aria-label={t.next}
              className={buttonVariants({ variant: "ghost" })}
            >
              <span className="hidden sm:inline">{t.next}</span>
              <RiArrowRightSLine data-icon="inline-end" />
            </Link>
          ) : (
            <Button variant="ghost" disabled>
              <span className="hidden sm:inline">{t.next}</span>
              <RiArrowRightSLine data-icon="inline-end" />
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
