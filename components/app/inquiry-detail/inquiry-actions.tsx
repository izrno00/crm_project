"use client";

import { useState, useTransition } from "react";
import {
  RiArchiveLine,
  RiArrowGoBackLine,
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiMailUnreadLine,
  RiMoreLine,
  RiUserUnfollowLine,
} from "@remixicon/react";
import { reportResult } from "@/components/app/inquiry-detail/report-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  deleteCustomer,
  deleteInquiry,
  markInquiryAnswered,
  markInquiryUnanswered,
  markInquiryUnread,
  setInquiryArchived,
} from "@/lib/actions/inquiries";
import type { ActionResult } from "@/lib/actions/types";
import type { InquiryDetail } from "@/lib/queries/inquiry-detail";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail;

type Props = {
  inquiry: Pick<
    InquiryDetail,
    | "id"
    | "customerId"
    | "customerName"
    | "customerEmail"
    | "status"
    | "isArchived"
    | "answeredManually"
    | "hasSentReply"
    | "customerInquiryCount"
    | "customerMessageCount"
  >;
  /** Replies on this inquiry, for the "Delete inquiry" dialog. */
  replyCount: number;
  /** The list view to return to after a delete or "Mark as unread" (see lib/inquiry-nav.ts). */
  back: string;
};

// The actions of the inquiry header (DET-7): Mark as answered and Archive as buttons, the rest in a
// "…" menu with the destructive ones set apart in red. An archived inquiry is read-only (agreed
// 2026-11-08): only Mark as unread and the deletes remain; it is restored from the banner.
// Every action is also checked on the server; hiding a button is never the protection.
export function InquiryActions({ inquiry, replyCount, back }: Props) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"inquiry" | "customer" | null>(null);

  // Actions that redirect on success (deletes, Mark as unread) never return; the page navigates away.
  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      reportResult(result);
      if (!result.ok) setDialog(null);
    });
  }

  const canMarkAnswered = !inquiry.isArchived && inquiry.status !== "answered";
  const canMarkUnanswered =
    !inquiry.isArchived &&
    inquiry.status === "answered" &&
    inquiry.answeredManually &&
    !inquiry.hasSentReply;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.actions.label}>
      {canMarkAnswered ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(() => markInquiryAnswered(inquiry.id))}
        >
          <RiCheckDoubleLine data-icon="inline-start" />
          {t.actions.markAnswered}
        </Button>
      ) : null}

      {!inquiry.isArchived ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setInquiryArchived(inquiry.id, true))}
        >
          <RiArchiveLine data-icon="inline-start" />
          {t.actions.archive}
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon" disabled={pending} aria-label={t.actions.more} />}
        >
          <RiMoreLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem onClick={() => run(() => markInquiryUnread(inquiry.id, back))}>
            <RiMailUnreadLine />
            {t.actions.markUnread}
          </DropdownMenuItem>
          {canMarkUnanswered ? (
            <DropdownMenuItem onClick={() => run(() => markInquiryUnanswered(inquiry.id))}>
              <RiArrowGoBackLine />
              {t.actions.markUnanswered}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("inquiry")}>
            <RiDeleteBinLine />
            {t.actions.deleteInquiry}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("customer")}>
            <RiUserUnfollowLine />
            {t.actions.deleteCustomer}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={dialog === "inquiry"}
        onOpenChange={(open) => {
          if (!open && !pending) setDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteInquiryDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteInquiryDialog.description(replyCount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t.deleteInquiryDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => deleteInquiry(inquiry.id, back))}
            >
              {pending ? <Spinner aria-label={t.actions.working} /> : null}
              {t.deleteInquiryDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialog === "customer"}
        onOpenChange={(open) => {
          if (!open && !pending) setDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteCustomerDialog.title(inquiry.customerName)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteCustomerDialog.description(
                inquiry.customerEmail,
                inquiry.customerInquiryCount,
                inquiry.customerMessageCount,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t.deleteCustomerDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => deleteCustomer(inquiry.customerId, back))}
            >
              {pending ? <Spinner aria-label={t.actions.working} /> : null}
              {t.deleteCustomerDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
