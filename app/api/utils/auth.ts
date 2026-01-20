import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";

export async function verifyAuth(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { isValid: false, session: null };
  }

  return { isValid: true, session };
}
