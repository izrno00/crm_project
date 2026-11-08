import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/types";

// Shows the outcome of an inquiry action as a toast: the success message if there is one, or the error.
export function reportResult(result: ActionResult) {
  if (result.ok) {
    if (result.message) toast.success(result.message);
  } else {
    toast.error(result.error);
  }
}
