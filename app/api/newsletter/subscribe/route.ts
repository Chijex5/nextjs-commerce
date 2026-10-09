import {
  CONSENT_SOURCES,
  subscribeEmail,
  type ConsentSource,
} from "lib/marketing/subscribe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, name, source } = await request.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const result = await subscribeEmail({
      email,
      name: typeof name === "string" ? name : null,
      source: CONSENT_SOURCES.includes(source)
        ? (source as ConsentSource)
        : "newsletter",
    });

    if (result.status === "already-subscribed") {
      return NextResponse.json(
        { message: "Already subscribed to our newsletter!" },
        { status: 200 },
      );
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
