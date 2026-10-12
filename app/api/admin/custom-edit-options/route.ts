import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customEditOptions } from "lib/db/schema";
import { listEditOptions } from "lib/custom-orders/edits";
import { NextRequest, NextResponse } from "next/server";
import { readEditOption } from "./validate";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ options: await listEditOptions({ activeOnly: false }) });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = readEditOption(await request.json().catch(() => ({})));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const [row] = await db.insert(customEditOptions).values(parsed.value).returning();
  return NextResponse.json({ success: true, id: row?.id }, { status: 201 });
}
