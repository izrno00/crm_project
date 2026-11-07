import { en } from "@/lib/strings/en";

// Date and time formatting. All times are shown in the business timezone (PRD SET-2).

const t = en.time;
const LOCALE = "en-GB";

// A bad timezone name makes Intl throw; fall back to UTC instead of breaking the page.
function formatter(options: Intl.DateTimeFormatOptions, timeZone: string) {
  try {
    return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone });
  } catch {
    return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" });
  }
}

/** "7 Nov 2026, 14:05" in the given timezone. */
export function formatDateTime(value: string | Date, timeZone: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatter(
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    timeZone,
  ).format(date);
}

/**
 * "7 Nov" for a calendar day written as "YYYY-MM-DD" (the activity chart's days are already
 * in the business timezone, so no timezone conversion happens here).
 */
export function formatDay(day: string): string {
  return formatter({ day: "numeric", month: "short" }, "UTC").format(new Date(`${day}T00:00:00Z`));
}

/**
 * "7 Nov, 14:32" in the given timezone, with the year ("7 Nov 2025, 14:32") only when it is not
 * the current year there. `now` is passed in so callers control time.
 */
export function formatReceived(value: string | Date, timeZone: string, now: number): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const yearOf = (d: Date) => formatter({ year: "numeric" }, timeZone).format(d);
  const sameYear = yearOf(date) === yearOf(new Date(now));
  return formatter(
    {
      day: "numeric",
      month: "short",
      ...(sameYear ? {} : { year: "numeric" }),
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    timeZone,
  ).format(date);
}

/** "12 minutes", "5 hours" (up to 48 hours), then "3 days". `now` is passed in so callers control time. */
export function formatAge(from: string | Date, now: number): string {
  const then = typeof from === "string" ? new Date(from).getTime() : from.getTime();
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return t.hours(hours);
  return t.days(Math.floor(hours / 24));
}

/** "just now" or "3 hours ago". */
export function formatAgo(from: string | Date, now: number): string {
  const age = formatAge(from, now);
  return age === t.justNow ? age : t.ago(age);
}
