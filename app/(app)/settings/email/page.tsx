import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailSettingsForm } from "@/components/settings/email-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, requireBusiness } from "@/lib/dal";
import { defaultSignature } from "@/lib/email/reply-content";
import { resolveSender, senderEnvFromProcess } from "@/lib/email/sender";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Email settings" };

const t = en.settings.email;

// The Email settings tab (PRD §5.9, Tech.md §11.5): how replies to customers are sent.
export default function EmailSettingsPage() {
  return (
    <Suspense fallback={<div className="h-[38rem] animate-pulse rounded-4xl bg-muted" aria-hidden="true" />}>
      <EmailSettingsContent />
    </Suspense>
  );
}

async function EmailSettingsContent() {
  const [{ business }, profile] = await Promise.all([requireBusiness(), getProfile()]);
  // The address customers actually see, which in development is the test sender.
  const sender = resolveSender(business, senderEnvFromProcess());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.cardTitle}</CardTitle>
        <CardDescription>{t.cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmailSettingsForm
          defaults={{
            senderName: business.sender_name,
            replyToEmail: business.reply_to_email ?? "",
            signature: business.signature ?? "",
            bccReplies: business.bcc_replies,
          }}
          senderAddress={sender.fromEmail}
          businessEmail={business.email}
          defaultSignature={defaultSignature(profile.fullName, business.name)}
        />
      </CardContent>
    </Card>
  );
}
