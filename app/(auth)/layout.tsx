import { en } from "@/lib/strings/en";

// Static shell for the sign-in, password and invitation pages: a centered card
// on a plain background with the Flowdesk wordmark above it. It reads no
// session or request data, so it prerenders.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <span className="font-heading text-4xl font-medium tracking-tight">{en.brand}</span>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
