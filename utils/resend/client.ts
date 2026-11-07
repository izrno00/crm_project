import "server-only";
import { Resend } from "resend";

// Resend's shared test sender. It only delivers to the email on your Resend account.
// Set RESEND_FROM_EMAIL in .env.local once your own domain is verified.
const DEFAULT_FROM = "onboarding@resend.dev";

let resend: Resend | null = null;

// Created lazily so a missing key fails at send time, not at build time.
export const getResend = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set. Add it to .env.local.");
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

type EmailBody =
  | { html: string; text?: string }
  | { html?: string; text: string };

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string | string[];
} & EmailBody;

// Returns Resend's { data, error } unchanged so callers decide how to handle failures.
export const sendEmail = async ({ from, ...options }: SendEmailOptions) => {
  return getResend().emails.send({
    from: from || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    ...options,
  });
};
