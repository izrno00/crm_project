import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard, FormSkeleton } from "@/components/auth/auth-card";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { getProfile, getSession } from "@/lib/dal";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Accept invitation" };

const t = en.auth.acceptInvite;

export default function AcceptInvitePage() {
  return (
    <AuthCard title={t.title} description={t.description}>
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <AcceptInviteContent />
      </Suspense>
    </AuthCard>
  );
}

// Reached through an invitation link: the confirm route has already created a session.
async function AcceptInviteContent() {
  const session = await getSession();
  if (!session) redirect("/login?error=link_invalid");
  const profile = await getProfile();
  return <AcceptInviteForm defaultName={profile.fullName} />;
}
