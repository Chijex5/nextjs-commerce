import { requireAdminSession } from "lib/admin-auth";
import { getBackgroundRemovalUsage } from "lib/admin/background-removal";
import { NextResponse } from "next/server";

/** How many Cloudinary background removals are left in the rolling window. */
export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getBackgroundRemovalUsage());
  } catch (error) {
    console.error("Failed to load background removal usage:", error);
    return NextResponse.json(
      { error: "Failed to load usage" },
      { status: 500 },
    );
  }
}
