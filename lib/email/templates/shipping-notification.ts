import { baseTemplate } from "./base";

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
export const shippingNotificationTemplate = (
  order: ShippingNotificationData,
) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";
  const orderUrl = `${siteUrl}/orders?orderNumber=${encodeURIComponent(order.orderNumber)}`;
  const supportUrl = `${siteUrl}/contact?order=${encodeURIComponent(order.orderNumber)}`;

  const content = `
    <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Shipping Update</p>
    <h2>Your order is on the way</h2>
    <p>Hi ${order.customerName},</p>
    <p>Your order #${order.orderNumber} is on its way to you.</p>
    
    ${
      order.trackingNumber || order.estimatedArrival
        ? `<div class="info-box">
      ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ""}
      ${order.estimatedArrival ? `<p><strong>Estimated Arrival:</strong> ${order.estimatedArrival}</p>` : ""}
    </div>`
        : ""
    }
    
    <p>Your handcrafted footwear has been carefully packaged and is now being delivered to you.</p>
    
    <a href="${orderUrl}" class="button">View Order Details</a>
    <a href="${supportUrl}" class="button-secondary">Contact Support</a>
    ${order.trackingNumber ? `<a href="${orderUrl}" class="button-ghost">Track Order</a>` : ""}
    
    <p>We hope you love your new D'FOOTPRINT footwear.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
