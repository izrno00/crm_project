"use client";

import { useTransition } from "react";
import { RiArchiveLine, RiInboxUnarchiveLine } from "@remixicon/react";
import { reportResult } from "@/components/app/inquiry-detail/report-result";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { setInquiryArchived } from "@/lib/actions/inquiries";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail;

// Shown on an archived inquiry (agreed 2026-11-08): Archive keeps the owner on the page, and this
// banner is where they restore it. The inquiry is read-only until then.
export function ArchivedBanner({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Alert>
      <RiArchiveLine />
      <AlertTitle>{t.banner.title}</AlertTitle>
      <AlertDescription>
        <p>{t.banner.description}</p>
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              reportResult(await setInquiryArchived(id, false));
            })
          }
        >
          {pending ? <Spinner aria-label={t.actions.working} /> : <RiInboxUnarchiveLine data-icon="inline-start" />}
          {t.actions.restore}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
