// Prints an invitation or password-recovery link WITHOUT sending any email (dev only).
// Useful because Supabase's default mailer is heavily rate-limited.
//
//   npm run auth:link -- recovery owner-a@flowdesk.test
//   npm run auth:link -- invite new-owner@flowdesk.test "New Owner" "New Business"
//
// `invite` also creates the business and owner membership, mirroring Tech.md §6.3
// (steps 3–5, including the rollback if the business can't be created).
// Needs SUPABASE_SECRET_KEY in .env.local.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const DEV_PROJECT_REF = "zbpimhaqjuabdzjruxjd";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}
if (!url.includes(DEV_PROJECT_REF)) {
  console.error(`Refusing to run: ${url} is not the dev project (${DEV_PROJECT_REF}).`);
  process.exit(1);
}

const supabase = createClient<Database>(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [kind, email, fullNameArg, businessArg] = process.argv.slice(2);

if ((kind !== "invite" && kind !== "recovery") || !email) {
  console.error('Usage: npm run auth:link -- <invite|recovery> <email> ["Full Name"] ["Business Name"]');
  process.exit(1);
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const confirmUrl = (tokenHash: string, type: string, next: string) =>
  `${appUrl}/auth/confirm?token_hash=${tokenHash}&type=${type}&next=${next}`;

async function recovery() {
  const { data, error } = await supabase.auth.admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  console.log(confirmUrl(data.properties.hashed_token, "recovery", "/update-password"));
}

async function invite() {
  const fullName = fullNameArg || email.split("@")[0];
  const businessName = businessArg || `${fullName}'s Business`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;

  const userId = data.user.id;
  const { error: rpcError } = await supabase.rpc("create_business_with_owner", {
    p_owner_id: userId,
    p_name: businessName,
    p_slug: `${slugify(businessName)}-${userId.slice(0, 6)}`,
    p_email: email,
    p_website: "http://localhost:5500",
    p_timezone: "UTC",
    p_sender_name: businessName,
    p_sender_email: `${slugify(businessName)}-${userId.slice(0, 6)}@mail.flowdesk.invalid`,
    p_allowed_origins: ["http://localhost:5500"],
  });
  if (rpcError) {
    // Roll back the invited user so the email can be invited again.
    await supabase.auth.admin.deleteUser(userId);
    throw rpcError;
  }

  console.log(`Invited ${email} to "${businessName}". Open this link (valid 24h):`);
  console.log(confirmUrl(data.properties.hashed_token, "invite", "/accept-invite"));
}

(kind === "invite" ? invite() : recovery()).catch((error) => {
  console.error(error);
  process.exit(1);
});
