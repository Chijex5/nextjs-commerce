import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "admin") {
    return null;
  }

  return session;
}
