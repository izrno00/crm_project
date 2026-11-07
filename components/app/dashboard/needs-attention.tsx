import Link from "next/link";
import { RiArrowRightLine } from "@remixicon/react";
import { InquiryRow } from "@/components/app/inquiry-row";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireBusiness } from "@/lib/dal";
import { formatAge } from "@/lib/format";
import { inquiriesHref } from "@/lib/inquiry-list";
import { getNeedsAttention } from "@/lib/queries/dashboard";
import { requestTime } from "@/lib/time";
import { en } from "@/lib/strings/en";

const t = en.dashboard.attention;

// Unanswered inquiries, oldest first, with how long each has been waiting (DASH-4).
export async function NeedsAttention() {
  await requireBusiness();
  const inquiries = await getNeedsAttention();
  const now = requestTime();

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        {inquiries.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="flex flex-col">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryRow inquiry={inquiry} meta={t.waiting(formatAge(inquiry.createdAt, now))} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={inquiriesHref({ status: "unanswered", sort: "asc" })}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t.viewAll}
          <RiArrowRightLine data-icon="inline-end" />
        </Link>
      </CardFooter>
    </Card>
  );
}
