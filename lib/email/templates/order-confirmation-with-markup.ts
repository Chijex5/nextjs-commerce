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

  // ─── Item rows: cleaner visual separation ──────────────────────────────────
  const itemsHtml = order.items
    .map((item) => {
      const price = Number.isFinite(item.price) ? item.price : 0;
      const lineTotal = price * item.quantity;
      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <p style="margin: 0; font-weight: 600; color: #111827; font-size: 14px;">${item.productTitle}</p>
          <p style="margin: 3px 0 0; font-size: 12px; color: #6b7280; letter-spacing: 0.02em;">${item.variantTitle}</p>
        </td>
        <td style="text-align: center; padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">×${item.quantity}</td>
        <td style="text-align: right; padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827; font-size: 14px; white-space: nowrap;">${formatMoney(lineTotal)}</td>
      </tr>
    `;
    })
    .join("");

  // ─── Address ───────────────────────────────────────────────────────────────
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

  // ─── Delivery dates ────────────────────────────────────────────────────────
  const expectedArrivalFrom = order.estimatedArrival
    ? new Date(order.estimatedArrival).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const expectedArrivalUntil = order.estimatedArrival
    ? new Date(order.estimatedArrival).toISOString()
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // ─── Google Email Markup (JSON-LD) ─────────────────────────────────────────
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

  // ─── Timeline steps ────────────────────────────────────────────────────────
  // Step 1 (confirmed) is always active. Step 2 (in production) is active at
  // order placement. Steps 3–4 are pending.
  const timelineSteps = [
    { label: "Order confirmed", active: true },
    { label: "In production", active: true },
    { label: "Ready for dispatch", active: false },
    { label: "Shipped & on its way", active: false },
  ];

  const timelineHtml = timelineSteps
    .map(
      (step, i) => `
      <tr>
        <td style="width: 28px; padding: 0; vertical-align: top;">
          <div style="
            width: 22px; height: 22px; border-radius: 50%;
            background: ${step.active ? "#111827" : "#e5e7eb"};
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700;
            color: ${step.active ? "#ffffff" : "#9ca3af"};
            text-align: center; line-height: 22px;
          ">${i + 1}</div>
          ${
            i < timelineSteps.length - 1
              ? `<div style="width: 1px; height: 18px; background: ${step.active ? "#111827" : "#e5e7eb"}; margin: 3px 0 3px 10px;"></div>`
              : ""
          }
        </td>
        <td style="padding: 2px 0 ${i < timelineSteps.length - 1 ? "18px" : "0"} 10px; vertical-align: top;">
          <span style="
            font-size: 13px;
            color: ${step.active ? "#111827" : "#9ca3af"};
            font-weight: ${step.active ? "600" : "400"};
          ">${step.label}${i === 1 ? ' <span style="font-size: 11px; background: #111827; color: #fff; padding: 1px 7px; border-radius: 9px; vertical-align: middle; letter-spacing: 0.04em;">NOW</span>' : ""}</span>
        </td>
      </tr>
    `,
    )
    .join("");

  // ─── Template content ──────────────────────────────────────────────────────
  const content = `
    <!-- Google Email Markup -->
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
    </script>

    <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; font-weight: 700;">Order Confirmed</p>
    <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827; font-weight: 700; line-height: 1.3;">Thank you, ${order.customerName.split(" ")[0]}. Your pair is on its way to you.</h2>
    <p style="color: #374151; margin: 0 0 24px; line-height: 1.6;">
      We've received your order and your payment has been confirmed. Our artisans are already getting started — every pair is made by hand, so we take the time to get it right.
    </p>

    <!-- Order meta -->
    <div class="info-box">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 0 0 4px;">
            <span style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 600;">Order number</span><br>
            <span style="font-size: 15px; font-weight: 700; color: #111827;">${order.orderNumber}</span>
          </td>
          <td style="text-align: right; padding: 0 0 4px; vertical-align: top;">
            <span style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 600;">Order date</span><br>
            <span style="font-size: 14px; color: #374151;">${new Date(order.orderDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Timeline -->
    <div class="info-box">
      <p style="margin: 0 0 14px; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; font-weight: 700;">Where your order is now</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tbody>
          ${timelineHtml}
        </tbody>
      </table>
      <p style="margin: 14px 0 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
        Handcrafting your shoes takes about <strong style="color: #374151;">7–10 days</strong>. You'll hear from us again once they're ready to leave our workshop.
      </p>
    </div>

    <!-- Order summary -->
    <h3 style="font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; font-weight: 700; margin: 28px 0 12px;">What you ordered</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #111827;">
          <th style="text-align: left; padding: 0 0 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Item</th>
          <th style="text-align: center; padding: 0 8px 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Qty</th>
          <th style="text-align: right; padding: 0 0 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="text-align: right; padding: 14px 8px 4px; font-size: 13px; color: #6b7280;">Subtotal</td>
          <td style="text-align: right; padding: 14px 0 4px; font-size: 13px; color: #374151;">${formatPlainNaira(subtotalAmount)}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right; padding: 0 8px 4px; font-size: 13px; color: #6b7280;">Delivery</td>
          <td style="text-align: right; padding: 0 0 4px; font-size: 13px; color: #374151;">${formatPlainNaira(shippingAmount)}</td>
        </tr>
        ${
          discountAmount > 0
            ? `<tr>
          <td colspan="2" style="text-align: right; padding: 0 8px 4px; font-size: 13px; color: #6b7280;">Discount${order.couponCode ? ` (${order.couponCode})` : ""}</td>
          <td style="text-align: right; padding: 0 0 4px; font-size: 13px; color: #15803d; font-weight: 600;">−${formatPlainNaira(discountAmount)}</td>
        </tr>`
            : ""
        }
        ${
          taxAmount > 0
            ? `<tr>
          <td colspan="2" style="text-align: right; padding: 0 8px 4px; font-size: 13px; color: #6b7280;">Tax</td>
          <td style="text-align: right; padding: 0 0 4px; font-size: 13px; color: #374151;">${formatPlainNaira(taxAmount)}</td>
        </tr>`
            : ""
        }
        <tr style="border-top: 2px solid #111827;">
          <td colspan="2" style="text-align: right; padding: 12px 8px 0; font-size: 15px; font-weight: 700; color: #111827;">Total paid</td>
          <td style="text-align: right; padding: 12px 0 0; font-size: 15px; font-weight: 700; color: #111827; white-space: nowrap;">
            ${formatMoney(totalAmount)}${isPromoCovered ? `<br><span style="font-size: 11px; font-weight: 400; color: #15803d;">Covered by promo</span>` : ""}
          </td>
        </tr>
      </tfoot>
    </table>

    ${
      isPromoCovered
        ? `<p style="margin: 12px 0 0; font-size: 13px; color: #6b7280; line-height: 1.6;">Your promo code covered this order in full — nothing was charged to you.</p>`
        : ""
    }

    <!-- Shipping address -->
    <div class="info-box" style="margin-top: 28px;">
      <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 700;">Shipping to</p>
      ${addressLines.map((line, i) => `<p style="margin: ${i === 0 ? "0" : "3px 0 0"}; font-size: 14px; color: ${i === 0 ? "#111827" : "#374151"}; font-weight: ${i === 0 ? "600" : "400"};">${line}</p>`).join("")}
    </div>

    <!-- Delivery note -->
    <p style="margin: 24px 0 8px; font-size: 14px; color: #374151; line-height: 1.6;">
      <strong style="color: #111827;">Estimated delivery:</strong> 7–14 days from today, once your pair leaves our workshop.
    </p>
    <p style="margin: 0 0 28px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      We'll send you another email as soon as your order ships — with a tracking link if one is available.
    </p>

    <!-- CTA buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
      <tr>
        <td style="padding-right: 8px;">
          <a href="${orderUrl}" class="button" style="display: block; text-align: center;">View My Order</a>
        </td>
        <td style="padding-left: 8px;">
          <a href="${supportUrl}" class="button-secondary" style="display: block; text-align: center;">Contact Support</a>
        </td>
      </tr>
    </table>
    ${order.trackingNumber ? `<a href="${orderUrl}" class="button-ghost" style="display: block; text-align: center; margin-bottom: 24px;">Track My Delivery</a>` : ""}

    <!-- Sign-off -->
    <p style="font-size: 13px; color: #9ca3af; margin: 0 0 6px; line-height: 1.6;">
      Something doesn't look right? Reply to this email — our team will sort it out for you right away.
    </p>
    <p style="font-size: 14px; color: #374151; margin: 16px 0 0; line-height: 1.7;">
      Warm regards,<br>
      <strong style="color: #111827;">The D'FOOTPRINT Team</strong>
    </p>
  `;

  return baseTemplate(content);
};