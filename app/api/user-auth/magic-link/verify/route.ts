import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { db } from "lib/db";
import { magicLinkTokens, users } from "lib/db/schema";
import { createUserSession, setUserSessionCookie } from "lib/user-session";
import { deriveNameFromEmail } from "lib/user-utils";
import { and, eq, gt, isNull } from "drizzle-orm";

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

    const [magicToken] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.email, email),
          eq(magicLinkTokens.tokenHash, tokenHash),
          isNull(magicLinkTokens.usedAt),
          gt(magicLinkTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!magicToken) {
      return NextResponse.redirect(
        new URL("/auth/login?error=expired", request.url),
      );
    }

    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.id, magicToken.id));

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      const passwordHash = await hash(randomPassword, 10);
      const [created] = await db
        .insert(users)
        .values({
          email,
          name: deriveNameFromEmail(email),
          passwordHash,
        })
        .returning();
      user = created;
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

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
