import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "lib/email/resend";
import { contactConfirmationTemplate } from "lib/email/templates/contact-confirmation";
import { contactNotificationTemplate } from "lib/email/templates/contact-notification";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxMessageLength = 2000;

const getSupportEmail = () =>
  process.env.SUPPORT_EMAIL ||
  process.env.ADMIN_EMAIL ||
  process.env.SMTP_FROM_EMAIL ||
  "support@dfootprint.me";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const name =
      typeof payload.name === "string" ? payload.name.trim() : undefined;
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const message =
      typeof payload.message === "string" ? payload.message.trim() : "";

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    if (message.length > maxMessageLength) {
      return NextResponse.json(
        { error: "Message is too long. Please shorten it and try again." },
        { status: 400 },
      );
    }

    const supportEmail = getSupportEmail();

    const notification = await sendEmail({
      to: supportEmail,
      subject: `New contact message${name ? ` from ${name}` : ""}`,
      html: contactNotificationTemplate({
        name,
        email,
        message,
      }),
      replyTo: email,
    });

    if (!notification.success) {
      return NextResponse.json(
        { error: notification.error || "Failed to send message." },
        { status: 500 },
      );
    }

    const confirmation = await sendEmail({
      to: email,
      subject: "We received your message - D'FOOTPRINT",
      html: contactConfirmationTemplate({ name }),
      replyTo: supportEmail,
    });

    if (!confirmation.success) {
      console.warn("Contact confirmation email failed:", confirmation.error);
    }

    return NextResponse.json(
      {
        message: "Thanks for reaching out. We'll reply within 1 business day.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}
