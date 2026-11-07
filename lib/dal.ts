import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Data Access Layer (Tech.md §5.3). All session and membership reads go through here.
// Pages, server actions and route handlers call these; they never read cookies directly.

export const getSession = cache(async () => {
  // Checking a session means checking whether its token has expired, which reads the
  // current time (Date.now()). With Cache Components that is only allowed at request
  // time, so mark this read as dynamic first. Everything that follows is request-time too.
  await connection();
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  return {
    supabase,
    userId: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? "",
  };
});

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function isPlatformAdmin(session: Session) {
  const { data } = await session.supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", session.userId)
    .maybeSingle();
  return !!data;
}

// The owner's single business (MVP). Redirects if none or suspended.
export const requireBusiness = cache(async () => {
  const session = await requireUser();
  const { data: m } = await session.supabase
    .from("memberships")
    .select("role, business:businesses(*)")
    .limit(1)
    .maybeSingle();
  if (!m?.business) {
    redirect((await isPlatformAdmin(session)) ? "/admin" : "/login?error=no_business");
  }
  if (m.business.status === "suspended") redirect("/suspended");
  return { ...session, business: m.business, role: m.role };
});

export async function requirePlatformAdmin() {
  const session = await requireUser();
  if (!(await isPlatformAdmin(session))) notFound();
  return session;
}

// Where a signed-in user lands when there is no `next` target.
export async function getHomePath(session: Session) {
  const { data: m } = await session.supabase
    .from("memberships")
    .select("business_id")
    .limit(1)
    .maybeSingle();
  if (m) return "/dashboard";
  if (await isPlatformAdmin(session)) return "/admin";
  return "/login?error=no_business";
}

// The signed-in user's display info (name from `profiles`, email from the session).
export const getProfile = cache(async () => {
  const session = await requireUser();
  const { data } = await session.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.userId)
    .maybeSingle();
  return {
    userId: session.userId,
    email: session.email,
    fullName: data?.full_name ?? "",
  };
});
