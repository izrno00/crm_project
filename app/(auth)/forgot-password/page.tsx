import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Forgot password" };

const t = en.auth.forgot;

// Fully static: the form posts to a server action.
export default function ForgotPasswordPage() {
  return (
    <AuthCard title={t.title} description={t.description}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
