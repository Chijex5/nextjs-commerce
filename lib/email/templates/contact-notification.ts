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

export const contactNotificationTemplate = (
  data: ContactNotificationData,
) => {
  const nameLine = data.name
    ? `<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>`
    : "";

  const content = `
    <h2>New Contact Message</h2>
    ${nameLine}
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <div class="info-box">
      <p style="margin: 0 0 8px 0;"><strong>Message</strong></p>
      <p style="margin: 0;">${formatMessage(data.message)}</p>
    </div>
  `;

  return baseTemplate(content);
};
