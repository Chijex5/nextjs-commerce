import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import prisma from "lib/prisma";
import { createUserSession, setUserSessionCookie } from "lib/user-session";
import { deriveNameFromEmail } from "lib/user-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    const callbackUrl = searchParams.get("callbackUrl") || "/account?welcome=1";

    if (!email || !token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid", request.url),
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const magicToken = await prisma.magicLinkToken.findFirst({
      where: {
        email,
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!magicToken) {
      return NextResponse.redirect(
        new URL("/auth/login?error=expired", request.url),
      );
    }

    await prisma.magicLinkToken.update({
      where: { id: magicToken.id },
      data: { usedAt: new Date() },
    });

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      const passwordHash = await hash(randomPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          name: deriveNameFromEmail(email),
          passwordHash,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const sessionToken = await createUserSession({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    });

    await setUserSessionCookie(sessionToken);

    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (error) {
    console.error("Magic link verify error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=failed", request.url),
    );
  }
}
