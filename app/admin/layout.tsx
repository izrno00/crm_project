import { Suspense } from "react";
import { TopBar } from "@/components/app/top-bar";
import { requirePlatformAdmin } from "@/lib/dal";
import { en } from "@/lib/strings/en";

const links = [{ href: "/admin", label: en.placeholder.nav.admin }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar links={links} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* The guard reads the session, so it sits behind a Suspense boundary. */}
        <Suspense fallback={<div className="h-5 w-48 animate-pulse rounded-full bg-muted" />}>
          <AdminGuard>{children}</AdminGuard>
        </Suspense>
      </main>
    </div>
  );
}

// Non-admins get a 404. Every admin server action must call requirePlatformAdmin() again.
async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return children;
}
