import { Suspense } from "react";
import { SettingsNav, SettingsTabs } from "@/components/settings/settings-nav";
import { en } from "@/lib/strings/en";

const t = en.settings;

// Shared frame for the settings pages (PRD §5.9, Tech.md §11.5): the heading and the tab bar.
// Each tab is its own page and does its own DAL checks.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-medium">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>
      <Suspense fallback={<SettingsTabs pathname={null} />}>
        <SettingsNav />
      </Suspense>
      {children}
    </div>
  );
}
