import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCampaignWithProducts } from "@/lib/email/marketing-campaigns";
import { baseTemplate } from "@/lib/email/templates/base";
import CollectionTemplate from "@/lib/email/templates/marketing-collection";
import JustArrivedTemplate from "@/lib/email/templates/marketing-just-arrived";
import SaleTemplate from "@/lib/email/templates/marketing-sale";
import { render } from "@react-email/render";
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

    // Select template based on campaign type
    let Template;
    switch (campaign.type) {
      case "JUST_ARRIVED":
        Template = JustArrivedTemplate;
        break;
      case "SALE":
        Template = SaleTemplate;
        break;
      case "COLLECTION":
        Template = CollectionTemplate;
        break;
      default:
        return NextResponse.json(
          { error: "Unknown campaign type" },
          { status: 400 },
        );
    }

    // Render preview with sample subscriber
    const previewBody = await render(
      Template({
        campaign: {
          ...campaign,
        },
        subscriber: {
          email: session.user.email,
          name: admin.name || "Subscriber",
        },
      }),
    );
    const previewHtml = baseTemplate(previewBody, "#");

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
