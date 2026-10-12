import { requireAdminSession } from "lib/admin-auth";
import {
  getCustomOrderSettings,
  saveCustomOrderSettings,
} from "lib/custom-orders/settings";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getCustomOrderSettings() });
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await saveCustomOrderSettings(await request.json().catch(() => ({})));
  return NextResponse.json({ success: true, settings });
}
