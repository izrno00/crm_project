import Link from "next/link";
import { eventIcons } from "@/components/app/event-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireBusiness } from "@/lib/dal";
import { formatAgo } from "@/lib/format";
import { getActivityFeed } from "@/lib/queries/dashboard";
import { requestTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { en } from "@/lib/strings/en";

const t = en.dashboard.feed;

// The last events for the business, each linking to its inquiry (DASH-5).
export async function ActivityFeed() {
  await requireBusiness();
  const events = await getActivityFeed();
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
        {events.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="flex flex-col">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/inquiries/${event.inquiryId}`}
                  className="flex items-start gap-3 rounded-2xl px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4",
                      event.type === "reply_failed" && "bg-destructive/10 text-destructive",
                    )}
                  >
                    {eventIcons[event.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t.events[event.type](event.customerName || t.unknownCustomer)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.subject ? `${event.subject} · ` : ""}
                      {formatAgo(event.createdAt, now)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
