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
