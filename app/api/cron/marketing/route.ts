import { isCronAuthorized } from "lib/cron-auth";
import { runFlows } from "lib/marketing/flows";
import { runDueCampaigns } from "lib/marketing/send";
import { NextRequest, NextResponse } from "next/server";

// Daily at 08:00 Lagos (see vercel.json): sends campaigns scheduled for today,
// resumes any send that didn't finish, then runs the automated flows.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = await runDueCampaigns(40_000);
  const flows = await runFlows();
  return NextResponse.json({ ok: true, campaigns, flows });
}
