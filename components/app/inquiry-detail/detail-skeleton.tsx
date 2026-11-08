import { Skeleton } from "@/components/ui/skeleton";

// Loading state for the detail page: the header, then the thread and the reply composer on the left
// and the side cards on the right.
export function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-28 rounded-4xl" />
        <Skeleton className="h-9 w-2/3 rounded-4xl" />
        <Skeleton className="h-5 w-32 rounded-4xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 rounded-4xl" />
          <Skeleton className="h-32 rounded-4xl" />
          {/* The reply composer. */}
          <Skeleton className="h-80 rounded-4xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 rounded-4xl" />
          <Skeleton className="h-36 rounded-4xl" />
        </div>
      </div>
    </div>
  );
}
