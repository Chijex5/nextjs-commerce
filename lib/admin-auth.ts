import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  console.log("[admin-auth][requireAdminSession] result", {
    hasSession: Boolean(session),
    hasUser: Boolean(session?.user),
    email: session?.user?.email,
    role: session?.user?.role,
  });

  if (!session || !session.user || !ADMIN_ROLES.has(session.user.role || "")) {
    console.log("[admin-auth][requireAdminSession] rejected", {
      reason: !session
        ? "no-session"
        : !session.user
          ? "no-user"
          : !ADMIN_ROLES.has(session.user.role || "")
            ? "non-admin-role"
            : "unknown",
    });
    return null;
  }

  return session;
}
