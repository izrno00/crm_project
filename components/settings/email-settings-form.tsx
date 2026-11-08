"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { TextField } from "@/components/auth/text-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateEmailSettings } from "@/lib/actions/settings";
import { en } from "@/lib/strings/en";

const t = en.settings.email;

export type EmailSettingsDefaults = {
  senderName: string;
  replyToEmail: string;
  signature: string;
  bccReplies: boolean;
};

type Props = {
  defaults: EmailSettingsDefaults;
  /** The address customers see as the sender (read-only; managed by the administrator). */
  senderAddress: string;
  /** The business email: the default reply-to and the BCC address. */
  businessEmail: string;
  /** Used when the signature is left empty: owner name and business name. */
  defaultSignature: string;
};

// The Email settings tab (PRD §5.9). After a failed save the typed values are put back, because
// React resets an action form once the action finishes.
export function EmailSettingsForm({ defaults, senderAddress, businessEmail, defaultSignature }: Props) {
  const [state, formAction, pending] = useActionState(updateEmailSettings, null);
  const id = useId();
  const [bcc, setBcc] = useState(defaults.bccReplies);

  const values = {
    senderName: state?.values?.senderName ?? defaults.senderName,
    replyToEmail: state?.values?.replyToEmail ?? defaults.replyToEmail,
    signature: state?.values?.signature ?? defaults.signature,
  };
  const signatureErrors = state?.fieldErrors?.signature;

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
          key={`sender-name-${values.senderName}`}
          name="senderName"
          label={t.senderName}
          description={t.senderNameHelp}
          autoComplete="organization"
          defaultValue={values.senderName}
          errors={state?.fieldErrors?.senderName}
        />

        <Field>
          <FieldLabel htmlFor={`${id}-sender-address`}>{t.senderAddress}</FieldLabel>
          <Input
            id={`${id}-sender-address`}
            value={senderAddress}
            readOnly
            aria-describedby={`${id}-sender-address-help`}
          />
          <FieldDescription id={`${id}-sender-address-help`}>{t.senderAddressHelp}</FieldDescription>
        </Field>

        <TextField
          key={`reply-to-${values.replyToEmail}`}
          name="replyToEmail"
          label={t.replyTo}
          type="email"
          autoComplete="email"
          required={false}
          placeholder={businessEmail}
          description={t.replyToHelp(businessEmail)}
          defaultValue={values.replyToEmail}
          errors={state?.fieldErrors?.replyToEmail}
        />

        <Field data-invalid={!!signatureErrors?.length}>
          <FieldLabel htmlFor={`${id}-signature`}>{t.signature}</FieldLabel>
          <Textarea
            key={`signature-${values.signature}`}
            id={`${id}-signature`}
            name="signature"
            defaultValue={values.signature}
            placeholder={defaultSignature}
            aria-invalid={!!signatureErrors?.length}
            aria-describedby={`${id}-signature-help${signatureErrors?.length ? ` ${id}-signature-error` : ""}`}
            className="min-h-24"
          />
          <FieldDescription id={`${id}-signature-help`}>{t.signatureHelp}</FieldDescription>
          {signatureErrors?.length ? (
            <FieldError
              id={`${id}-signature-error`}
              errors={signatureErrors.map((message) => ({ message }))}
            />
          ) : null}
        </Field>

        <Field orientation="horizontal">
          <Switch
            id={`${id}-bcc`}
            checked={bcc}
            onCheckedChange={setBcc}
            aria-describedby={`${id}-bcc-help`}
          />
          <FieldContent>
            <FieldLabel htmlFor={`${id}-bcc`}>{t.bcc}</FieldLabel>
            <FieldDescription id={`${id}-bcc-help`}>{t.bccHelp(businessEmail)}</FieldDescription>
          </FieldContent>
          <input type="hidden" name="bccReplies" value={bcc ? "on" : "off"} />
        </Field>
      </FieldGroup>

      <div>
        <SubmitButton pending={pending} fullWidth={false}>
          {t.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
