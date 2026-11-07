import { describe, expect, it } from "vitest";
import { readIntakeBody } from "@/lib/intake/body";

const post = (body: BodyInit, contentType?: string, extra: Record<string, string> = {}) =>
  new Request("http://localhost/api/v1/forms/pk_x/inquiries", {
    method: "POST",
    headers: { ...(contentType ? { "content-type": contentType } : {}), ...extra },
    body,
  });

const fields = { name: "Ana", email: "ana@example.com", subject: "Hi", message: "Hello" };

describe("readIntakeBody", () => {
  it("parses JSON", async () => {
    const result = await readIntakeBody(post(JSON.stringify(fields), "application/json; charset=utf-8"));
    expect(result).toEqual({ ok: true, fields });
  });

  it("parses URL-encoded forms", async () => {
    const result = await readIntakeBody(
      post(new URLSearchParams({ ...fields, _redirect: "https://acme.com/thanks" }).toString(), "application/x-www-form-urlencoded"),
    );
    expect(result).toEqual({ ok: true, fields: { ...fields, _redirect: "https://acme.com/thanks" } });
  });

  it("parses multipart forms (FormData)", async () => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    const result = await readIntakeBody(new Request("http://localhost/x", { method: "POST", body: form }));
    expect(result).toEqual({ ok: true, fields });
  });

  it("keeps only the known fields, and only strings", async () => {
    const result = await readIntakeBody(
      post(JSON.stringify({ ...fields, admin: "yes", __proto__: "x", subject: 42, _hp: "bot" }), "application/json"),
    );
    expect(result).toEqual({
      ok: true,
      fields: { name: "Ana", email: "ana@example.com", message: "Hello", _hp: "bot" },
    });
  });

  it("returns 415 for unsupported content types", async () => {
    for (const type of ["text/plain", "application/xml", undefined]) {
      const result = await readIntakeBody(post("hello", type));
      expect(result).toEqual({ ok: false, code: "unsupported_media_type" });
    }
  });

  it("rejects early when Content-Length is over 16 KB", async () => {
    const result = await readIntakeBody(post("{}", "application/json", { "content-length": "99999" }));
    expect(result).toEqual({ ok: false, code: "payload_too_large" });
  });

  it("caps the streamed body even without a Content-Length header", async () => {
    const big = JSON.stringify({ ...fields, message: "x".repeat(20_000) });
    const result = await readIntakeBody(post(big, "application/json"));
    expect(result).toEqual({ ok: false, code: "payload_too_large" });
  });

  it("accepts a body just under the limit", async () => {
    const body = JSON.stringify({ ...fields, message: "x".repeat(15_000) });
    expect((await readIntakeBody(post(body, "application/json"))).ok).toBe(true);
  });

  it("returns invalid_body for broken JSON and non-object JSON", async () => {
    for (const body of ["{not json", "[]", '"text"', "null", ""]) {
      const result = await readIntakeBody(post(body, "application/json"));
      expect(result).toEqual({ ok: false, code: "invalid_body" });
    }
  });
});
