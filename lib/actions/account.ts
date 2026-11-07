"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/dal";
import {
  changeEmailSchema,
  changeNameSchema,
  changePasswordSchema,
} from "@/lib/validation";
import { en } from "@/lib/strings/en";
import type { ActionState } from "@/lib/actions/types";

const t = en.account;

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const isRateLimited = (error: { status?: number; code?: string }) =>
  error.status === 429 || error.code === "over_request_rate_limit";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function updateName(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();

  const values = { fullName: text(formData, "fullName") };
  const parsed = changeNameSchema.safeParse({ fullName: text(formData, "fullName") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // RLS + the column grant limit this to the user's own profile.full_name.
  const { error } = await session.supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", session.userId);
  if (error) return { ok: false, message: t.errors.generic, values };

  await session.supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });

  refresh();
  return { ok: true, message: t.name.saved, values: { fullName: parsed.data.fullName } };
}

export async function changeEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();

  const values = { email: text(formData, "email") };
  const parsed = changeEmailSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  if (parsed.data.email === session.email.toLowerCase()) {
    return { ok: false, fieldErrors: { email: [en.validation.emailUnchanged] }, values };
  }

  // With "Secure email change" on, Supabase emails a link to BOTH addresses.
  const { error } = await session.supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${appUrl()}/auth/confirm?next=/settings/account` },
  );
  if (error) {
    if (isRateLimited(error)) return { ok: false, message: t.errors.rateLimited, values };
    if (error.code === "email_exists") {
      return { ok: false, fieldErrors: { email: [t.errors.emailTaken] }, values };
    }
    return { ok: false, message: t.errors.generic, values };
  }

  refresh();
  return { ok: true, message: t.email.sent };
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: text(formData, "currentPassword"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Verify the current password on a throwaway client so the user's own
  // cookies and session are never touched, then discard that extra session.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: session.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    if (isRateLimited(verifyError)) return { ok: false, message: t.errors.rateLimited };
    return { ok: false, fieldErrors: { currentPassword: [t.password.currentWrong] } };
  }
  await verifier.auth.signOut({ scope: "local" });

  const { error } = await session.supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, fieldErrors: { newPassword: [en.validation.passwordUnchanged] } };
    }
    return {
      ok: false,
      message: isRateLimited(error) ? t.errors.rateLimited : error.message || t.errors.generic,
    };
  }

  return { ok: true, message: t.password.saved };
}
