/**
 * Validates a user-supplied post-login redirect target.
 *
 * Only same-site relative paths are allowed. Anything that a browser could
 * interpret as another origin (`//evil.com`, `/\evil.com`, `https://…`,
 * `javascript:…`) or that contains control characters / backslashes is rejected.
 * Returns the path unchanged when it is safe, otherwise `null`.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  // Backslashes and control characters (tab, CR, LF …) are normalised by browsers
  // in ways that can turn a "relative" path into a protocol-relative URL.
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
  return value;
}

/** Adds `key=value` to a relative path, respecting an existing query string. */
export function appendQuery(path: string, key: string, value: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
