import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityFeed } from "@/components/app/dashboard/activity-feed";
import { ActivitySection } from "@/components/app/dashboard/activity-section";
import { DashboardEmpty } from "@/components/app/dashboard/dashboard-empty";
import { NeedsAttention } from "@/components/app/dashboard/needs-attention";
import { RecentInquiries } from "@/components/app/dashboard/recent-inquiries";
import { StatCards, StatCardsSkeleton } from "@/components/app/dashboard/stat-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { requireBusiness } from "@/lib/dal";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Dashboard" };

const t = en.dashboard;

// The heading is part of the static shell. Everything that reads the session or the database
// streams in behind its own Suspense boundary, so the sections appear independently
// (Tech.md §3, §11.2).
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-medium">{t.title}</h1>
        <Suspense fallback={<Skeleton className="h-5 w-64 rounded-full" />}>
          <Welcome />
        </Suspense>
      </div>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<SectionsSkeleton />}>
        <DashboardSections />
      </Suspense>
    </div>
  );
}

async function Welcome() {
  const { business } = await requireBusiness();
  return <p className="text-muted-foreground">{t.welcome(business.name)}</p>;
}

// Sections only make sense once there is something to show. With no inquiries, the
// owner sees the empty state instead (DASH-7). The stats call is shared with the cards above.
async function DashboardSections() {
  const stats = await getDashboardStats();
  if (stats.total === 0) return <DashboardEmpty />;

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton className="h-96" />}>
            <ActivitySection />
          </Suspense>
        </div>
        <Suspense fallback={<CardSkeleton className="h-96" />}>
          <NeedsAttention />
        </Suspense>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton className="h-96" />}>
            <RecentInquiries />
          </Suspense>
        </div>
        <Suspense fallback={<CardSkeleton className="h-96" />}>
          <ActivityFeed />
        </Suspense>
      </div>
    </>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton aria-hidden="true" className={`rounded-4xl ${className ?? ""}`} />;
}

function SectionsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <CardSkeleton className="h-96" />
      <CardSkeleton className="h-96" />
    </div>
  );
}
