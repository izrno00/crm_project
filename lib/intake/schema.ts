import { z } from "zod";
import { en } from "@/lib/strings/en";

const f = en.intake.fields;

// Any control character, including line breaks and tabs.
const CONTROL = /[\u0000-\u001F\u007F]/;
// Line breaks (and Unicode line separators). Rejected in the subject to prevent email header injection.
const LINE_BREAK = new RegExp(`[\r\n${String.fromCharCode(0x2028, 0x2029)}]`);
// Control characters other than tab, line feed and carriage return, which are fine in a message.
const MESSAGE_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// Required fields of an inquiry (PRD INT-2, INT-4). Values are trimmed first, then checked.
export const inquirySchema = z.object({
  name: z
    .string({ error: f.nameRequired })
    .trim()
    .min(1, f.nameRequired)
    .max(200, f.nameTooLong)
    .refine((v) => !CONTROL.test(v), f.nameInvalid),
  email: z
    .string({ error: f.emailRequired })
    .trim()
    .min(1, f.emailRequired)
    .max(254, f.emailTooLong)
    .pipe(z.email(f.emailInvalid)),
  subject: z
    .string({ error: f.subjectRequired })
    .trim()
    .min(1, f.subjectRequired)
    .max(200, f.subjectTooLong)
    .refine((v) => !LINE_BREAK.test(v) && !CONTROL.test(v), f.subjectInvalid),
  message: z
    .string({ error: f.messageRequired })
    .trim()
    .min(1, f.messageRequired)
    .max(5000, f.messageTooLong)
    .refine((v) => !MESSAGE_CONTROL.test(v), f.messageInvalid),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export type ParseInquiryResult =
  | { ok: true; data: InquiryInput }
  | { ok: false; fields: Record<string, string> };

// Returns the first message per field, so a website can show it next to the input.
// Messages never include the submitted values.
export function parseInquiry(input: Record<string, unknown>): ParseInquiryResult {
  const parsed = inquirySchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  const fields: Record<string, string> = {};
  for (const [key, messages] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) fields[key] = first;
  }
  return { ok: false, fields };
}
