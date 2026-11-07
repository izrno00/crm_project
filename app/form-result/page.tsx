import type { Metadata } from "next";
import { Suspense } from "react";
import { RiCheckboxCircleLine, RiErrorWarningLine } from "@remixicon/react";
import { BackButton } from "@/components/form-result/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isErrorCode } from "@/lib/intake/respond";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Your message", robots: { index: false } };

const t = en.formResult;
const FIELD_LABELS = t.fieldLabels as Record<string, string>;

// Public page for plain HTML forms that don't name their own thank-you or error page
// (PRD INT-7, Tech.md §7.3). The intake API redirects here.
//
// It only ever shows fixed text chosen by code. Nothing the visitor typed is repeated, and the
// only link is a "Go back" button, so the page can't be used for phishing or open redirects.
export default function FormResultPage({ searchParams }: PageProps<"/form-result">) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-4 py-10">
      <div className="w-full">
        <Suspense fallback={<Skeleton aria-hidden="true" className="h-64 rounded-4xl" />}>
          <Result searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function Result({ searchParams }: { searchParams: PageProps<"/form-result">["searchParams"] }) {
  const params = await searchParams;

  if (first(params.status) === "success") {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <RiCheckboxCircleLine aria-hidden="true" className="mb-2 size-10 text-primary" />
          <CardTitle role="heading" aria-level={1} className="font-heading text-2xl">
            {t.successTitle}
          </CardTitle>
          <CardDescription>{t.successBody}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const code = first(params.code);
  const message = isErrorCode(code) ? en.intake.errors[code] : t.unknownError;
  // Only field names we know are shown, so the query string can't inject text.
  const fields = (first(params.fields) ?? "")
    .split(",")
    .map((name) => FIELD_LABELS[name])
    .filter((label): label is string => !!label);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <RiErrorWarningLine aria-hidden="true" className="mb-2 size-10 text-destructive" />
        <CardTitle role="heading" aria-level={1} className="font-heading text-2xl">
          {t.errorTitle}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {fields.length > 0 ? (
          <div className="flex flex-col items-center gap-1 text-sm">
            <p className="text-muted-foreground">{t.fieldsIntro}</p>
            <ul className="font-medium">
              {fields.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <BackButton />
      </CardContent>
    </Card>
  );
}
