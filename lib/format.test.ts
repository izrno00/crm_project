import { describe, expect, it } from "vitest";
import { formatAge, formatAgo, formatDateTime, formatDay, formatReceived } from "@/lib/format";

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = Date.parse("2026-11-07T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("formatDateTime", () => {
  it("shows the time in the business timezone", () => {
    // 23:30 UTC is already the next day, 00:30, in Zagreb (UTC+1 in November).
    expect(formatDateTime("2026-11-07T23:30:00Z", "Europe/Zagreb")).toBe("8 Nov 2026, 00:30");
    expect(formatDateTime("2026-11-07T23:30:00Z", "UTC")).toBe("7 Nov 2026, 23:30");
  });

  it("falls back to UTC for an invalid timezone instead of throwing", () => {
    expect(formatDateTime("2026-11-07T12:00:00Z", "Not/AZone")).toBe("7 Nov 2026, 12:00");
  });
});

describe("formatDay", () => {
  it("formats a calendar day without shifting it", () => {
    expect(formatDay("2026-10-09")).toBe("9 Oct");
    expect(formatDay("2026-01-01")).toBe("1 Jan");
  });
});

describe("formatReceived", () => {
  it("leaves the year out for the current year, in the business timezone", () => {
    // 13:32 UTC is 14:32 in Zagreb (UTC+1 in November).
    expect(formatReceived("2026-11-07T13:32:00Z", "Europe/Zagreb", now)).toBe("7 Nov, 14:32");
  });

  it("adds the year for other years", () => {
    expect(formatReceived("2025-03-02T10:05:00Z", "UTC", now)).toBe("2 Mar 2025, 10:05");
  });

  it("decides the year in the business timezone", () => {
    // 23:30 UTC on 31 Dec 2025 is already 1 Jan 2026 in Zagreb, so no year is shown there.
    expect(formatReceived("2025-12-31T23:30:00Z", "Europe/Zagreb", now)).toBe("1 Jan, 00:30");
    expect(formatReceived("2025-12-31T23:30:00Z", "UTC", now)).toBe("31 Dec 2025, 23:30");
  });

  it("falls back to UTC for an invalid timezone instead of throwing", () => {
    expect(formatReceived("2026-11-07T12:00:00Z", "Not/AZone", now)).toBe("7 Nov, 12:00");
  });
});

describe("formatAge", () => {
  it("handles under a minute", () => {
    expect(formatAge(ago(30_000), now)).toBe("just now");
    expect(formatAge(ago(-5_000), now)).toBe("just now"); // clock skew: a time slightly in the future
  });

  it("uses minutes, then hours up to 48 hours, then days", () => {
    expect(formatAge(ago(MIN), now)).toBe("1 minute");
    expect(formatAge(ago(5 * MIN), now)).toBe("5 minutes");
    expect(formatAge(ago(HOUR), now)).toBe("1 hour");
    expect(formatAge(ago(47 * HOUR), now)).toBe("47 hours");
    expect(formatAge(ago(48 * HOUR), now)).toBe("2 days");
    expect(formatAge(ago(75 * HOUR), now)).toBe("3 days");
  });
});

describe("formatAgo", () => {
  it('adds "ago" except for "just now"', () => {
    expect(formatAgo(ago(10_000), now)).toBe("just now");
    expect(formatAgo(ago(3 * HOUR), now)).toBe("3 hours ago");
  });
});
