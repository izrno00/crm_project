import { z } from "zod";
import { MAX_SEARCH_LENGTH, SORT_ORDERS, STATUS_FILTERS } from "@/lib/inquiry-list";
import { en } from "@/lib/strings/en";

const v = en.validation;

// Shared by the client forms and the server actions.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, v.emailRequired)
  .pipe(z.email(v.emailInvalid));

// Mirrors the Supabase Auth setting: min length 8, letters and digits.
// 72 is bcrypt's input limit.
export const passwordSchema = z
  .string()
  .min(8, v.passwordTooShort)
  .max(72, v.passwordTooLong)
  .regex(/[A-Za-z]/, v.passwordNeedsLetter)
  .regex(/\d/, v.passwordNeedsDigit);

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, v.nameRequired)
  .max(200, v.nameTooLong);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v.passwordRequired),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: v.passwordMismatch,
  });

export const acceptInviteSchema = z
  .object({
    fullName: fullNameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: v.passwordMismatch,
  });

export const changeNameSchema = z.object({
  fullName: fullNameSchema,
});

export const changeEmailSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, v.currentPasswordRequired),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: v.passwordMismatch,
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: v.passwordUnchanged,
  });

// The inquiry list's search params (Tech.md §11.3). Anything invalid falls back to its default
// on its own, so a hand-edited URL never breaks the page. A repeated param (?page=2&page=3)
// uses its first value.
const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

export const inquiryListParamsSchema = z.object({
  status: z.preprocess(firstValue, z.enum(STATUS_FILTERS)).catch("all"),
  q: z
    .preprocess(firstValue, z.string())
    .transform((text) => text.trim().slice(0, MAX_SEARCH_LENGTH))
    .catch(""),
  sort: z.preprocess(firstValue, z.enum(SORT_ORDERS)).catch("desc"),
  page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(1_000_000)).catch(1),
});
