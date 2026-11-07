import { Badge } from "@/components/ui/badge";
import { en } from "@/lib/strings/en";

type Status = keyof typeof en.status;

// Uses shadcn Badge variants (ui-rules.md): New is solid, Awaiting response needs attention,
// Answered is quiet. Reused by the inquiry list and detail pages later.
const variants = {
  new: "default",
  awaiting: "destructive",
  answered: "secondary",
} as const;

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{en.status[status]}</Badge>;
}
