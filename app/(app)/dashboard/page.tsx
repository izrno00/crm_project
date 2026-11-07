import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile, requireBusiness } from "@/lib/dal";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Dashboard" };

const t = en.placeholder;

// Placeholder: proves the session, membership and suspension checks work.
// The real dashboard is built in a later phase.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-medium">{t.dashboardTitle}</h1>
      <Suspense fallback={<div className="h-5 w-64 animate-pulse rounded-full bg-muted" />}>
        <DashboardBody />
      </Suspense>
    </div>
  );
}

async function DashboardBody() {
  const { business } = await requireBusiness();
  const profile = await getProfile();
  return (
    <p className="text-muted-foreground">
      {t.dashboardBody(profile.fullName || profile.email, business.name)}
    </p>
  );
}
