import { intakeConfig } from "@/lib/intake/config";

// Reads and parses the request body of a public submission (Tech.md §7.2, §7.3 steps 1-2).
// Accepts JSON, URL-encoded and multipart bodies. Only the known fields are kept, and only as strings.

export const BODY_FIELDS = [
  "name",
  "email",
  "subject",
  "message",
  "_hp",
  "_redirect",
  "_error_redirect",
] as const;

export type BodyField = (typeof BODY_FIELDS)[number];
export type IntakeFields = Partial<Record<BodyField, string>>;

export type BodyResult =
  | { ok: true; fields: IntakeFields }
  | { ok: false; code: "payload_too_large" | "unsupported_media_type" | "invalid_body" };

const pick = (get: (key: string) => unknown): IntakeFields => {
  const fields: IntakeFields = {};
  for (const key of BODY_FIELDS) {
    const value = get(key);
    if (typeof value === "string") fields[key] = value;
  }
  return fields;
};

// Reads the body stream, stopping as soon as it passes the limit. This covers requests
// that have no Content-Length header. Returns null when the body is too large.
async function readCapped(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export async function readIntakeBody(request: Request): Promise<BodyResult> {
  const { maxBodyBytes } = intakeConfig;

  // 1. Reject early when the declared size is already too large.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBodyBytes) {
    return { ok: false, code: "payload_too_large" };
  }

  // 2. Only these content types are accepted.
  const contentType = request.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  if (
    mediaType !== "application/json" &&
    mediaType !== "application/x-www-form-urlencoded" &&
    mediaType !== "multipart/form-data"
  ) {
    return { ok: false, code: "unsupported_media_type" };
  }

  const bytes = await readCapped(request, maxBodyBytes);
  if (!bytes) return { ok: false, code: "payload_too_large" };

  try {
    if (mediaType === "application/json") {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, code: "invalid_body" };
      }
      const record = parsed as Record<string, unknown>;
      return { ok: true, fields: pick((key) => record[key]) };
    }

    if (mediaType === "application/x-www-form-urlencoded") {
      const params = new URLSearchParams(new TextDecoder().decode(bytes));
      return { ok: true, fields: pick((key) => params.get(key) ?? undefined) };
    }

    // multipart/form-data: let the platform parse the buffered bytes.
    const form = await new Response(bytes as BodyInit, {
      headers: { "content-type": contentType },
    }).formData();
    return { ok: true, fields: pick((key) => form.get(key) ?? undefined) };
  } catch {
    return { ok: false, code: "invalid_body" };
  }
}
