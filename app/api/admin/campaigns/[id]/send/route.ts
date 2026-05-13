import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers, emailCampaigns } from "@/lib/db/schema";
import {
  getCampaignWithProducts,
  sendMarketingCampaign,
} from "@/lib/email/marketing-campaigns";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/campaigns/[id]/send - Send or schedule campaign
export async function POST(
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

    const campaign = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Verify campaign has products
    const campaignData = await getCampaignWithProducts(id);
    if (!campaignData.products || campaignData.products.length === 0) {
      return NextResponse.json(
        { error: "Campaign must have at least one product" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { sendImmediately, scheduledAt } = body;

    if (sendImmediately) {
      // Send immediately
      const result = await sendMarketingCampaign(id);

      return NextResponse.json({
        message: "Campaign sent",
        sent: result.sent,
        failed: result.failed,
      });
    } else if (scheduledAt) {
      // Schedule for later
      const scheduledDate = new Date(scheduledAt);

      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 },
        );
      }

      await db
        .update(emailCampaigns)
        .set({
          status: "SCHEDULED",
          scheduledAt: scheduledDate,
        })
        .where(eq(emailCampaigns.id, id));

      return NextResponse.json({
        message: "Campaign scheduled",
        scheduledAt: scheduledDate.toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          error: "Must specify either sendImmediately or scheduledAt",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error sending/scheduling campaign:", error);
    return NextResponse.json(
      { error: "Failed to send/schedule campaign" },
      { status: 500 },
    );
  }
}
