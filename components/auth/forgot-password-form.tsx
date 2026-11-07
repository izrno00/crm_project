"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { en } from "@/lib/strings/en";

const t = en.auth.forgot;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state?.message ? (
        <Alert variant={state.ok ? "default" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <TextField
          key={`email-${state?.values?.email ?? ""}`}
          name="email"
          label={t.email}
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          errors={state?.fieldErrors?.email}
          autoFocus
        />
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <SubmitButton pending={pending}>{t.submit}</SubmitButton>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.back}
        </Link>
      </div>
    </form>
  );
}
