import { baseTemplate } from "./base";

export const customOrderQuoteSentTemplate = (data: {
  customerName: string;
  requestNumber: string;
  amount: number;
  currencyCode: string;
  expiresAt?: string | null;
  quoteUrl: string;
  note?: string | null;
}) => {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: data.currencyCode || "NGN",
    maximumFractionDigits: 0,
  }).format(data.amount);

  return baseTemplate(`
    <h2>Your Custom Order Quote Is Ready</h2>
    <p>Hi ${data.customerName},</p>
    <p>We reviewed your request and prepared a quote for your custom pair.</p>

    <div class="info-box">
      <p><strong>Request Number:</strong> ${data.requestNumber}</p>
      <p><strong>Quoted Amount:</strong> ${formattedAmount}</p>
      ${data.expiresAt ? `<p><strong>Quote Expires:</strong> ${new Date(data.expiresAt).toLocaleString()}</p>` : ""}
      ${data.note ? `<p><strong>Note:</strong> ${data.note}</p>` : ""}
    </div>

    <a href="${data.quoteUrl}" class="button">View Quote & Pay</a>
    <p>If we don't receive payment or a reply after this quote expires, we may close and eventually delete this request.</p>
    <p>If you have questions, reply to this email.</p>
  `);
};
