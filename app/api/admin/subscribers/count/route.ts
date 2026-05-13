import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers, newsletterSubscribers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/subscribers/count - Return count of active newsletter subscribers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin exists and is active
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "active"));

    const count = Array.isArray(result) && result[0] && typeof result[0].count === "number"
      ? result[0].count
      : Number(result?.[0]?.count || 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching subscriber count:", error);
    return NextResponse.json({ error: "Failed to fetch subscriber count" }, { status: 500 });
  }
}

// GET /api/admin/subscribers/count - return active subscriber count
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const rows = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
    return NextResponse.json({ count: rows.length });
  } catch (error) {
    console.error("Error fetching subscriber count:", error);
    return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
  }
}
