import { baseTemplate } from './base';

interface ShippingNotificationData {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  estimatedArrival?: string;
}

/**
 * Shipping notification email template
 * Sent when order is dispatched for delivery
 */
export const shippingNotificationTemplate = (order: ShippingNotificationData) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  
  const content = `
    <h2>Your Order Has Shipped! 📦</h2>
    <p>Hi ${order.customerName},</p>
    <p>Great news! Your order #${order.orderNumber} is on its way to you.</p>
    
    ${
      order.trackingNumber
        ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>`
        : ''
    }
    ${
      order.estimatedArrival
        ? `<p><strong>Estimated Arrival:</strong> ${order.estimatedArrival}</p>`
        : ''
    }
    
    <p>Your handcrafted footwear has been carefully packaged and is now being delivered to you.</p>
    
    <a href="${siteUrl}/orders" class="button">Track Your Order</a>
    
    <p>We hope you love your new D'FOOTPRINT footwear!</p>
    <p>Thank you for shopping with us!</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
