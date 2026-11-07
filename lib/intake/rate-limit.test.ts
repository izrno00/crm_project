import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { checkIntakeLimits, getClientIp, hashIp, secondsUntilWindowEnd } from "@/lib/intake/rate-limit";

describe("getClientIp", () => {
  it("uses the first x-forwarded-for value", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to a fixed placeholder", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("is deterministic and never contains the raw IP", () => {
    const hash = hashIp("203.0.113.7", "salt-a");
    expect(hash).toBe(hashIp("203.0.113.7", "salt-a"));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203.0.113.7");
  });

  it("changes with the salt and with the IP", () => {
    expect(hashIp("203.0.113.7", "salt-a")).not.toBe(hashIp("203.0.113.7", "salt-b"));
    expect(hashIp("203.0.113.7", "salt-a")).not.toBe(hashIp("203.0.113.8", "salt-a"));
  });

  it("refuses to run without a salt", () => {
    expect(() => hashIp("203.0.113.7", "")).toThrow(/IP_HASH_SALT/);
  });
});

describe("secondsUntilWindowEnd", () => {
  it("counts down to the end of the fixed window", () => {
    // Window of 600 s; 100 s into a window leaves 500 s.
    expect(secondsUntilWindowEnd(600, 100_000)).toBe(500);
    expect(secondsUntilWindowEnd(600, 599_000)).toBe(1);
  });

  it("is never below 1 second", () => {
    expect(secondsUntilWindowEnd(600, 600_000)).toBe(600);
    expect(secondsUntilWindowEnd(60, 59_999)).toBeGreaterThanOrEqual(1);
  });
});

// A stand-in for the service-role client: answers check_rate_limit from a queue.
const fakeAdmin = (answers: Array<{ data: boolean | null; error: { code: string } | null }>) => {
  const rpc = vi.fn(async () => answers.shift() ?? { data: true, error: null });
  return { admin: { rpc } as unknown as SupabaseClient<Database>, rpc };
};

describe("checkIntakeLimits", () => {
  it("checks the visitor first, then the website, with distinct keys", async () => {
    const { admin, rpc } = fakeAdmin([]);
    expect(await checkIntakeLimits(admin, "source-1", "hash-1")).toEqual({ allowed: true });

    const keys = (rpc.mock.calls as unknown as Array<[string, { p_key: string }]>).map(([, args]) => args.p_key);
    expect(keys).toEqual(["src:source-1:ip:hash-1", "src:source-1"]);
  });

  it("stops at the visitor limit without spending the website's quota", async () => {
    const { admin, rpc } = fakeAdmin([{ data: false, error: null }]);
    const result = await checkIntakeLimits(admin, "source-1", "hash-1");
    expect(result.allowed).toBe(false);
    expect(!result.allowed && result.retryAfter).toBeGreaterThanOrEqual(1);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("blocks when the website-wide limit is reached", async () => {
    const { admin } = fakeAdmin([
      { data: true, error: null },
      { data: false, error: null },
    ]);
    expect((await checkIntakeLimits(admin, "source-1", "hash-1")).allowed).toBe(false);
  });

  it("fails loudly (not open) when the database call fails", async () => {
    const { admin } = fakeAdmin([{ data: null, error: { code: "XX000" } }]);
    await expect(checkIntakeLimits(admin, "source-1", "hash-1")).rejects.toThrow(/check_rate_limit failed/);
  });
});
