import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { en } from "@/lib/strings/en";

const t = en.dashboard.stats;

// Four all-time counts, archived inquiries excluded (DASH-1). Each links to the filtered list (DASH-6).
export async function StatCards() {
  const stats = await getDashboardStats();

  const cards = [
    { key: "total", href: "/inquiries", value: stats.total, ...t.total },
    { key: "new", href: "/inquiries?status=new", value: stats.new, ...t.new },
    { key: "awaiting", href: "/inquiries?status=awaiting", value: stats.awaiting, ...t.awaiting },
    { key: "answered", href: "/inquiries?status=answered", value: stats.answered, ...t.answered },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="group rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card className="h-full transition-colors group-hover:bg-muted/60">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="font-heading text-4xl font-medium tabular-nums">
                {card.value.toLocaleString("en-GB")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-36 rounded-4xl" />
      ))}
    </div>
  );
}
