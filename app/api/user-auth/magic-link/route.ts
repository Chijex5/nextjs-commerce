import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "lib/prisma";
import { sendMagicLinkEmail } from "lib/email/auth-emails";
import { baseUrl, ensureStartsWith } from "lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email, callbackUrl } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const safeCallback =
      typeof callbackUrl === "string" && callbackUrl.startsWith("/")
        ? callbackUrl
        : "/account?welcome=1";

    await prisma.magicLinkToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    const verifyUrl = `${baseUrl}/api/user-auth/magic-link/verify?email=${encodeURIComponent(
      email,
    )}&token=${token}&callbackUrl=${encodeURIComponent(
      ensureStartsWith(safeCallback, "/"),
    )}`;

    const emailResult = await sendMagicLinkEmail({
      email,
      loginUrl: verifyUrl,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send magic link" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent. Check your email.",
    });
  } catch (error) {
    console.error("Magic link request error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 },
    );
  }
}
