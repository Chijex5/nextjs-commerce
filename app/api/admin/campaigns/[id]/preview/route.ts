import { requireAdminSession } from "lib/admin-auth";
import { getCampaignWithProducts } from "lib/email/marketing-campaigns";
import { prepareCampaignRenderer } from "lib/marketing/render";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/campaigns/[id]/preview — render the saved campaign as a recipient would see it.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const campaign = await getCampaignWithProducts(id);
    const render = await prepareCampaignRenderer(campaign);
    const name = session.user.name || "Ada";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.json({
      html: render.html(name, `${siteUrl}/unsubscribe?preview=1`),
      campaign: {
        ...campaign,
        subject: render.subject(name),
        preheader: render.preheader(name),
      },
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 },
    );
  }
}
