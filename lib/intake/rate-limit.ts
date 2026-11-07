import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { intakeConfig } from "@/lib/intake/config";

// Rate limiting for the public intake API (Tech.md §7.3 step 5, DB.md `check_rate_limit`).

/** The visitor's IP: the first `x-forwarded-for` value (set by Vercel), then `x-real-ip`. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** sha256(salt + ip). The raw IP is never stored (PRD PRIV-4). */
export function hashIp(ip: string, salt: string | undefined = process.env.IP_HASH_SALT): string {
  if (!salt) throw new Error("IP_HASH_SALT is not set. Add it to .env.local.");
  return createHash("sha256").update(salt + ip).digest("hex");
}

/** Seconds until the current fixed window ends (the `Retry-After` value). */
export function secondsUntilWindowEnd(windowSeconds: number, nowMs: number = Date.now()): number {
  const elapsed = Math.floor(nowMs / 1000) % windowSeconds;
  return Math.max(1, windowSeconds - elapsed);
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

/**
 * Checks the per-visitor limit first, then the per-website limit. Takes the service-role
 * client because `check_rate_limit` is not callable by owners or visitors.
 */
export async function checkIntakeLimits(
  admin: SupabaseClient<Database>,
  sourceId: string,
  ipHash: string,
): Promise<RateLimitResult> {
  const { perVisitor, perSite } = intakeConfig;

  const checks = [
    { key: `src:${sourceId}:ip:${ipHash}`, ...perVisitor },
    { key: `src:${sourceId}`, ...perSite },
  ];

  for (const check of checks) {
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: check.key,
      p_max: check.max,
      p_window_seconds: check.windowSeconds,
    });
    if (error) throw new Error(`check_rate_limit failed (${error.code ?? "unknown"})`);
    if (data === false) {
      return { allowed: false, retryAfter: secondsUntilWindowEnd(check.windowSeconds) };
    }
  }
  return { allowed: true };
}
