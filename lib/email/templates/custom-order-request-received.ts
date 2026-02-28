import { baseTemplate } from "./base";

export const customOrderRequestReceivedTemplate = (data: {
  customerName: string;
  requestNumber: string;
  trackUrl: string;
}) => {
  return baseTemplate(`
    <h2>Custom Order Request Received</h2>
    <p>Hi ${data.customerName},</p>
    <p>We received your custom order request and our team will review it shortly.</p>

    <div class="info-box">
      <p><strong>Request Number:</strong> ${data.requestNumber}</p>
      <p><strong>Status:</strong> Submitted</p>
      <p>We will send your quote after review.</p>
    </div>

    <a href="${data.trackUrl}" class="button">Track Request</a>
    <p>Thank you for choosing D'FOOTPRINT.</p>
  `);
};
