import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCampaignAnalytics } from "@/lib/email/marketing-campaigns";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/campaigns/[id]/analytics - Get campaign analytics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const analytics = await getCampaignAnalytics(id);

    return NextResponse.json({
      analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
