import { baseTemplate } from "./base";

interface OrderConfirmationWithMarkupData {
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  currencyCode?: string;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
    productImage?: string | null;
    productUrl?: string;
    productHandle?: string;
    sku?: string;
  }>;
  shippingAddress: any;
  orderDate: string;
  orderUrl?: string;
  estimatedArrival?: string;
  trackingNumber?: string;
}

/**
 * Order confirmation email template with Google Email Markup (JSON-LD)
 * Includes structured data for Gmail to show order tracking
 */
export const orderConfirmationWithMarkupTemplate = (
  order: OrderConfirmationWithMarkupData,
) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const currencyCode = order.currencyCode || "NGN";
  const orderUrl =
    order.orderUrl ||
    `${siteUrl}/orders?orderNumber=${encodeURIComponent(order.orderNumber)}`;
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
  const supportUrl = `${siteUrl}/contact?order=${encodeURIComponent(order.orderNumber)}`;

  const formatMoney = (amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: currencyCode,
      }).format(safeAmount);
    } catch {
      return `${currencyCode} ${safeAmount.toLocaleString()}`;
    }
  };
  const formatPlainNaira = (amount: number) =>
    `₦${Math.max(amount, 0).toLocaleString("en-NG")}`;

  const itemsHtml = order.items
    .map(
      (item) => {
        const price = Number.isFinite(item.price) ? item.price : 0;
        const lineTotal = price * item.quantity;
        return `
      <tr>
        <td>
          <p style="margin: 0; font-weight: 600; color: #111827;">${item.productTitle}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #4b5563;">${item.variantTitle}</p>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatMoney(lineTotal)}</td>
      </tr>
    `;
      },
    )
    .join("");

  const shippingAddress = order.shippingAddress || {};
  const streetAddress =
    shippingAddress.address || shippingAddress.streetAddress || "";
  const addressLocality = [
    shippingAddress.ward,
    shippingAddress.lga,
    shippingAddress.city,
  ]
    .filter(Boolean)
    .join(", ");
  const addressRegion = shippingAddress.state || "";
  const addressCountry = shippingAddress.country || "NG";
  const postalCode =
    shippingAddress.postalCode || shippingAddress.postcode || "";
  const recipientName = `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim();
  const addressLines = [
    recipientName,
    streetAddress,
    [addressLocality, addressRegion].filter(Boolean).join(", "),
    postalCode,
    addressCountry,
  ].filter(Boolean);

  const expectedArrivalFrom = order.estimatedArrival
    ? new Date(order.estimatedArrival).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const expectedArrivalUntil = order.estimatedArrival
    ? new Date(order.estimatedArrival).toISOString()
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // Google Email Markup (JSON-LD) for Order
  const jsonLd = {
    "@context": "http://schema.org",
    "@type": "Order",
    merchant: {
      "@type": "Organization",
      name: "D'FOOTPRINT",
    },
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    orderStatus: "http://schema.org/OrderProcessing",
    priceCurrency: currencyCode,
    price: totalAmount,
    acceptedOffer: order.items.map((item) => {
      const productUrl =
        item.productUrl ||
        (item.productHandle
          ? `${siteUrl}/product/${item.productHandle}`
          : undefined);
      const price = Number.isFinite(item.price) ? item.price : 0;

      return {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: `${item.productTitle} - ${item.variantTitle}`,
          image: item.productImage || undefined,
          sku: item.sku || undefined,
          url: productUrl,
        },
        price,
        priceCurrency: currencyCode,
        priceSpecification: {
          "@type": "PriceSpecification",
          price,
          priceCurrency: currencyCode,
        },
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: item.quantity,
        },
      };
    }),
    customer: {
      "@type": "Person",
      name: order.customerName,
      email: order.email,
    },
    orderDelivery: {
      "@type": "ParcelDelivery",
      deliveryAddress: {
        "@type": "PostalAddress",
        streetAddress: streetAddress || undefined,
        addressLocality: addressLocality || undefined,
        addressRegion: addressRegion || undefined,
        addressCountry: addressCountry || undefined,
        postalCode: postalCode || undefined,
      },
      expectedArrivalFrom,
      expectedArrivalUntil,
      trackingNumber: order.trackingNumber || undefined,
    },
    url: orderUrl,
    potentialAction: {
      "@type": "ViewAction",
      url: orderUrl,
      name: "View Order Details",
    },
  };

  const content = `
    <!-- Google Email Markup -->
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
    </script>
    
    <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Order Confirmed</p>
    <h2>Your order has been received successfully</h2>
    <p>Hi ${order.customerName},</p>
    <p>Your payment was successful and your order is now being prepared.</p>
    
    <div class="info-box">
      <p style="font-weight: 600; color: #111827; margin-bottom: 8px;">Order ${order.orderNumber}</p>
      <p style="margin: 0;">Order date: ${new Date(order.orderDate).toLocaleDateString()}</p>
      <p style="margin: 6px 0 0; color: #4b5563;">We’ve started crafting your pair with care.</p>
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
        <tr><td colspan="2" style="text-align: right; padding-top: 16px;">Items:</td><td style="text-align: right; padding-top: 16px;">${formatPlainNaira(subtotalAmount)}</td></tr>
        <tr><td colspan="2" style="text-align: right;">Delivery:</td><td style="text-align: right;">${formatPlainNaira(shippingAmount)}</td></tr>
        ${discountAmount > 0 ? `<tr><td colspan="2" style="text-align: right;">Discount Applied${order.couponCode ? ` (${order.couponCode})` : ""}:</td><td style="text-align: right; color: #15803d;">-${formatPlainNaira(discountAmount)}</td></tr>` : ""}
        ${taxAmount > 0 ? `<tr><td colspan="2" style="text-align: right;">Tax:</td><td style="text-align: right;">${formatPlainNaira(taxAmount)}</td></tr>` : ""}
        <tr style="font-weight: 600;">
          <td colspan="2" style="text-align: right; padding-top: 16px;">Total Paid:</td>
          <td style="text-align: right; padding-top: 16px;">${formatMoney(totalAmount)}${isPromoCovered ? " (Promo Applied)" : ""}</td>
        </tr>
      </tfoot>
    </table>

    ${isPromoCovered ? `<p style="font-size: 13px; color: #525252;">Your promo covered this purchase in full, so no charge was applied at checkout.</p>` : ""}

    <div class="info-box">
      <p><strong>Shipping Address</strong></p>
      ${addressLines.map((line) => `<p>${line}</p>`).join("")}
    </div>
    
    <p>Estimated delivery: 7-10 days after production.</p>
    
    <p>What happens next: we’ll update you when your pair moves from production to dispatch.</p>
    
    <a href="${orderUrl}" class="button">View Order Details</a>
    <a href="${supportUrl}" class="button-secondary">Contact Support</a>
    ${order.trackingNumber ? `<a href="${orderUrl}" class="button-ghost">Track Order</a>` : ""}
    
    <p class="support-note">If anything looks off, reply to this email and our team will help immediately.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
