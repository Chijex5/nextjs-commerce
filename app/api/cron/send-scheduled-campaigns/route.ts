import { db } from "@/lib/db";
import { emailCampaigns } from "@/lib/db/schema";
import { sendMarketingCampaign } from "@/lib/email/marketing-campaigns";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// POST /api/cron/send-scheduled-campaigns
// Call this endpoint hourly from your cron service (e.g., Vercel Cron, EasyCron, etc.)
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = req.headers.get("authorization");
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid cron secret" },
        { status: 401 },
      );
    }

    // Find campaigns that should be sent now
    const now = new Date();
    const scheduledCampaigns = await db
      .select()
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.status, "SCHEDULED"),
          isNotNull(emailCampaigns.scheduledAt),
          lte(emailCampaigns.scheduledAt, now),
        ),
      );

    if (scheduledCampaigns.length === 0) {
      return NextResponse.json({
        message: "No campaigns to send",
        processed: 0,
      });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const campaign of scheduledCampaigns) {
      try {
        // Send the campaign with the flexible marketing renderer.
        const result = await sendMarketingCampaign(campaign.id);
        console.log(
          `Campaign ${campaign.id} sent: ${result.sent} sent, ${result.failed} failed`,
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to send campaign ${campaign.id}:`, error);
        failureCount++;
      }
    }

    return NextResponse.json({
      message: "Cron job completed",
      processed: scheduledCampaigns.length,
      successful: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process cron job" },
      { status: 500 },
    );
  }
}
