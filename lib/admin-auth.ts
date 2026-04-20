import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  console.log("[admin-auth][requireAdminSession] result", {
    hasSession: Boolean(session),
    hasUser: Boolean(session?.user),
    email: session?.user?.email,
    role: session?.user?.role,
  });

  if (!session || !session.user || session.user.role !== "admin") {
    console.log("[admin-auth][requireAdminSession] rejected", {
      reason: !session
        ? "no-session"
        : !session.user
          ? "no-user"
          : session.user.role !== "admin"
            ? "non-admin-role"
            : "unknown",
    });
    return null;
  }

  return session;
}
