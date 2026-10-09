import { requireAdminSession } from "lib/admin-auth";
import { countAudience, normaliseAudience } from "lib/marketing/segments";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/campaigns/audience?segment=repeat&cap=48&campaignId=…
// Live "who will get this" count for the campaign editor.
export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const audience = normaliseAudience({
    segment: p.get("segment"),
    collectionId: p.get("collectionId") || undefined,
    minSpend: p.get("minSpend") ? Number(p.get("minSpend")) : undefined,
  });
  const cap = Math.max(0, Number(p.get("cap") ?? 48) || 0);
  const counts = await countAudience(
    audience,
    cap,
    p.get("campaignId") || undefined,
  );
  return NextResponse.json(counts);
}
