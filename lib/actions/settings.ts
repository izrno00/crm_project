"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/dal";
import { emailSettingsSchema } from "@/lib/validation";
import { en } from "@/lib/strings/en";
import type { ActionState } from "@/lib/actions/types";

// Settings actions (PRD §5.9, Tech.md §11.5). Each one calls the DAL itself and writes with the
// owner's own client: Row Level Security limits it to their business, and the column grants
// (DB.md §8.3) to the fields an owner may change.

const t = en.settings.email;

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function updateEmailSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, business } = await requireBusiness();

  const values = {
    senderName: text(formData, "senderName"),
    replyToEmail: text(formData, "replyToEmail"),
    signature: text(formData, "signature"),
    bccReplies: text(formData, "bccReplies") === "on" ? "on" : "off",
  };
  const parsed = emailSettingsSchema.safeParse({ ...values, bccReplies: values.bccReplies === "on" });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({
      sender_name: parsed.data.senderName,
      reply_to_email: parsed.data.replyToEmail,
      signature: parsed.data.signature,
      bcc_replies: parsed.data.bccReplies,
    })
    .eq("id", business.id)
    .select("id");
  if (error || !data?.length) return { ok: false, message: t.errors.generic, values };

  refresh();
  return {
    ok: true,
    message: t.saved,
    values: {
      senderName: parsed.data.senderName,
      replyToEmail: parsed.data.replyToEmail ?? "",
      signature: parsed.data.signature ?? "",
      bccReplies: parsed.data.bccReplies ? "on" : "off",
    },
  };
}
