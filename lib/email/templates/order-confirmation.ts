import { baseTemplate } from './base';

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.productTitle} - ${item.variantTitle}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₦${item.price.toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h2>Thank You for Your Order! 🎉</h2>
    <p>Hi ${order.customerName},</p>
    <p>We've received your order and it's being processed. Here are the details:</p>
    
    <h3>Order #${order.orderNumber}</h3>
    
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
        <tr style="font-weight: bold;">
          <td colspan="2" style="text-align: right;">Total:</td>
          <td style="text-align: right;">₦${order.totalAmount.toLocaleString()}</td>
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
