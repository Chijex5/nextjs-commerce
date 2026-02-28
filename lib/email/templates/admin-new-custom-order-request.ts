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
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
      <p><strong>Title:</strong> ${data.title}</p>
      <p><strong>Description:</strong> ${data.description}</p>
    </div>

    <a href="${data.adminUrl}" class="button">Review Request</a>
  `);
};
