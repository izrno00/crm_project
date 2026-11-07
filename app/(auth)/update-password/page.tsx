import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard, FormSkeleton } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { getSession } from "@/lib/dal";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Set a new password" };

const t = en.auth.updatePassword;

export default function UpdatePasswordPage() {
  return (
    <AuthCard title={t.title} description={t.description}>
      <Suspense fallback={<FormSkeleton />}>
        <UpdatePasswordContent />
      </Suspense>
    </AuthCard>
  );
}

// Reached through a recovery link: the confirm route has already created a session.
async function UpdatePasswordContent() {
  const session = await getSession();
  if (!session) redirect("/login?error=link_invalid");
  return <UpdatePasswordForm />;
}
