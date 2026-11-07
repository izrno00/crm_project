"use client";

import { RiArrowGoBackLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { en } from "@/lib/strings/en";

// Returns to the form the visitor came from. The browser restores what they typed.
// It only goes back in the visitor's own history, so it can never send them to another site.
export function BackButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.history.back()}>
      <RiArrowGoBackLine data-icon="inline-start" />
      {en.formResult.back}
    </Button>
  );
}
