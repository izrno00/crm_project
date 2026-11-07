"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { en } from "@/lib/strings/en";

const t = en.auth.updatePassword;

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, null);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state?.message && !state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <TextField
          name="password"
          label={t.password}
          type="password"
          autoComplete="new-password"
          description={t.hint}
          errors={state?.fieldErrors?.password}
          autoFocus
        />
        <TextField
          name="confirmPassword"
          label={t.confirm}
          type="password"
          autoComplete="new-password"
          errors={state?.fieldErrors?.confirmPassword}
        />
      </FieldGroup>

      <SubmitButton pending={pending}>{t.submit}</SubmitButton>
    </form>
  );
}
