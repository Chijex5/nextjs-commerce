import { baseTemplate } from "./base";
import { escapeHtml } from "./email-utils";

export const customOrderRequestReceivedTemplate = (data: {
  customerName: string;
  requestNumber: string;
  trackUrl: string;
  title?: string;
  replyHours?: number;
}) => {
  return baseTemplate(`
    <h2>We've got your custom request</h2>
    <p>Hi ${escapeHtml(data.customerName)},</p>
    <p>Thanks for sending us your idea. We look at every request by hand and will reply within ${data.replyHours ?? 24} hours with a price, or a question if we need more detail.</p>

    <div class="info-box">
      <p><strong>Request:</strong> ${data.requestNumber}</p>
      ${data.title ? `<p><strong>What you asked for:</strong> ${escapeHtml(data.title)}</p>` : ""}
      <p>You don't pay anything until you've seen and accepted the price.</p>
    </div>

    <a href="${data.trackUrl}" class="button">View your request</a>
    <p>That page shows your request's progress, and it's where we'll message you. Keep this email so you can get back to it.</p>
  `);
};
