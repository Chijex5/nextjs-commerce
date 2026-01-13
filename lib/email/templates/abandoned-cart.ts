import { baseTemplate } from './base';

interface AbandonedCartData {
  customerName: string;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
}

/**
 * Abandoned cart email template
 * Sent to logged-in users who added items to cart but didn't complete checkout
 */
export const abandonedCartTemplate = (data: AbandonedCartData) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  
  const itemsHtml = data.items
    .slice(0, 3) // Show max 3 items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
          ${item.imageUrl ? `
          <img src="${item.imageUrl}" alt="${item.productTitle}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 12px; vertical-align: middle; border: 1px solid #e5e5e5;">
          ` : ''}
          <div style="display: inline-block; vertical-align: middle;">
            <div style="font-weight: 500; color: #000000;">${item.productTitle}</div>
            <div style="color: #737373; font-size: 13px; margin-top: 2px;">${item.variantTitle}</div>
            <div style="color: #737373; font-size: 13px; margin-top: 2px;">Qty: ${item.quantity}</div>
          </div>
        </td>
        <td style="text-align: right; padding: 16px 0; border-bottom: 1px solid #e5e5e5; vertical-align: middle; font-weight: 500;">
          ₦${item.price.toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const moreItems = data.items.length > 3 ? data.items.length - 3 : 0;

  const content = `
    <h2>You Left Something Behind</h2>
    <p>Hi ${data.customerName},</p>
    <p>We noticed you added some items to your cart but didn't complete your order. Your items are saved and waiting for you.</p>
    
    <h3>Your Cart Items</h3>
    <table style="width: 100%; margin: 0;">
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    ${moreItems > 0 ? `
    <p style="margin-top: 12px; font-size: 13px; color: #737373;">
      + ${moreItems} more item${moreItems > 1 ? 's' : ''} in your cart
    </p>
    ` : ''}
    
    <div class="info-box" style="margin-top: 24px;">
      <p style="display: flex; justify-content: space-between; align-items: center; margin: 0;">
        <span style="font-weight: 500;">Cart Total:</span>
        <span style="font-size: 20px; font-weight: 600;">₦${data.cartTotal.toLocaleString()}</span>
      </p>
    </div>
    
    <h3>Why Shop with D'FOOTPRINT</h3>
    <p style="margin: 8px 0;">• 100% Handcrafted in Lagos, Nigeria</p>
    <p style="margin: 8px 0;">• Premium quality materials</p>
    <p style="margin: 8px 0;">• Unique designs</p>
    <p style="margin: 8px 0;">• Nationwide delivery</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/checkout" class="button">Complete Your Order</a>
    </div>
    
    <p style="text-align: center; font-size: 13px; color: #737373;">
      <a href="${siteUrl}/cart" style="color: #171717; text-decoration: underline;">View Your Cart</a>
    </p>
    
    <p>Need help? Just reply to this email or contact us anytime.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
    
    <p style="font-size: 12px; color: #a3a3a3; margin-top: 24px;">
      This is a one-time reminder about your cart.
    </p>
  `;

  return baseTemplate(content);
};
