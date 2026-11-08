import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  messageState,
  SENDING_STALE_MS,
  type EventInput,
  type MessageInput,
} from "@/lib/inquiry-timeline";

const NOW = Date.parse("2026-11-08T12:00:00Z");

const message = (overrides: Partial<MessageInput> = {}): MessageInput => ({
  id: "m1",
  status: "sent",
  created_at: "2026-11-08T10:00:00Z",
  last_attempt_at: "2026-11-08T10:00:00Z",
  sent_at: "2026-11-08T10:00:01Z",
  content: "Hello",
  body_text: "Hello\n\n-- \nAcme",
  error_message: null,
  from_name: "Acme",
  ...overrides,
});

const event = (overrides: Partial<EventInput> = {}): EventInput => ({
  id: "e1",
  type: "archived",
  created_at: "2026-11-08T11:00:00Z",
  ...overrides,
});

describe("messageState", () => {
  it("passes sent and failed through", () => {
    expect(messageState(message({ status: "sent" }), NOW)).toBe("sent");
    expect(messageState(message({ status: "failed" }), NOW)).toBe("failed");
  });

  it("treats a recent sending message as still sending", () => {
    const attempt = new Date(NOW - 30_000).toISOString();
    expect(messageState(message({ status: "sending", last_attempt_at: attempt }), NOW)).toBe("sending");
  });

  it("treats a sending message older than 2 minutes as unknown", () => {
    const attempt = new Date(NOW - SENDING_STALE_MS - 1).toISOString();
    expect(messageState(message({ status: "sending", last_attempt_at: attempt }), NOW)).toBe("unknown");
  });

  it("falls back to created_at when there was no attempt time", () => {
    const created = new Date(NOW - 10 * 60_000).toISOString();
    expect(
      messageState(message({ status: "sending", last_attempt_at: null, created_at: created }), NOW),
    ).toBe("unknown");
  });
});

describe("buildTimeline", () => {
  it("merges replies and status events oldest first", () => {
    const items = buildTimeline(
      [message({ id: "m1", created_at: "2026-11-08T10:00:00Z" }), message({ id: "m2", created_at: "2026-11-08T11:30:00Z" })],
      [event({ id: "e1", type: "marked_answered", created_at: "2026-11-08T09:00:00Z" }), event({ id: "e2", created_at: "2026-11-08T11:00:00Z" })],
      NOW,
    );
    expect(items.map((item) => item.id)).toEqual(["e1", "m1", "e2", "m2"]);
    expect(items.map((item) => item.kind)).toEqual(["event", "message", "event", "message"]);
  });

  it("keeps only the four status event types", () => {
    const items = buildTimeline(
      [],
      [
        event({ id: "a", type: "received" }),
        event({ id: "b", type: "reply_sent" }),
        event({ id: "c", type: "reply_failed" }),
        event({ id: "d", type: "marked_answered" }),
        event({ id: "e", type: "marked_unanswered" }),
        event({ id: "f", type: "archived" }),
        event({ id: "g", type: "restored" }),
        event({ id: "h", type: "something_new" }),
      ],
      NOW,
    );
    expect(items.map((item) => item.id)).toEqual(["d", "e", "f", "g"]);
  });

  it("carries the reply details and the failure reason", () => {
    const [item] = buildTimeline(
      [message({ status: "failed", sent_at: null, error_message: "Domain not verified" })],
      [],
      NOW,
    );
    expect(item).toMatchObject({
      kind: "message",
      state: "failed",
      errorMessage: "Domain not verified",
      content: "Hello",
      bodyText: "Hello\n\n-- \nAcme",
      fromName: "Acme",
      sentAt: null,
    });
  });

  it("skips inbound messages, which the MVP does not use", () => {
    expect(buildTimeline([message({ status: "received" })], [], NOW)).toEqual([]);
  });

  it("returns an empty list for an inquiry with no history", () => {
    expect(buildTimeline([], [], NOW)).toEqual([]);
  });

  it("puts a reply before an event at the exact same instant", () => {
    const at = "2026-11-08T10:00:00Z";
    const items = buildTimeline([message({ id: "m", created_at: at })], [event({ id: "e", created_at: at })], NOW);
    expect(items.map((item) => item.id)).toEqual(["m", "e"]);
  });
});
