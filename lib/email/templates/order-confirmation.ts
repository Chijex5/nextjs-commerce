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

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.productTitle} - ${item.variantTitle}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₦${item.price.toLocaleString()}</td>
      </tr>
    `,
    )
    .join("");

  const content = `
    <h2>Thank You for Your Order</h2>
    <p>Hi ${order.customerName},</p>
    <p>We've received your order and it's being processed.</p>
    
    <div class="info-box">
      <p><strong>Order #${order.orderNumber}</strong></p>
    </div>
    
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
        ${order.subtotalAmount !== undefined ? `<tr><td colspan="2" style="text-align: right; padding-top: 16px;">Subtotal:</td><td style="text-align: right; padding-top: 16px;">₦${order.subtotalAmount.toLocaleString()}</td></tr>` : ""}
        ${order.discountAmount && order.discountAmount > 0 ? `<tr><td colspan="2" style="text-align: right;">Discount${order.couponCode ? ` (${order.couponCode})` : ""}:</td><td style="text-align: right; color: #15803d;">-₦${order.discountAmount.toLocaleString()}</td></tr>` : ""}
        ${order.shippingAmount !== undefined ? `<tr><td colspan="2" style="text-align: right;">Shipping:</td><td style="text-align: right;">₦${order.shippingAmount.toLocaleString()}</td></tr>` : ""}
        ${order.taxAmount !== undefined && order.taxAmount > 0 ? `<tr><td colspan="2" style="text-align: right;">Tax:</td><td style="text-align: right;">₦${order.taxAmount.toLocaleString()}</td></tr>` : ""}
        <tr style="font-weight: 600;">
          <td colspan="2" style="text-align: right; padding-top: 16px;">Total:</td>
          <td style="text-align: right; padding-top: 16px;">₦${order.totalAmount.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    
    <p>Your order will be handcrafted with care. Production typically takes 7 days, after which we'll ship it to you.</p>
    
    <p>You'll receive another email when your order ships.</p>
    
    <a href="${siteUrl}/orders" class="button">Track Your Order</a>
    
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
