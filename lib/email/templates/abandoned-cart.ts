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
        <td style="padding: 15px 0; border-bottom: 1px solid #eee;">
          ${item.imageUrl ? `
          <img src="${item.imageUrl}" alt="${item.productTitle}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px; vertical-align: middle;">
          ` : ''}
          <div style="display: inline-block; vertical-align: middle;">
            <strong>${item.productTitle}</strong><br>
            <span style="color: #666; font-size: 14px;">${item.variantTitle}</span><br>
            <span style="color: #666; font-size: 14px;">Qty: ${item.quantity}</span>
          </div>
        </td>
        <td style="text-align: right; padding: 15px 0; border-bottom: 1px solid #eee; vertical-align: middle;">
          <strong>₦${item.price.toLocaleString()}</strong>
        </td>
      </tr>
    `
    )
    .join('');

  const moreItems = data.items.length > 3 ? data.items.length - 3 : 0;

  const content = `
    <h2>You Left Something Behind! 🛍️</h2>
    <p>Hi ${data.customerName},</p>
    <p>We noticed you added some beautiful handcrafted footwear to your cart but didn't complete your order. Don't worry, we've saved your items for you!</p>
    
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0;">Your Cart Items:</h3>
      <table style="width: 100%; margin: 0;">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      ${moreItems > 0 ? `
      <p style="margin-top: 15px; font-size: 14px; color: #666;">
        + ${moreItems} more item${moreItems > 1 ? 's' : ''} in your cart
      </p>
      ` : ''}
      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #000;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: bold;">Cart Total:</span>
          <span style="font-size: 24px; font-weight: bold;">₦${data.cartTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <p><strong>Why shop with D'FOOTPRINT?</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li>100% Handcrafted with love in Lagos, Nigeria</li>
      <li>Premium quality materials</li>
      <li>Unique designs you won't find anywhere else</li>
      <li>Nationwide delivery</li>
    </ul>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${siteUrl}/checkout" class="button" style="font-size: 16px; padding: 16px 32px;">
        Complete Your Order
      </a>
    </p>
    
    <p style="text-align: center; font-size: 14px; color: #666;">
      <a href="${siteUrl}/cart" style="color: #000; text-decoration: underline;">View Your Cart</a>
    </p>
    
    <p>Need help? Just reply to this email or contact us anytime.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
    
    <p style="font-size: 12px; color: #999; margin-top: 30px;">
      This is a one-time reminder about your cart. You can continue shopping at any time.
    </p>
  `;

  return baseTemplate(content);
};
