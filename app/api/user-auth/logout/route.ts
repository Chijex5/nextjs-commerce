import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "lib/user-session";

export async function POST() {
  try {
    await clearUserSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 },
    );
  }
}
