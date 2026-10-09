import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers, emailCampaigns } from "@/lib/db/schema";
import { getCampaignWithProducts } from "@/lib/email/marketing-campaigns";
import { blockProblems, parseBlocks } from "lib/email/blocks";
import { processCampaign, queueCampaign } from "lib/marketing/send";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Sending happens inside this request in Resend batches of 100; anything not
// finished in time is resumed by the next call or the daily marketing cron.
export const maxDuration = 60;

/** 08:00 Lagos (07:00 UTC) on a YYYY-MM-DD date, when the daily cron runs. */
function scheduledFor(date: string) {
  const d = new Date(`${date}T07:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// POST /api/admin/campaigns/[id]/send
//   { sendImmediately: true }  queue + start sending now (also resumes a partial send)
//   { scheduleDate: "YYYY-MM-DD" }  send that morning at 08:00 Lagos
//   { unschedule: true }  back to draft
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });
    if (!admin || !admin.isActive)
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );

    const campaign = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });
    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    if (campaign.status === "SENT")
      return NextResponse.json(
        { error: "This campaign has already been sent" },
        { status: 400 },
      );

    const body = await req.json().catch(() => ({}));

    if (body.unschedule) {
      await db
        .update(emailCampaigns)
        .set({ status: "DRAFT", scheduledAt: null, updatedAt: new Date() })
        .where(eq(emailCampaigns.id, id));
      return NextResponse.json({ message: "Moved back to drafts" });
    }

    const blocks = parseBlocks(campaign.content);
    if (blocks) {
      const problems = blockProblems(blocks);
      if (problems.length)
        return NextResponse.json({ error: problems[0] }, { status: 400 });
    } else {
      const data = await getCampaignWithProducts(id);
      if (!data.products?.length) {
        return NextResponse.json(
          { error: "Add at least one product before sending" },
          { status: 400 },
        );
      }
    }
    if (!process.env.UNSUBSCRIBE_SECRET) {
      return NextResponse.json(
        {
          error:
            "UNSUBSCRIBE_SECRET isn't set, so unsubscribe links can't be generated",
        },
        { status: 500 },
      );
    }

    if (body.sendImmediately) {
      const queued =
        campaign.status === "SENDING" ? { queued: 0 } : await queueCampaign(id);
      const result = await processCampaign(id, 50_000);
      return NextResponse.json({
        message: result.remaining
          ? "Sending. The rest will finish shortly."
          : "Campaign sent",
        queued: queued.queued,
        ...result,
      });
    }

    if (typeof body.scheduleDate === "string") {
      const when = scheduledFor(body.scheduleDate);
      if (!when || when <= new Date()) {
        return NextResponse.json(
          {
            error:
              "Pick a date from tomorrow onwards (campaigns go out at 08:00 Lagos time)",
          },
          { status: 400 },
        );
      }
      await db
        .update(emailCampaigns)
        .set({ status: "SCHEDULED", scheduledAt: when, updatedAt: new Date() })
        .where(eq(emailCampaigns.id, id));
      return NextResponse.json({
        message: "Campaign scheduled",
        scheduledAt: when.toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Specify sendImmediately or scheduleDate" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error sending/scheduling campaign:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send campaign",
      },
      { status: 500 },
    );
  }
}
