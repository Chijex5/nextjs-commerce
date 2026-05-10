import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// ─── Token helpers ────────────────────────────────────────────────────────────
// Token is an HMAC-SHA256 of the email, signed with UNSUBSCRIBE_SECRET.
// This means no DB lookup is needed to validate — we just verify the signature,
// then mark the matching row as unsubscribed.

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET env var is not set");
  return secret;
}

export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", getSecret())
    .update(email.toLowerCase().trim())
    .digest("hex");
}

function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

// ─── GET /api/unsubscribe?token=<hex>&email=<address> ─────────────────────────
// Called by clicking the unsubscribe link in an email.
// We redirect to /unsubscribe?status=success|invalid|already so the UI
// can render a proper page without leaking the token in JS.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const base = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe`;

  if (!token || !email) {
    return NextResponse.redirect(`${base}?status=invalid`);
  }

  // Verify HMAC signature
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(`${base}?status=invalid`);
  }

  try {
    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (!subscriber) {
      // Token valid but email not in DB — treat as already unsubscribed
      return NextResponse.redirect(`${base}?status=already`);
    }

    if (subscriber.status === "unsubscribed") {
      return NextResponse.redirect(`${base}?status=already`);
    }

    await db
      .update(newsletterSubscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.email, email));

    return NextResponse.redirect(`${base}?status=success`);
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(`${base}?status=error`);
  }
}