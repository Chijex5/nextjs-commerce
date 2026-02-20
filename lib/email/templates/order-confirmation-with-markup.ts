import { baseTemplate } from "./base";

interface OrderConfirmationWithMarkupData {
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
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
  const totalAmount = Number.isFinite(order.totalAmount) ? order.totalAmount : 0;
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

  const itemsHtml = order.items
    .map(
      (item) => {
        const price = Number.isFinite(item.price) ? item.price : 0;
        return `
      <tr>
        <td>${item.productTitle} - ${item.variantTitle}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatMoney(price)}</td>
      </tr>
    `;
      },
    )
    .join("");

  const shippingAddress = order.shippingAddress || {};
  const streetAddress =
    shippingAddress.address || shippingAddress.streetAddress || "";
  const addressLocality = shippingAddress.city || shippingAddress.lga || "";
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
    
    <h2>Thank You for Your Order</h2>
    <p>Hi ${order.customerName},</p>
    <p>We've received your order and it's being processed.</p>
    
    <div class="info-box">
      <p><strong>Order #${order.orderNumber}</strong></p>
      <p>Order Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
      <p>Status: Processing</p>
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
        <tr style="font-weight: 600;">
          <td colspan="2" style="text-align: right; padding-top: 16px;">Total:</td>
          <td style="text-align: right; padding-top: 16px;">${formatMoney(totalAmount)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="info-box">
      <p><strong>Shipping Address</strong></p>
      ${addressLines.map((line) => `<p>${line}</p>`).join("")}
    </div>
    
    <p>Your order will be handcrafted with care. Production typically takes 7-10 days, after which we'll ship it to you.</p>
    
    <p>You'll receive another email when your order ships with tracking information.</p>
    
    <a href="${orderUrl}" class="button">Track Your Order</a>
    
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
