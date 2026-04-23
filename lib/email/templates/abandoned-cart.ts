import { baseTemplate } from "./base";

interface AbandonedCartData {
  abandonedCartId: string;
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
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const firstName = data.customerName?.trim().split(/\s+/)[0] || "there";

  const completeOrderUrl = `${siteUrl}/checkout?abandoned-cart=${encodeURIComponent(data.abandonedCartId)}`;
  const viewCartUrl = `${siteUrl}/?abandoned-cart=${encodeURIComponent(data.abandonedCartId)}&view-cart=1`;

  const visibleItems = data.items.slice(0, 3);
  const hiddenCount = data.items.length - visibleItems.length;

  // Table-based item rows — no inline-block, safe for Outlook + Gmail
  const itemsHtml = visibleItems
    .map((item) => {
      const safePrice = Number.isFinite(item.price) ? item.price : 0;
      const lineTotal = safePrice * item.quantity;

      return `
      <tr>
        ${
          item.imageUrl
            ? `<td width="68" style="padding: 14px 12px 14px 0; vertical-align: top; border-bottom: 1px solid #f0f0ee;">
                <img
                  src="${item.imageUrl}"
                  alt="${item.productTitle}"
                  width="56"
                  height="56"
                  style="display: block; width: 56px; height: 56px; object-fit: cover; border: 1px solid #e8e8e6; border-radius: 2px;"
                />
              </td>`
            : ""
        }
        <td style="padding: 14px 0; vertical-align: top; border-bottom: 1px solid #f0f0ee;">
          <p style="margin: 0 0 3px; font-size: 14px; font-weight: 600; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${item.productTitle}</p>
          <p style="margin: 0 0 2px; font-size: 12px; color: #737373; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.02em;">${item.variantTitle}</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Qty: ${item.quantity}</p>
        </td>
        <td style="padding: 14px 0 14px 12px; vertical-align: top; text-align: right; border-bottom: 1px solid #f0f0ee; white-space: nowrap;">
          <span style="font-size: 14px; font-weight: 600; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">₦${lineTotal.toLocaleString("en-NG")}</span>
        </td>
      </tr>
    `;
    })
    .join("");

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Your cart</p>
    <h2 style="margin: 0 0 20px;">Still thinking it over, ${firstName}?</h2>

    <p>
      You left a few things in your cart. They're still there — we've held them for you. Each piece is made by hand, so we can't always promise the same sizes and styles stay available for long.
    </p>

    <!-- Cart items -->
    <p style="margin: 28px 0 12px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Items you left behind</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0;">
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    ${
      hiddenCount > 0
        ? `<p style="margin: 10px 0 0; font-size: 13px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
            + ${hiddenCount} more item${hiddenCount > 1 ? "s" : ""} in your cart
          </p>`
        : ""
    }

    <!-- Cart total -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0 0; border: 1.5px solid #111111; border-radius: 2px;">
      <tr>
        <td style="padding: 14px 16px; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;">
          Cart total
        </td>
        <td style="padding: 14px 16px; text-align: right;">
          <span style="font-size: 20px; font-weight: 700; color: #111111; font-family: Georgia, 'Times New Roman', Times, serif; letter-spacing: -0.01em;">₦${data.cartTotal.toLocaleString("en-NG")}</span>
        </td>
      </tr>
    </table>

    <!-- CTAs -->
    <a href="${completeOrderUrl}" class="button" style="margin-top: 24px;">Complete My Order</a>
    <a href="${viewCartUrl}" class="button-secondary" style="margin-top: 10px;">Review My Cart</a>

    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 32px 0 24px;">

    <!-- Reassurance — no bullet lists, prose instead -->
    <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Why people keep coming back</p>
    <p style="font-size: 13px; color: #6b7280; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0;">
      Every pair is cut, stitched, and finished by hand in our Lagos workshop using premium leather. No shortcuts. No mass production. If something isn't right, we fix it. And we deliver across Nigeria.
    </p>

    <p style="font-size: 13px; color: #9ca3af; font-style: italic; margin: 24px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
      Have a question before you checkout? Reply to this email — we'll sort it out for you.
    </p>

    <p style="font-size: 14px; color: #374151; margin: 24px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      <strong style="color: #111111;">The D'FOOTPRINT Team</strong>
    </p>

    <p style="font-size: 11px; color: #c4c4c4; margin: 20px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      This is a one-time reminder. We won't keep following up.
    </p>
  `;

  return baseTemplate(content);
};