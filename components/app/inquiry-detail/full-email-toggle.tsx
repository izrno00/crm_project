"use client";

import { useState } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { en } from "@/lib/strings/en";

const t = en.inquiries.detail.timeline;

// "Show full email" under a reply: the email as it was sent, with the signature and the quoted
// original (agreed 2026-11-08). Only this toggle needs client state; the rest of the timeline is
// a server component. The text is plain and rendered as a text node.
export function FullEmailToggle({ bodyText }: { bodyText: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-3">
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="-ml-2.5 self-start" />}>
        <RiArrowDownSLine
          data-icon="inline-start"
          className={cn("transition-transform", open && "rotate-180")}
        />
        {open ? t.hideFullEmail : t.showFullEmail}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="max-h-96 overflow-auto rounded-2xl bg-muted p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
          {bodyText}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
