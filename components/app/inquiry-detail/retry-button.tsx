"use client";

import { useTransition } from "react";
import { RiRefreshLine } from "@remixicon/react";
import { reportResult } from "@/components/app/inquiry-detail/report-result";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { retryMessage } from "@/lib/actions/replies";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail.timeline;

// Retry on a failed (or stuck) reply (PRD REP-9). The server re-checks everything: the reply must
// still be failed or stuck, and the inquiry must not be archived.
export function RetryButton({ messageId }: { messageId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="self-start"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          reportResult(await retryMessage(messageId));
        })
      }
    >
      {pending ? <Spinner data-icon="inline-start" /> : <RiRefreshLine data-icon="inline-start" />}
      {pending ? t.retrying : t.retry}
    </Button>
  );
}
