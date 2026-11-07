"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { changeEmail } from "@/lib/actions/account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { en } from "@/lib/strings/en";

const t = en.account.email;

export function EmailForm({
  currentEmail,
  pendingEmail,
}: {
  currentEmail: string;
  pendingEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState(changeEmail, null);

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <p className="text-sm">
        <span className="text-muted-foreground">{t.current}: </span>
        <span className="font-medium">{currentEmail}</span>
      </p>

      {pendingEmail ? (
        <Alert>
          <AlertDescription>{t.pending(pendingEmail)}</AlertDescription>
        </Alert>
      ) : null}
      {state?.message && !state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <TextField
          key={`email-${state?.values?.email ?? ""}`}
          name="email"
          label={t.label}
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          errors={state?.fieldErrors?.email}
        />
      </FieldGroup>
      <div>
        <SubmitButton pending={pending} fullWidth={false}>
          {t.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
