"use client";

import { startTransition, useEffect, useEffectEvent, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  inquiriesHref,
  MAX_SEARCH_LENGTH,
  SORT_ORDERS,
  STATUS_FILTERS,
  type SortOrder,
  type StatusFilter,
} from "@/lib/inquiry-list";
import { en } from "@/lib/strings/en";

const t = en.inquiries;

const SEARCH_DEBOUNCE_MS = 300;

const statusItems = STATUS_FILTERS.map((value) => ({ value, label: t.filters[value] }));
const sortItems = SORT_ORDERS.map((value) => ({ value, label: t.sort[value] }));

const isStatusFilter = (value: unknown): value is StatusFilter =>
  (STATUS_FILTERS as readonly unknown[]).includes(value);

type Props = { status: StatusFilter; q: string; sort: SortOrder };

// Status filter, search and sort (LIST-3 to LIST-5). The URL is the single source of truth
// (LIST-7): every control builds a new address and navigates to it, and the server renders the
// matching page. A filter, sort or search change always goes back to page 1.
//
// Pending feedback follows Next's "interactive apps" guide: the controls update at once through
// useOptimistic, and `data-pending` lets the page dim the results while the server responds.
export function InquiryToolbar({ status, q, sort }: Props) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [optimisticSort, setOptimisticSort] = useOptimistic(sort);
  const [isPending, setIsPending] = useOptimistic(false);

  // The search box keeps its own text, so typing is never overwritten while the URL catches up.
  // `committedQ` is the search text this component last sent to the URL; `seenQ` is the last `q`
  // prop it saw. When `q` changes to something this component did not send (the browser's
  // Back/Forward buttons), the box follows the address.
  const [text, setText] = useState(q);
  const [committedQ, setCommittedQ] = useState(q);
  const [seenQ, setSeenQ] = useState(q);
  if (q !== seenQ) {
    setSeenQ(q);
    if (q !== committedQ) {
      setText(q);
      setCommittedQ(q);
    }
  }

  function go(next: { status?: StatusFilter; sort?: SortOrder; q?: string }, replace = false) {
    const nextStatus = next.status ?? optimisticStatus;
    const nextSort = next.sort ?? optimisticSort;
    const nextQ = (next.q ?? text).trim();
    const href = inquiriesHref({ status: nextStatus, q: nextQ, sort: nextSort, page: 1 });
    setCommittedQ(nextQ);
    startTransition(() => {
      setOptimisticStatus(nextStatus);
      setOptimisticSort(nextSort);
      setIsPending(true);
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  // Typing waits for a pause. The first search adds a history entry (so Back returns to the
  // unfiltered list); later edits replace it, so Back does not step through every keystroke.
  const commitTyped = useEffectEvent(() => go({}, committedQ !== ""));
  useEffect(() => {
    if (text.trim() === committedQ) return;
    const timer = setTimeout(() => commitTyped(), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, committedQ]);

  return (
    <div className="flex flex-col gap-4" data-pending={isPending ? "" : undefined}>
      <Tabs
        className="hidden lg:flex"
        value={optimisticStatus}
        onValueChange={(value) => isStatusFilter(value) && go({ status: value })}
      >
        <TabsList aria-label={t.filters.label}>
          {statusItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          role="search"
          className="flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            go({}, committedQ !== "");
          }}
        >
          <InputGroup>
            <InputGroupAddon>
              <RiSearchLine />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              enterKeyHint="search"
              autoComplete="off"
              aria-label={t.search.label}
              placeholder={t.search.placeholder}
              maxLength={MAX_SEARCH_LENGTH}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            {text ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={t.search.clear}
                  onClick={() => {
                    setText("");
                    if (committedQ !== "") go({ q: "" }, true);
                  }}
                >
                  <RiCloseLine />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </form>

        <Select
          items={statusItems}
          value={optimisticStatus}
          onValueChange={(value) => value && go({ status: value })}
        >
          <SelectTrigger aria-label={t.filters.label} className="w-full sm:w-52 lg:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={sortItems}
          value={optimisticSort}
          onValueChange={(value) => value && go({ sort: value })}
        >
          <SelectTrigger aria-label={t.sort.label} className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
