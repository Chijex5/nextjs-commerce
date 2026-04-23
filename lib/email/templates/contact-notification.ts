import { baseTemplate } from "./base";

interface ContactNotificationData {
  name?: string;
  email: string;
  message: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMessage = (message: string) =>
  escapeHtml(message).replace(/\n/g, "<br />");

/**
 * Contact notification template — internal admin alert
 * Sent to the D'FOOTPRINT team when someone submits the contact form
 */
export const contactNotificationTemplate = (data: ContactNotificationData) => {
  const replyToLine = data.name
    ? `${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;`
    : escapeHtml(data.email);

  // Quick heuristic: flag messages that look like custom order enquiries
  const messageText = data.message.toLowerCase();
  const looksLikeCustomOrder = [
    "custom",
    "bespoke",
    "size",
    "colour",
    "color",
    "material",
    "leather",
    "sole",
    "design",
    "order",
  ].some((kw) => messageText.includes(kw));

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Internal · Contact form submission</p>
    <h2 style="margin: 0 0 20px;">New message from your website.</h2>

    <!-- Sender details -->
    <div class="info-box">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 0 0 10px; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">From</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${replyToLine}</p>
          </td>
        </tr>
        ${
          data.name
            ? `<tr>
          <td style="padding: 0; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Email</p>
            <p style="margin: 0; font-size: 14px; color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${escapeHtml(data.email)}</p>
          </td>
        </tr>`
            : ""
        }
      </table>
    </div>

    <!-- Message body -->
    <p style="margin: 24px 0 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Message</p>
    <div style="border-left: 3px solid #111111; padding: 14px 16px; background-color: #f8f8f7; border-radius: 0 4px 4px 0; margin: 0 0 24px;">
      <p style="margin: 0; font-size: 14px; color: #1a1a1a; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; white-space: pre-wrap;">${formatMessage(data.message)}</p>
    </div>

    ${
      looksLikeCustomOrder
        ? `<div style="border: 1.5px solid #111111; border-radius: 2px; padding: 12px 16px; margin: 0 0 24px; background: #fff;">
        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
          Heads up — this message may be a custom order enquiry. Ask about size, colours, materials, and their deadline when you reply.
        </p>
      </div>`
        : ""
    }

    <!-- Reply CTA -->
    <a href="mailto:${escapeHtml(data.email)}?subject=Re: Your message to D'FOOTPRINT" class="button">Reply to ${data.name ? escapeHtml(data.name.trim().split(/\s+/)[0] ?? "Sender") : "Sender"}</a>

    <p style="font-size: 12px; color: #c4c4c4; margin: 20px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
      This is an automated notification from the D'FOOTPRINT contact form. Reply directly to the sender — do not reply to this email address.
    </p>
  `;

  return baseTemplate(content);
};