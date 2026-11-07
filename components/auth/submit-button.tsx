"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Full-width submit button that shows a spinner while the server action runs.
export function SubmitButton({
  pending,
  children,
  fullWidth = true,
}: {
  pending: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Button type="submit" size="lg" disabled={pending} className={fullWidth ? "w-full" : undefined}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  );
}
