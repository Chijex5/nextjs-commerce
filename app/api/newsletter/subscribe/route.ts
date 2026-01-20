import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmailTemplate } from "@/lib/email/templates/welcome";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    // Improved email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { message: "Already subscribed to our newsletter!" },
          { status: 200 },
        );
      }

      // Resubscribe
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: "active",
          subscribedAt: new Date(),
          unsubscribedAt: null,
          name: name || existing.name,
        },
      });
    } else {
      // New subscription
      await prisma.newsletterSubscriber.create({
        data: { email, name },
      });
    }

    // Send welcome email
    await sendEmail({
      to: email,
      subject: "Welcome to D'FOOTPRINT! 👋",
      html: welcomeEmailTemplate({ name: name || "Friend" }),
    });

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
