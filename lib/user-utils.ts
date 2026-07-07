/**
 * Canonicalise an email for storage and lookup. Postgres unique indexes and
 * `eq()` comparisons are case-sensitive, so without this "A@x.com" and
 * "a@x.com" become two accounts and users get locked out at login.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
