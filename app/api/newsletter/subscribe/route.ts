import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { sendNewsletterWelcomeEmail } from "@/lib/email/newsletter-emails";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { message: "Already subscribed to our newsletter!" },
          { status: 200 },
        );
      }

      await db
        .update(newsletterSubscribers)
        .set({
          status: "active",
          subscribedAt: new Date(),
          unsubscribedAt: null,
          name: name || existing.name,
        })
        .where(eq(newsletterSubscribers.email, email));
    } else {
      await db.insert(newsletterSubscribers).values({ email, name });
    }

    const welcomeResult = await sendNewsletterWelcomeEmail({
      email,
      name: name || "Friend",
    });

    if (!welcomeResult.success) {
      console.error("Failed to send newsletter welcome email");
    }

    return NextResponse.json(
      {
        message:
          "Successfully subscribed! Check your email for a welcome message.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 },
    );
  }
}
