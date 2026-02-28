import { baseTemplate } from "./base";

export const customOrderQuoteExpiredTemplate = (data: {
  customerName: string;
  requestNumber: string;
  trackUrl: string;
  cleanupAfterDays: number;
}) =>
  baseTemplate(`
    <h2>Your Custom Quote Has Expired</h2>
    <p>Hi ${data.customerName},</p>
    <p>Your custom quote for request <strong>${data.requestNumber}</strong> has expired and is now marked as cancelled.</p>
    <p>We will retain this request for ${data.cleanupAfterDays} day${data.cleanupAfterDays === 1 ? "" : "s"}.</p>
    <p>If we do not receive payment or a reply from you within that window, we will permanently delete the request.</p>

    <a href="${data.trackUrl}" class="button">Track Request</a>
    <p>If you still want this pair, reply to this email and we can issue a fresh quote.</p>
  `);
