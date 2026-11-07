import type { Metadata } from "next";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Admin" };

const t = en.placeholder;

// Placeholder: the business list and onboarding form arrive in the admin phase.
export default function AdminPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-medium">{t.adminTitle}</h1>
      <p className="text-muted-foreground">{t.adminBody}</p>
    </div>
  );
}
