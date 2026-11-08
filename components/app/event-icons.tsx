import type { ReactNode } from "react";
import {
  RiArchiveLine,
  RiArrowGoBackLine,
  RiCheckDoubleLine,
  RiInboxUnarchiveLine,
  RiMailAddLine,
  RiMailCheckLine,
  RiMailCloseLine,
} from "@remixicon/react";
import type { EventType } from "@/lib/queries/dashboard";

// One icon per inquiry event type, shared by the dashboard's activity feed and the inquiry timeline.
export const eventIcons: Record<EventType, ReactNode> = {
  received: <RiMailAddLine />,
  reply_sent: <RiMailCheckLine />,
  reply_failed: <RiMailCloseLine />,
  marked_answered: <RiCheckDoubleLine />,
  marked_unanswered: <RiArrowGoBackLine />,
  archived: <RiArchiveLine />,
  restored: <RiInboxUnarchiveLine />,
};
