import Link from "next/link";
import { Suspense } from "react";
import { RiInboxLine } from "@remixicon/react";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { requireBusiness } from "@/lib/dal";
import { en } from "@/lib/strings/en";

const t = en.inquiries;

// Placeholder for the inquiry detail page until it is built. It loads no inquiry
// data, so there is nothing to leak. It still runs the session, membership and suspension
// check, so a signed-out visitor or a suspended business is redirected as usual.
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-medium">{title}</h1>
      <Suspense fallback={<Skeleton aria-hidden="true" className="h-64 rounded-4xl" />}>
        <ComingSoon />
      </Suspense>
    </div>
  );
}

async function ComingSoon() {
  await requireBusiness();
  return (
    <Empty className="rounded-4xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxLine />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl font-medium">{t.comingSoonTitle}</EmptyTitle>
        <EmptyDescription>{t.comingSoonDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/inquiries" className={buttonVariants({ variant: "outline" })}>
          {t.backToInquiries}
        </Link>
      </EmptyContent>
    </Empty>
  );
}
