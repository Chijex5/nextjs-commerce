import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "admin") {
    return null;
  }

  return session;
}
