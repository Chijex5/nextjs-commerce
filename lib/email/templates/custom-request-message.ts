import { baseTemplate } from "./base";
import { escapeHtml } from "./email-utils";

/** A new message in a custom request's thread, to the customer or to the shop. */
export const customRequestMessageTemplate = (data: {
  recipient: "customer" | "admin";
  greetingName: string;
  fromName: string;
  requestNumber: string;
  title: string;
  body: string;
  photoCount: number;
  url: string;
}) => {
  const excerpt =
    data.body.length > 600 ? `${data.body.slice(0, 600)}…` : data.body;
  return baseTemplate(`
    <h2>${
      data.recipient === "customer"
        ? "We replied about your custom request"
        : `New message from ${escapeHtml(data.fromName)}`
    }</h2>
    <p>Hi ${escapeHtml(data.greetingName)},</p>
    <p>${escapeHtml(data.fromName)} wrote about request <strong>${data.requestNumber}</strong> (${escapeHtml(data.title)}):</p>

    <div class="info-box">
      <p style="white-space:pre-line">${escapeHtml(excerpt)}</p>
      ${data.photoCount ? `<p><em>+ ${data.photoCount} photo${data.photoCount === 1 ? "" : "s"}</em></p>` : ""}
    </div>

    <a href="${data.url}" class="button">${data.recipient === "customer" ? "Read and reply" : "Open the request"}</a>
    ${data.recipient === "customer" ? "<p>Please reply on the request page rather than to this email, so everything stays in one place.</p>" : ""}
  `);
};
