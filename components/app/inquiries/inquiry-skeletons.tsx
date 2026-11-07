import { Skeleton } from "@/components/ui/skeleton";

// Fallbacks for the list's two Suspense boundaries, sized like the real content to limit layout shift.

export function InquiryToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="hidden h-9 w-[34rem] max-w-full rounded-full lg:block" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-9 flex-1 rounded-4xl" />
        <Skeleton className="h-9 w-full rounded-3xl sm:w-52 lg:hidden" />
        <Skeleton className="h-9 w-full rounded-3xl sm:w-44" />
      </div>
    </div>
  );
}

export function InquiryResultsSkeleton() {
  return <Skeleton aria-hidden="true" className="h-[32rem] rounded-4xl" />;
}
