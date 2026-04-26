import crypto from "crypto";

export const ADMIN_RESET_TOKEN_TTL_MINUTES = 30;
export const ADMIN_RESET_REQUEST_COOLDOWN_SECONDS = 60;

export function createAdminResetToken() {
  // URL-safe token for email links, hashed before DB persistence.
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashAdminResetToken(token);
  const expiresAt = new Date(
    Date.now() + ADMIN_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  return { token, tokenHash, expiresAt };
}

export function hashAdminResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
