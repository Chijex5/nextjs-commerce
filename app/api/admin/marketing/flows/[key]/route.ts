import { requireAdminSession } from "lib/admin-auth";
import { FLOWS, setFlowConfig, type FlowKey } from "lib/marketing/flows";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/marketing/flows/[key]  { enabled?, settings?: { days?, couponCode? } }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await requireAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;
  if (!FLOWS.some((f) => f.key === key))
    return NextResponse.json({ error: "Unknown automation" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const settings: { days?: number; couponCode?: string } = {};
  if (body.settings?.days !== undefined) {
    const days = Number(body.settings.days);
    if (!Number.isInteger(days) || days < 1 || days > 365)
      return NextResponse.json(
        { error: "Days must be between 1 and 365" },
        { status: 400 },
      );
    settings.days = days;
  }
  if (body.settings?.couponCode !== undefined)
    settings.couponCode = String(body.settings.couponCode)
      .trim()
      .toUpperCase()
      .slice(0, 50);

  const next = await setFlowConfig(key as FlowKey, {
    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    settings,
  });
  return NextResponse.json(next);
}
