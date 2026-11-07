"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateName } from "@/lib/actions/account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { en } from "@/lib/strings/en";

const t = en.account.name;

export function NameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(updateName, null);
  const nameValue = state?.values?.fullName ?? defaultName;

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
          key={`name-${nameValue}`}
          name="fullName"
          label={t.label}
          autoComplete="name"
          defaultValue={nameValue}
          errors={state?.fieldErrors?.fullName}
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
