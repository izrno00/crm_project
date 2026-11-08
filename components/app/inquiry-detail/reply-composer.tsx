"use client";

import { useId, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { RiSendPlaneLine } from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { sendReply } from "@/lib/actions/replies";
import { MAX_REPLY_LENGTH, normalizeNewlines } from "@/lib/email/reply-content";
import type { ReplyComposerContext } from "@/lib/queries/inquiry-detail";
import { en } from "@/lib/strings/en";
import { cn } from "@/lib/utils";

const t = en.inquiries.detail.composer;

// The reply composer (PRD REP-1, REP-13; Tech.md §11.4). Plain text, one reply per inquiry: once
// the reply is saved (sent or failed) the page re-renders without the composer, and a failed reply
// is sent again from its Retry button. The draft is kept in this browser until the reply is saved.

const draftKey = (inquiryId: string) => `flowdesk:reply-draft:${inquiryId}`;

// Browser storage can be unavailable (private mode, blocked site data), so every access is guarded.
function readDraft(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value.trim()) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // The draft is a convenience only.
  }
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function ReplyComposer({
  inquiryId,
  customerName,
  context,
}: {
  inquiryId: string;
  customerName: string;
  context: ReplyComposerContext;
}) {
  const id = useId();
  const key = draftKey(inquiryId);
  // The saved draft is read after hydration (the server renders an empty composer).
  const savedDraft = useSyncExternalStore(subscribeToStorage, () => readDraft(key), () => "");
  // null until the owner types: until then the composer shows the saved draft.
  const [typed, setTyped] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // One id per reply, reused if the owner submits again, so a repeat can never send twice.
  const messageId = useRef<string | null>(null);

  const content = typed ?? savedDraft;
  const length = normalizeNewlines(content).trim().length;
  const tooLong = length > MAX_REPLY_LENGTH;
  const canSend = length > 0 && !tooLong && !pending;

  function change(value: string) {
    setTyped(value);
    writeDraft(key, value);
  }

  function send() {
    if (!canSend) return;
    messageId.current ??= crypto.randomUUID();
    const reply = { inquiryId, messageId: messageId.current, content };

    startTransition(async () => {
      const result = await sendReply(reply);
      // Saved (sent, or failed with Retry in the history): the text now lives in the timeline.
      if (result.ok || result.saved) {
        setTyped("");
        writeDraft(key, "");
      }
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t.heading}
        </CardTitle>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex flex-col gap-6"
      >
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t.to}</dt>
            <dd className="[overflow-wrap:anywhere]">{context.to}</dd>
            <dt className="text-muted-foreground">{t.from}</dt>
            <dd className="[overflow-wrap:anywhere]">{context.from}</dd>
            <dt className="text-muted-foreground">{t.subject}</dt>
            <dd className="[overflow-wrap:anywhere]">{context.subject}</dd>
          </dl>

          <Field data-invalid={tooLong}>
            <FieldLabel htmlFor={`${id}-reply`} className="sr-only">
              {t.label}
            </FieldLabel>
            <Textarea
              id={`${id}-reply`}
              name="content"
              value={content}
              onChange={(event) => change(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  send();
                }
              }}
              readOnly={pending}
              aria-busy={pending}
              aria-invalid={tooLong}
              aria-describedby={`${id}-counter ${id}-signature`}
              placeholder={t.placeholder(customerName)}
              className="min-h-40"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span aria-hidden="true">{t.shortcut}</span>
              <span id={`${id}-counter`} className={cn("tabular-nums", tooLong && "text-destructive")}>
                {t.counter(length, MAX_REPLY_LENGTH)}
              </span>
            </div>
          </Field>

          <div id={`${id}-signature`} className="flex flex-col gap-1">
            <FieldDescription>{t.signatureNote}</FieldDescription>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">
              {context.signature}
            </p>
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={!canSend}>
            {pending ? <Spinner data-icon="inline-start" /> : <RiSendPlaneLine data-icon="inline-start" />}
            {pending ? t.sending : t.send}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
