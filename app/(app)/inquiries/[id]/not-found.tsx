import Link from "next/link";
import { RiInboxLine } from "@remixicon/react";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { en } from "@/lib/strings/en";

const t = en.inquiries;

// Shown when the id is not a valid uuid, the inquiry was deleted, or it belongs to another business
// (Row Level Security hides it, so it looks exactly like a missing one).
export default function InquiryNotFound() {
  return (
    <Empty className="rounded-4xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxLine />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl font-medium">{t.detail.notFound.title}</EmptyTitle>
        <EmptyDescription>{t.detail.notFound.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/inquiries" className={buttonVariants({ variant: "outline" })}>
          {t.backToInquiries}
        </Link>
      </EmptyContent>
    </Empty>
  );
}
