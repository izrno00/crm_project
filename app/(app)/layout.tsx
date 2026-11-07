import { Suspense } from "react";
import { TopBar } from "@/components/app/top-bar";
import { NoticeToast } from "@/components/notice-toast";
import { en } from "@/lib/strings/en";

const links = [
  { href: "/dashboard", label: en.placeholder.nav.dashboard },
  { href: "/settings/account", label: en.placeholder.nav.account },
];

// Temporary shell for the owner area. Pages do their own DAL checks;
// the proxy only does the optimistic redirect for signed-out visitors.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar links={links} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
    </div>
  );
}
