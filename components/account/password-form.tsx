"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/actions/account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { en } from "@/lib/strings/en";

const t = en.account.password;

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state?.message && !state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <TextField
          name="currentPassword"
          label={t.current}
          type="password"
          autoComplete="current-password"
          errors={state?.fieldErrors?.currentPassword}
        />
        <TextField
          name="newPassword"
          label={t.new}
          type="password"
          autoComplete="new-password"
          description={en.auth.updatePassword.hint}
          errors={state?.fieldErrors?.newPassword}
        />
        <TextField
          name="confirmPassword"
          label={t.confirm}
          type="password"
          autoComplete="new-password"
          errors={state?.fieldErrors?.confirmPassword}
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
