import { emailEquals } from "lib/db/email-match";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderRequests, magicLinkTokens, users } from "lib/db/schema";
import { sendWelcomeEmail } from "lib/email/auth-emails";
import { createUserSession, setUserSessionCookie } from "lib/user-session";
import {
  deriveNameFromEmail,
  normalizeEmail,
  safeRedirectPath,
} from "lib/user-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawEmail = searchParams.get("email");
    const token = searchParams.get("token");
    const callbackUrl = safeRedirectPath(
      searchParams.get("callbackUrl"),
      "/account?welcome=1",
    );

    if (!rawEmail || !token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid", request.url),
      );
    }

    const email = normalizeEmail(rawEmail);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Look up and consume the token in one statement so the same link can't
    // be used twice by concurrent requests.
    const [magicToken] = await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(magicLinkTokens.email, email),
          eq(magicLinkTokens.tokenHash, tokenHash),
          isNull(magicLinkTokens.usedAt),
          gt(magicLinkTokens.expiresAt, new Date()),
        ),
      )
      .returning({ id: magicLinkTokens.id });

    if (!magicToken) {
      return NextResponse.redirect(
        new URL("/auth/login?error=expired", request.url),
      );
    }

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

      if (user) {
        const welcomeResult = await sendWelcomeEmail({
          email: user.email,
          name: user.name,
        });

        if (!welcomeResult.success) {
          console.error("Failed to send welcome email after magic-link signup");
        }
      }
    }

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login?error=failed", request.url),
      );
    }

    if (!user.isActive) {
      return NextResponse.redirect(
        new URL("/auth/login?error=inactive", request.url),
      );
    }

    // Clicking the link proves the user owns this address.
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      })
      .where(eq(users.id, user.id));

    await db
      .update(customOrderRequests)
      .set({ userId: user.id, updatedAt: new Date() })
      .where(
        and(
          emailEquals(customOrderRequests.email, user.email),
          isNull(customOrderRequests.userId),
        ),
      );

    const sessionToken = await createUserSession({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: true,
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
