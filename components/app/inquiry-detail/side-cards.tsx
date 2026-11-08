import { StatusBadge } from "@/components/app/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, initialsOf } from "@/lib/format";
import type { InquiryDetail } from "@/lib/queries/inquiry-detail";
import { en } from "@/lib/strings/en";

const customerText = en.inquiries.detail.customer;
const infoText = en.inquiries.detail.info;

// Who wrote in (DET-1). The email is a mailto link, so the owner can write from their own mail app too.
export function CustomerCard({
  inquiry,
}: {
  inquiry: Pick<InquiryDetail, "customerName" | "customerEmail">;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {customerText.heading}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initialsOf(inquiry.customerName || inquiry.customerEmail)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{inquiry.customerName}</p>
          <a
            href={`mailto:${inquiry.customerEmail}`}
            className="block truncate rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {inquiry.customerEmail}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// The facts about this inquiry: status, when it arrived (in the business timezone, SET-2) and which
// connected website it came from (DET-2, DET-3).
export function DetailsCard({
  inquiry,
  timeZone,
}: {
  inquiry: Pick<InquiryDetail, "status" | "createdAt" | "sourceName">;
  timeZone: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {infoText.heading}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">{infoText.status}</dt>
          <dd className="justify-self-end">
            <StatusBadge status={inquiry.status} />
          </dd>

          <dt className="text-muted-foreground">{infoText.received}</dt>
          <dd className="text-right tabular-nums">
            <time dateTime={inquiry.createdAt}>{formatDateTime(inquiry.createdAt, timeZone)}</time>
          </dd>

          <dt className="text-muted-foreground">{infoText.website}</dt>
          <dd className="truncate text-right">{inquiry.sourceName ?? infoText.unknownWebsite}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
