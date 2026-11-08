"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { en } from "@/lib/strings/en";

const t = en.settings.tabs;

// Only the tabs that exist are listed (agreed 2026-11-08); Business and Integration join later.
const TABS = [
  { href: "/settings/account", label: t.account },
  { href: "/settings/email", label: t.email },
] as const;

// The settings tab bar. Each tab is a link to its own page. With `pathname` null no tab is
// selected, which is what shows for a moment while the current path streams in (see SettingsNav).
export function SettingsTabs({ pathname }: { pathname: string | null }) {
  const active =
    TABS.find((tab) => pathname === tab.href || pathname?.startsWith(`${tab.href}/`))?.href ?? null;

  return (
    <nav aria-label={t.label}>
      <Tabs value={active}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.href}
              value={tab.href}
              nativeButton={false}
              render={<Link href={tab.href} aria-current={active === tab.href ? "page" : undefined} />}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  );
}

// The current path is runtime data, so this renders inside a <Suspense> boundary (Tech.md §3)
// with SettingsTabs as the fallback.
export function SettingsNav() {
  const pathname = usePathname();
  return <SettingsTabs pathname={pathname} />;
}
