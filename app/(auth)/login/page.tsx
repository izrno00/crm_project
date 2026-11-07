import type { Metadata } from "next";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard, FormSkeleton } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Sign in" };

const t = en.auth.login;

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard title={t.title} description={t.description}>
      <Suspense fallback={<FormSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

// searchParams are request data, so they are read behind a Suspense boundary.
async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const errorMessage =
    errorKey && errorKey in t.errors ? t.errors[errorKey as keyof typeof t.errors] : null;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);

  return (
    <div className="flex flex-col gap-5">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <LoginForm next={next ?? undefined} />
    </div>
  );
}
