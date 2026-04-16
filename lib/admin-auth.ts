import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { console } from "node:inspector";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  console.log("Session data:", session); // Log the session data for debugging

  if (!session || !session.user || session.user.role !== "admin") {
    return null;
  }

  return session;
}
