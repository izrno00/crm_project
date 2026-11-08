import { eventIcons } from "@/components/app/event-icons";
import { FullEmailToggle } from "@/components/app/inquiry-detail/full-email-toggle";
import { RetryButton } from "@/components/app/inquiry-detail/retry-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { MessageState, TimelineItem, TimelineMessage } from "@/lib/inquiry-timeline";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail.timeline;

const stateVariant = {
  sent: "secondary",
  failed: "destructive",
  sending: "outline",
  unknown: "outline",
} as const satisfies Record<MessageState, "secondary" | "destructive" | "outline">;

// The communication history (DET-4): replies as cards, status events as thin one-line rows between
// them, oldest first. Replies show their status; a failed one shows a plain-language reason and
// Retry (REP-9), except on an archived inquiry, which is read-only.
export function InquiryTimeline({
  items,
  timeZone,
  isArchived,
}: {
  items: TimelineItem[];
  timeZone: string;
  isArchived: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <ol aria-label={t.label} className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          {item.kind === "message" ? (
            <ReplyCard message={item} timeZone={timeZone} canRetry={!isArchived} />
          ) : (
            <EventRow item={item} timeZone={timeZone} />
          )}
        </li>
      ))}
    </ol>
  );
}

function ReplyCard({
  message,
  timeZone,
  canRetry,
}: {
  message: TimelineMessage;
  timeZone: string;
  canRetry: boolean;
}) {
  const when = message.sentAt ?? message.createdAt;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle role="heading" aria-level={2}>
            {t.reply}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={stateVariant[message.state]}>{t.states[message.state]}</Badge>
            <time dateTime={when} className="text-xs text-muted-foreground">
              {formatDateTime(when, timeZone)}
            </time>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
          {message.content}
        </p>

        {message.state === "failed" ? (
          <p className="text-sm font-medium text-destructive [overflow-wrap:anywhere]">
            {message.errorMessage ? t.failedWith(message.errorMessage) : t.failedUnknownReason}
          </p>
        ) : null}
        {message.state === "unknown" ? (
          <p className="text-sm font-medium text-muted-foreground">{t.unknownHelp}</p>
        ) : null}
        {canRetry && (message.state === "failed" || message.state === "unknown") ? (
          <RetryButton messageId={message.id} />
        ) : null}

        <FullEmailToggle bodyText={message.bodyText} />
      </CardContent>
    </Card>
  );
}

function EventRow({
  item,
  timeZone,
}: {
  item: Extract<TimelineItem, { kind: "event" }>;
  timeZone: string;
}) {
  return (
    <div className="flex items-center gap-3 px-2 text-sm text-muted-foreground">
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted [&_svg]:size-3.5"
      >
        {eventIcons[item.type]}
      </span>
      <span className="font-medium text-foreground">{t.events[item.type]}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={item.createdAt} className="text-xs">
        {formatDateTime(item.createdAt, timeZone)}
      </time>
    </div>
  );
}
