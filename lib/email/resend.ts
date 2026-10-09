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
  preheader,
  from = process.env.SMTP_FROM_EMAIL || "D'FOOTPRINT <noreply@dfootprint.me>",
  replyTo = process.env.SUPPORT_EMAIL || "support@dfootprint.me",
  headers = {},
}: {
  to: string | string[];
  subject: string;
  html: string;
  preheader?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
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
    const emailHtml = preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}</div>${html}`
      : html;

    const data = await resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html: emailHtml,
      headers,
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

export type BatchEmail = {
  to: string;
  subject: string;
  html: string;
  preheader?: string;
  headers?: Record<string, string>;
};

/**
 * Send up to 100 emails in one Resend API call (Resend's batch limit). The
 * batch is all-or-nothing; on success, ids come back in the same order.
 */
export const sendEmailBatch = async (
  emails: BatchEmail[],
  {
    from = process.env.SMTP_FROM_EMAIL || "D'FOOTPRINT <noreply@dfootprint.me>",
    replyTo = process.env.SUPPORT_EMAIL || "support@dfootprint.me",
  }: { from?: string; replyTo?: string } = {},
): Promise<
  { success: true; ids: string[] } | { success: false; error: string }
> => {
  if (!resend) return { success: false, error: "Email service not configured" };
  if (emails.length > 100)
    return { success: false, error: "Batches are limited to 100 emails" };
  try {
    const { data, error } = await resend.batch.send(
      emails.map((e) => ({
        from,
        replyTo,
        to: e.to,
        subject: e.subject,
        headers: e.headers,
        html: e.preheader
          ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${e.preheader}</div>${e.html}`
          : e.html,
      })),
    );
    if (error || !data)
      return { success: false, error: error?.message ?? "Batch send failed" };
    return { success: true, ids: data.data.map((d) => d.id) };
  } catch (err) {
    console.error("Batch email error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Batch send failed",
    };
  }
};
