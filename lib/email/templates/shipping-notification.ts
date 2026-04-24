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

  const firstName = order.customerName?.trim().split(/\s+/)[0] || "there";
  const hasTracking = !!order.trackingNumber;
  const hasArrival = !!order.estimatedArrival;

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">On its way</p>
    <h2 style="margin: 0 0 20px;">Your pair has left the workshop, ${firstName}.</h2>

    <p>
      Your order has been packed and dispatched. It's now in the hands of our delivery partner and heading your way.
    </p>

    ${
      hasTracking || hasArrival
        ? `<div class="info-box" style="margin-top: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            ${
              hasTracking
                ? `<td style="vertical-align: top; padding: 0 ${hasArrival ? "20px" : "0"} 0 0;">
                <p style="margin: 0 0 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Tracking number</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.04em;">${order.trackingNumber}</p>
              </td>`
                : ""
            }
            ${
              hasArrival
                ? `<td style="vertical-align: top; ${hasTracking ? "text-align: right;" : ""}">
                <p style="margin: 0 0 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Expected arrival</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${order.estimatedArrival}</p>
              </td>`
                : ""
            }
          </tr>
        </table>
      </div>`
        : `<p style="font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; margin: 16px 0 0;">
        Tracking information will be available once the courier scans the package. Check your order page for updates.
      </p>`
    }

    <!-- What to expect -->
    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 28px 0 24px;">
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">What to expect</p>
    <p style="font-size: 13px; color: #6b7280; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0;">
      Your footwear has been wrapped and packed to protect it in transit. Once it arrives, allow the leather a moment to settle — if it's been folded for shipping, a day in a well-ventilated space will restore its shape.
    </p>

    <!-- CTAs -->
    <a href="${orderUrl}" class="button" style="margin-top: 28px;">View My Order</a>
    ${hasTracking ? `<a href="${orderUrl}" class="button-secondary" style="margin-top: 10px;">Track My Delivery</a>` : ""}
    <a href="${supportUrl}" class="button-ghost" style="display: inline-block; margin-top: 14px;">Contact Support</a>

    <p style="font-size: 13px; color: #9ca3af; font-style: italic; margin: 24px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
      Something looks off or a delivery issue comes up? Reply to this email — we'll get on it immediately.
    </p>

    <p style="font-size: 14px; color: #374151; margin: 20px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      <strong style="color: #111111;">The D'FOOTPRINT Team</strong>
    </p>
  `;

  return baseTemplate(content);
};