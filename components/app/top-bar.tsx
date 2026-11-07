import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/dal";
import { signOut } from "@/lib/actions/auth";
import { en } from "@/lib/strings/en";

// Temporary header for the signed-in area. The Phase 0 sidebar shell replaces it.
// The frame is static; the user's name streams in behind a Suspense boundary.
export function TopBar({ links }: { links: { href: string; label: string }[] }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
        <span className="font-heading text-xl font-medium">{en.brand}</span>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Suspense fallback={<div className="h-4 w-24 animate-pulse rounded-full bg-muted" />}>
            <UserName />
          </Suspense>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              {en.auth.signOut}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

async function UserName() {
  const profile = await getProfile();
  return (
    <span className="hidden text-sm text-muted-foreground sm:inline">
      {profile.fullName || profile.email}
    </span>
  );
}
