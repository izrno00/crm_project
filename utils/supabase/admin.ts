import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Secret-key client. It BYPASSES Row Level Security (Tech.md §5.1).
//
// Allowed uses: (1) the public intake route, (2) the /admin area, (3) message writes for
// replies, (4) the notification job, (5) dev seeding.
//
// Rules:
// - Import it only from server-only modules.
// - Never pass its results to the client unfiltered.
// - Code in /admin must never select from customers, inquiries, messages or inquiry_events.
// - Owner-facing values (recipient, sender, business) come from database rows, never from client input.
export const createAdminClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
