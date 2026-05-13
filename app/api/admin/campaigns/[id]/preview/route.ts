import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCampaignWithProducts } from "@/lib/email/marketing-campaigns";
import { renderMarketingCampaignEmail } from "@/lib/email/marketing-renderer";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/campaigns/[id]/preview - Generate preview HTML
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

    const campaign = await getCampaignWithProducts(id);

    // Render preview with sample subscriber. Marketing campaigns are admin-authored
    // HTML strings instead of React Email components so copy, variables, and sales
    // offers can stay flexible without adding a component for every campaign shape.
    const previewHtml = renderMarketingCampaignEmail(
      campaign,
      {
        email: session.user.email,
        name: admin.name || "Subscriber",
      },
      "#",
    );

    return NextResponse.json({
      html: previewHtml,
      campaign,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 },
    );
  }
}
