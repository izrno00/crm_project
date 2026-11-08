import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, initialsOf } from "@/lib/format";
import type { InquiryDetail } from "@/lib/queries/inquiry-detail";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail.original;

// The first card of the thread: what the customer wrote and when (DET-2). The message is plain
// text and is rendered as a text node, never as HTML.
export function OriginalMessage({
  inquiry,
  timeZone,
}: {
  inquiry: Pick<InquiryDetail, "customerName" | "customerEmail" | "message" | "createdAt">;
  timeZone: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initialsOf(inquiry.customerName || inquiry.customerEmail)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle role="heading" aria-level={2} className="[overflow-wrap:anywhere]">
              {t.from(inquiry.customerName)}
            </CardTitle>
            {/* Wraps on small screens instead of cutting off the time. */}
            <CardDescription className="flex flex-wrap gap-x-1.5">
              <span className="[overflow-wrap:anywhere]">{inquiry.customerEmail}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={inquiry.createdAt}>{formatDateTime(inquiry.createdAt, timeZone)}</time>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
          {inquiry.message}
        </p>
      </CardContent>
    </Card>
  );
}
