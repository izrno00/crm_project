"use client";

import { useTransition } from "react";
import { RiLogoutBoxRLine } from "@remixicon/react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import { en } from "@/lib/strings/en";

// Calls the server action directly instead of submitting a <form>: a form inside a menu can be
// removed from the page (when the menu closes) before the browser submits it. `closeOnClick`
// is off so the item stays mounted until the action redirects to the sign-in page.
export function SignOutMenuItem() {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      closeOnClick={false}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
        })
      }
    >
      <RiLogoutBoxRLine />
      {en.auth.signOut}
    </DropdownMenuItem>
  );
}
