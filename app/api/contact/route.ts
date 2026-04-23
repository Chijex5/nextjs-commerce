import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "lib/email/resend";
import { contactConfirmationTemplate } from "lib/email/templates/contact-confirmation";
import { contactNotificationTemplate } from "lib/email/templates/contact-notification";
import { handleApiError } from "lib/errors";
import { getAdminNotificationEmails } from "@/lib/email/admin-notification-emails";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxMessageLength = 2000;


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

    const adminEmails = await getAdminNotificationEmails();
    if (adminEmails.length === 0) {
      console.warn("No admin emails configured for contact notifications.");
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 },
      );
    }
    const notification = await sendEmail({
      to: adminEmails,
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
      replyTo: "support@dfootprint.me",
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
    return handleApiError(error, "Contact form");
  }
}
