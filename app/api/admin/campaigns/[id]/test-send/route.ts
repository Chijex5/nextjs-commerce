import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCampaignWithProducts } from "@/lib/email/marketing-campaigns";
import { renderMarketingCampaignEmail } from "@/lib/email/marketing-renderer";
import { sendEmail } from "@/lib/email/resend";
import { renderVariables } from "@/lib/email/templates/marketing-campaign-base";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/campaigns/[id]/test-send - Send a test email to the admin
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

    // Fetch campaign with products
    const campaign = await getCampaignWithProducts(id);

    // Build mock subscriber for preview
    const mockSubscriber = {
      name: admin.name || "Admin",
      email: admin.email,
    };

    // Render email HTML. Pass empty unsubscribe URL so footer is omitted.
    const emailHtml = renderMarketingCampaignEmail(campaign as any, mockSubscriber as any, "");

    const subject = `[TEST] ${renderVariables(campaign.subject, { campaign, subscriber: mockSubscriber, siteUrl: process.env.NEXT_PUBLIC_SITE_URL|| "http://localhost:3000" })}`;


      const preheader = renderVariables(campaign?.preheader || "", {
        campaign,
        subscriber: mockSubscriber,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      });

      const result = await sendEmail({
        to: admin.email as string,
        subject,
        html: emailHtml,
        preheader,
      });

    if (!result.success) {
      console.error("Test send failed:", result.error);
      return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Test email sent", to: admin.email });
  } catch (error) {
    console.error("Error in test-send:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}


