// Seeds the DEV project with an admin account and two test owners (each with a business).
//
//   npm run seed:dev
//
// Idempotent: anything that already exists is skipped (existing passwords are never changed).
// Needs SUPABASE_SECRET_KEY in .env.local. Optional env vars:
//   SEED_DEV_PASSWORD   password for newly created users (otherwise one is generated and printed)
//   SEED_ADMIN_EMAIL    login email for the platform admin (default below)
//
// This script builds its own client with the secret key: utils/supabase/admin.ts
// imports "server-only", which throws outside Next.js.

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const DEV_PROJECT_REF = "zbpimhaqjuabdzjruxjd";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}
if (!url.includes(DEV_PROJECT_REF)) {
  console.error(`Refusing to seed: ${url} is not the dev project (${DEV_PROJECT_REF}). Never seed prod.`);
  process.exit(1);
}

const supabase = createClient<Database>(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 14+ characters, always contains letters and digits (the app's password rule).
const newPassword = () => process.env.SEED_DEV_PASSWORD || `${randomBytes(9).toString("base64url")}a1`;

async function findUserId(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function ensureUser(email: string, fullName: string) {
  const existing = await findUserId(email);
  if (existing) {
    console.log(`  = ${email} already exists`);
    return { id: existing, created: false };
  }
  const password = newPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw error ?? new Error(`Could not create ${email}`);
  console.log(`  + ${email}  password: ${password}`);
  return { id: data.user.id, created: true };
}

async function ensureBusiness(ownerId: string, name: string, slug: string, email: string) {
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("user_id", ownerId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (membership) {
    console.log(`    = business already linked`);
    return;
  }
  const { error: rpcError } = await supabase.rpc("create_business_with_owner", {
    p_owner_id: ownerId,
    p_name: name,
    p_slug: slug,
    p_email: email,
    p_website: "http://localhost:5500",
    p_timezone: "Europe/Zagreb",
    p_sender_name: name,
    // Placeholder until a sending domain exists (Tech.md §8).
    p_sender_email: `${slug}@mail.flowdesk.invalid`,
    p_allowed_origins: ["http://localhost:5500"],
  });
  if (rpcError) throw rpcError;
  console.log(`    + business "${name}"`);
}

async function main() {
  console.log("Platform admin");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "izrno08@gmail.com";
  const admin = await ensureUser(adminEmail, "Platform Admin");
  const { error: adminError } = await supabase
    .from("platform_admins")
    .upsert({ user_id: admin.id }, { onConflict: "user_id" });
  if (adminError) throw adminError;
  console.log("    + platform_admins row ensured");

  console.log("Test owners");
  for (const letter of ["a", "b"]) {
    const email = `owner-${letter}@flowdesk.test`;
    const owner = await ensureUser(email, `Owner ${letter.toUpperCase()}`);
    await ensureBusiness(owner.id, `Test Business ${letter.toUpperCase()}`, `test-business-${letter}`, email);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
