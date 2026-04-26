import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !ADMIN_ROLES.has(session.user.role || "")) {
    
    return null;
  }

  return session;
}
