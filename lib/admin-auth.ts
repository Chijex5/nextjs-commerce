import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";

export const ADMIN_ROLES = ["admin", "super_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

/**
 * The signed-in admin, or null. The role comes from the database on every
 * request (see the jwt callback in lib/auth.ts), so deactivated, deleted or
 * demoted admins lose access immediately rather than when their token expires.
 */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }

  return session;
}

/** Only super admins may manage other admins. */
export async function requireSuperAdminSession() {
  const session = await requireAdminSession();
  return session?.user.role === "super_admin" ? session : null;
}
