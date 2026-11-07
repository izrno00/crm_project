"use client";

import { useEffect } from "react";
import { RiErrorWarningLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { en } from "@/lib/strings/en";

// Error boundary for the owner area (Tech.md §12). In Next.js 16.4 the retry prop re-fetches
// and re-renders the segment.
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="rounded-4xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiErrorWarningLine />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl font-medium">{en.appError.title}</EmptyTitle>
        <EmptyDescription>{en.appError.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => retry()}>{en.appError.retry}</Button>
      </EmptyContent>
    </Empty>
  );
}
