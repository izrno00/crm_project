// Origin checks for the public intake API (Tech.md §7.3 step 4 and the redirect rules).

/** The origin ("https://acme.com") of a URL, or null if it is not an http(s) URL. */
export function originOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * The origin a request came from: the `Origin` header, or the origin of `Referer` when
 * `Origin` is missing. Browsers send the literal "null" for privacy-sensitive requests,
 * which counts as missing.
 */
export function getRequestOrigin(headers: Headers): string | null {
  const origin = headers.get("origin");
  if (origin && origin !== "null") return originOf(origin);
  return originOf(headers.get("referer"));
}

const normalise = (allowed: readonly string[]) =>
  allowed.map(originOf).filter((o): o is string => o !== null);

/** Exact match against the connected website's allowed origins. */
export function isAllowedOrigin(origin: string | null, allowed: readonly string[]): boolean {
  return origin !== null && normalise(allowed).includes(origin);
}

/**
 * Validates a `_redirect` / `_error_redirect` target: an absolute http(s) URL whose origin is
 * one of the allowed origins. Returns the normalised URL, or null (so callers fall back to
 * Flowdesk's own result page). This is what prevents open redirects.
 */
export function safeRedirect(
  value: string | undefined,
  allowed: readonly string[],
): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!isAllowedOrigin(originOf(url.href), allowed)) return null;
  return url.href;
}
