"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getHomePath, requireUser, type Session } from "@/lib/dal";
import { appendQuery, safeNextPath } from "@/lib/auth/redirect";
import {
  acceptInviteSchema,
  forgotPasswordSchema,
  setPasswordSchema,
  signInSchema,
} from "@/lib/validation";
import { en } from "@/lib/strings/en";
import type { ActionState } from "@/lib/actions/types";

const t = en.auth;

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const isRateLimited = (error: { status?: number; code?: string }) =>
  error.status === 429 || error.code === "over_request_rate_limit";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
    next: text(formData, "next") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      message: error && isRateLimited(error) ? t.login.rateLimited : t.login.invalidCredentials,
      values,
    };
  }

  // Build the session from this client: cookies written during this request
  // are not guaranteed to be visible to a fresh getSession() yet.
  const session: Session = {
    supabase,
    userId: data.user.id,
    email: data.user.email ?? parsed.data.email,
  };
  redirect(safeNextPath(parsed.data.next) ?? (await getHomePath(session)));
}

export async function signOut() {
  const supabase = createClient(await cookies());
  // Ends this device's session only.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = { email: text(formData, "email") };
  const parsed = forgotPasswordSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl()}/auth/confirm?next=/update-password`,
  });

  // Only a rate limit is reported. Every other outcome shows the same message,
  // so the form never reveals whether an account exists.
  if (error && isRateLimited(error)) {
    return { ok: false, message: t.login.rateLimited, values };
  }
  return { ok: true, message: t.forgot.sent };
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = setPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { error } = await session.supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, fieldErrors: { password: [en.validation.passwordUnchanged] } };
    }
    return {
      ok: false,
      message: isRateLimited(error) ? t.login.rateLimited : error.message || t.login.generic,
    };
  }

  redirect(appendQuery(await getHomePath(session), "notice", "password_updated"));
}

export async function acceptInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  const values = { fullName: text(formData, "fullName") };
  const parsed = acceptInviteSchema.safeParse({
    fullName: text(formData, "fullName"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { error } = await session.supabase.auth.updateUser({
    password: parsed.data.password,
    data: { full_name: parsed.data.fullName },
  });
  if (error) {
    return {
      ok: false,
      message: isRateLimited(error) ? t.login.rateLimited : error.message || t.login.generic,
      values,
    };
  }

  // The profile row is created by a trigger at invite time; keep its name in sync.
  await session.supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", session.userId);

  redirect(await getHomePath(session));
}
