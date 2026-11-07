"use client";

import { useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  defaultValue?: string;
  description?: string;
  errors?: string[];
  autoFocus?: boolean;
};

// A labelled input with its per-field error, wired for accessibility
// (aria-invalid + aria-describedby), following the shadcn Field pattern.
export function TextField({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  description,
  errors,
  autoFocus,
}: TextFieldProps) {
  const id = useId();
  const invalid = !!errors?.length;
  const describedBy =
    [description ? `${id}-description` : null, invalid ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        required
      />
      {description ? <FieldDescription id={`${id}-description`}>{description}</FieldDescription> : null}
      {invalid ? (
        <FieldError id={`${id}-error`} errors={errors.map((message) => ({ message }))} />
      ) : null}
    </Field>
  );
}
