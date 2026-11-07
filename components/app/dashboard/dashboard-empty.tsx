import { RiInboxLine } from "@remixicon/react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { en } from "@/lib/strings/en";

const t = en.dashboard.empty;

// Shown when the business has no inquiries yet (DASH-7). It will link to the Integration
// guide once that settings tab exists.
export function DashboardEmpty() {
  return (
    <Empty className="rounded-4xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxLine />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl font-medium">{t.title}</EmptyTitle>
        <EmptyDescription>{t.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
