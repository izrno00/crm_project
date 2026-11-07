"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { TextField } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { en } from "@/lib/strings/en";

const t = en.auth.login;

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state?.message ? (
        <Alert variant="destructive">
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
        <TextField
          name="password"
          label={t.password}
          type="password"
          autoComplete="current-password"
          errors={state?.fieldErrors?.password}
        />
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <SubmitButton pending={pending}>{t.submit}</SubmitButton>
        <Link
          href="/forgot-password"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.forgot}
        </Link>
      </div>
    </form>
  );
}
