import { z } from "zod";
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
