/**
 * Canonicalise an email for storage and lookup. Postgres unique indexes and
 * `eq()` comparisons are case-sensitive, so without this "A@x.com" and
 * "a@x.com" become two accounts and users get locked out at login.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Basic shape check: something@domain.tld, no spaces, at most 254 chars. */
export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const sanitized = localPart.replace(/[^a-zA-Z0-9]+/g, " ").trim();

  if (!sanitized) return "Customer";

  return sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Only allow same-site relative paths ("/account"), never "//evil.com",
 * "/\\evil.com" or absolute URLs, so login redirects can't be pointed
 * off-site.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}
