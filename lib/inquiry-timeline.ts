// Pure timeline logic for the inquiry detail page (Tech.md §11.4). No server-only import, so the
// server components and the unit tests share it.

/** A `sending` message older than this means the process died mid-send (Tech.md §9.1). */
export const SENDING_STALE_MS = 2 * 60 * 1000;

export const TIMELINE_EVENT_TYPES = [
  "marked_answered",
  "marked_unanswered",
  "archived",
  "restored",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

/** What the UI shows for a reply. `unknown` = stuck in `sending`, check before retrying. */
export type MessageState = "sent" | "failed" | "sending" | "unknown";

export type MessageInput = {
  id: string;
  status: "sending" | "sent" | "failed" | "received";
  created_at: string;
  last_attempt_at: string | null;
  sent_at: string | null;
  content: string;
  body_text: string;
  error_message: string | null;
  from_name: string | null;
};

export type EventInput = { id: string; type: string; created_at: string };

export type TimelineMessage = {
  kind: "message";
  id: string;
  createdAt: string;
  /** When the provider accepted it, if it did. */
  sentAt: string | null;
  state: MessageState;
  content: string;
  /** The full email as sent: content, signature and the quoted original. */
  bodyText: string;
  errorMessage: string | null;
  fromName: string | null;
};

export type TimelineEvent = {
  kind: "event";
  id: string;
  createdAt: string;
  type: TimelineEventType;
};

export type TimelineItem = TimelineMessage | TimelineEvent;

const isTimelineEvent = (type: string): type is TimelineEventType =>
  (TIMELINE_EVENT_TYPES as readonly string[]).includes(type);

export function messageState(
  message: Pick<MessageInput, "status" | "created_at" | "last_attempt_at">,
  now: number,
): MessageState {
  if (message.status === "sent") return "sent";
  if (message.status === "failed") return "failed";
  const since = new Date(message.last_attempt_at ?? message.created_at).getTime();
  return now - since > SENDING_STALE_MS ? "unknown" : "sending";
}

/**
 * Merges the replies with the status events (archived, restored, marked answered / unanswered),
 * oldest first. `reply_sent` and `reply_failed` events are left out on purpose: the reply card
 * already shows its own status (they appear in the dashboard feed instead). Inbound messages
 * do not exist in the MVP and are skipped.
 */
export function buildTimeline(
  messages: MessageInput[],
  events: EventInput[],
  now: number,
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...messages.flatMap((message): TimelineMessage[] =>
      message.status === "received"
        ? []
        : [
            {
              kind: "message",
              id: message.id,
              createdAt: message.created_at,
              sentAt: message.sent_at,
              state: messageState(message, now),
              content: message.content,
              bodyText: message.body_text,
              errorMessage: message.error_message,
              fromName: message.from_name,
            },
          ],
    ),
    ...events.flatMap((event): TimelineEvent[] =>
      isTimelineEvent(event.type)
        ? [{ kind: "event", id: event.id, createdAt: event.created_at, type: event.type }]
        : [],
    ),
  ];

  // Array.prototype.sort is stable, so items at the same instant keep messages-before-events order.
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
