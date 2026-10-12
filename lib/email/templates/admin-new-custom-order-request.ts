import { escapeHtml } from "./email-utils";
import { baseTemplate } from "./base";

export const adminNewCustomOrderRequestTemplate = (data: {
  customerName: string;
  email: string;
  phone?: string | null;
  requestNumber: string;
  title: string;
  description: string;
  adminUrl: string;
}) => {
  return baseTemplate(`
    <h2>New Custom Order Request</h2>
    <p>A customer submitted a new custom order request.</p>

    <div class="info-box">
      <p><strong>Request Number:</strong> ${data.requestNumber}</p>
      <p><strong>Customer:</strong> ${escapeHtml(data.customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      ${data.phone ? `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>` : ""}
      <p><strong>Title:</strong> ${escapeHtml(data.title)}</p>
      <p style="white-space:pre-line"><strong>Details:</strong>
${escapeHtml(data.description)}</p>
    </div>

    <a href="${data.adminUrl}" class="button">Review Request</a>
  `);
};
