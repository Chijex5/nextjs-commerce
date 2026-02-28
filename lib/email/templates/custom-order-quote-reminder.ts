import { baseTemplate } from "./base";

export const customOrderQuoteReminderTemplate = (data: {
  customerName: string;
  requestNumber: string;
  amount: number;
  currencyCode: string;
  expiresAt: string;
  quoteUrl: string;
  reminderNumber: number;
  totalReminders: number;
}) => {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: data.currencyCode || "NGN",
    maximumFractionDigits: 0,
  }).format(data.amount);

  return baseTemplate(`
    <h2>Reminder: Your Custom Quote Is Waiting</h2>
    <p>Hi ${data.customerName},</p>
    <p>This is reminder ${data.reminderNumber} of ${data.totalReminders} for your custom order quote.</p>

    <div class="info-box">
      <p><strong>Request Number:</strong> ${data.requestNumber}</p>
      <p><strong>Quoted Amount:</strong> ${formattedAmount}</p>
      <p><strong>Quote Expires:</strong> ${new Date(data.expiresAt).toLocaleString()}</p>
    </div>

    <a href="${data.quoteUrl}" class="button">Review Quote & Pay</a>
    <p>If payment is not completed and we don't hear from you, this request may be cancelled after expiry.</p>
    <p>If you've already completed payment, you can ignore this message.</p>
  `);
};
