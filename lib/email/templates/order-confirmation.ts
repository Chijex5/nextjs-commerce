import { baseTemplate } from "./base";

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Order confirmation email template
 * Sent immediately after order is placed
 */
export const orderConfirmationTemplate = (order: OrderConfirmationData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const subtotalAmount = Number.isFinite(order.subtotalAmount)
    ? Number(order.subtotalAmount)
    : order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAmount = Number.isFinite(order.shippingAmount)
    ? Number(order.shippingAmount)
    : 0;
  const taxAmount = Number.isFinite(order.taxAmount) ? Number(order.taxAmount) : 0;
  const discountAmount = Number.isFinite(order.discountAmount)
    ? Math.max(Number(order.discountAmount), 0)
    : 0;
  const computedTotal = Math.max(
    subtotalAmount + shippingAmount + taxAmount - discountAmount,
    0,
  );
  const totalAmount = Number.isFinite(order.totalAmount)
    ? Math.max(Number(order.totalAmount), 0)
    : computedTotal;
  const isPromoCovered = totalAmount === 0 && discountAmount > 0;
  const orderUrl = `${siteUrl}/orders?orderNumber=${encodeURIComponent(order.orderNumber)}`;
  const supportUrl = `${siteUrl}/contact?order=${encodeURIComponent(order.orderNumber)}`;

  const formatMoney = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td>
          <p style="margin: 0; font-weight: 600; color: #111827;">${item.productTitle}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #4b5563;">${item.variantTitle}</p>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatMoney(item.price * item.quantity)}</td>
      </tr>
    `,
    )
    .join("");

  const content = `
    <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Order Confirmed</p>
    <h2>Your order has been received successfully</h2>
    <p>Hi ${order.customerName},</p>
    <p>Your payment was successful and your order is now being prepared.</p>
    
    <div class="info-box">
      <p style="font-weight: 600; color: #111827; margin-bottom: 8px;">Order ${order.orderNumber}</p>
      <p style="margin: 0;">We’ve started crafting your pair with care.</p>
      <p style="margin: 6px 0 0; color: #4b5563;">Estimated delivery: 7-10 days after production.</p>
    </div>

    <div class="info-box">
      <p style="margin-bottom: 10px;"><strong>Order timeline</strong></p>
      <p style="margin: 0 0 6px;">1. Order confirmed</p>
      <p style="margin: 0 0 6px;">2. In production (current)</p>
      <p style="margin: 0 0 6px; color: #6b7280;">3. Ready for dispatch</p>
      <p style="margin: 0; color: #6b7280;">4. Shipped</p>
      <p style="margin-top: 10px; font-size: 13px; color: #525252;">
        Your shoes are now being handcrafted by our artisans. This typically takes 7-10 days.
      </p>
    </div>
    
    <h3>Order summary</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr><td colspan="2" style="text-align: right; padding-top: 16px;">Items:</td><td style="text-align: right; padding-top: 16px;">${formatMoney(subtotalAmount)}</td></tr>
        <tr><td colspan="2" style="text-align: right;">Delivery:</td><td style="text-align: right;">${formatMoney(shippingAmount)}</td></tr>
        ${discountAmount > 0 ? `<tr><td colspan="2" style="text-align: right;">Discount Applied${order.couponCode ? ` (${order.couponCode})` : ""}:</td><td style="text-align: right; color: #15803d;">-${formatMoney(discountAmount)}</td></tr>` : ""}
        ${taxAmount > 0 ? `<tr><td colspan="2" style="text-align: right;">Tax:</td><td style="text-align: right;">${formatMoney(taxAmount)}</td></tr>` : ""}
        <tr style="font-weight: 600;">
          <td colspan="2" style="text-align: right; padding-top: 16px;">Total Paid:</td>
          <td style="text-align: right; padding-top: 16px;">${formatMoney(totalAmount)}${isPromoCovered ? " (Promo Applied)" : ""}</td>
        </tr>
      </tfoot>
    </table>
    
    ${isPromoCovered ? `<p style="font-size: 13px; color: #525252;">Your promo covered this purchase in full, so no charge was applied at checkout.</p>` : ""}
    
    <p>What happens next: we’ll update you when your pair moves from production to dispatch.</p>
    
    <a href="${orderUrl}" class="button">View Order Details</a>
    <a href="${supportUrl}" class="button-secondary">Contact Support</a>
    
    <p class="support-note">If anything looks off, reply to this email and our team will help immediately.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
