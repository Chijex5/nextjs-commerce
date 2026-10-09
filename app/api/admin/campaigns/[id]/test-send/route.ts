import { requireAdminSession } from "lib/admin-auth";
import { getCampaignWithProducts } from "lib/email/marketing-campaigns";
import { sendEmail } from "lib/email/resend";
import { prepareCampaignRenderer } from "lib/marketing/render";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/campaigns/[id]/test-send — send the saved campaign to the signed-in admin.
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
    const name = session.user.name || "Admin";
    const result = await sendEmail({
      to: session.user.email,
      subject: `[TEST] ${render.subject(name)}`,
      html: render.html(name, ""),
      preheader: render.preheader(name),
    });
    if (!result.success)
      return NextResponse.json(
        { error: "Failed to send test email" },
        { status: 500 },
      );
    return NextResponse.json({
      message: "Test email sent",
      to: session.user.email,
    });
  } catch (error) {
    console.error("Error in test-send:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 },
    );
  }
}
