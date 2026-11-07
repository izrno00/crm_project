import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NameForm } from "@/components/account/name-form";
import { EmailForm } from "@/components/account/email-form";
import { PasswordForm } from "@/components/account/password-form";
import { getProfile, requireUser } from "@/lib/dal";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Account" };

const t = en.account;

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-medium">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const session = await requireUser();
  const [{ data }, profile] = await Promise.all([session.supabase.auth.getUser(), getProfile()]);
  const user = data.user;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t.name.title}</CardTitle>
          <CardDescription>{t.name.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <NameForm defaultName={profile.fullName} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.email.title}</CardTitle>
          <CardDescription>{t.email.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm
            currentEmail={user?.email ?? profile.email}
            pendingEmail={user?.new_email ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.password.title}</CardTitle>
          <CardDescription>{t.password.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </>
  );
}

function AccountSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-4xl bg-muted" aria-hidden="true" />
      ))}
    </>
  );
}
