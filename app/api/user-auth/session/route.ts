import { NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import { db } from "lib/db";
import { users } from "lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const [row] = await db
      .select({ hasPassword: users.hasPassword })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    return NextResponse.json({
      user: { ...session, hasPassword: row?.hasPassword ?? false },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null });
  }
}
