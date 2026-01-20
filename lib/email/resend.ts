// Resend email utility
import { Resend } from "resend";

// Validate Resend API key
if (!process.env.RESEND_API_KEY) {
  console.warn(
    "RESEND_API_KEY is not set in environment variables. Emails will not be sent.",
  );
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Send an email using Resend
 * @param to - Recipient email address(es)
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @param from - Sender email address
 * @returns Promise with success status and data or error
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.SMTP_FROM_EMAIL || "noreply@yourdomain.com",
  replyTo = process.env.SUPPORT_EMAIL || "support@dfootprint.me",
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) => {
  if (!resend) {
    console.error(
      "Resend is not initialized. Please set RESEND_API_KEY environment variable.",
    );
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    // Log full error for debugging but don't expose to client
    console.error("Email sending error:", error);
    return {
      success: false,
      error: "Failed to send email. Please try again.",
    };
  }
};
