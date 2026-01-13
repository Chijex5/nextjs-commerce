import { baseTemplate } from './base';

interface OrderConfirmationWithMarkupData {
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: any;
  orderDate: string;
}

/**
 * Order confirmation email template with Google Email Markup (JSON-LD)
 * Includes structured data for Gmail to show order tracking
 */
export const orderConfirmationWithMarkupTemplate = (order: OrderConfirmationWithMarkupData) => {
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

  // Google Email Markup (JSON-LD) for Order
  const jsonLd = {
    "@context": "http://schema.org",
    "@type": "Order",
    "merchant": {
      "@type": "Organization",
      "name": "D'FOOTPRINT"
    },
    "orderNumber": order.orderNumber,
    "orderDate": order.orderDate,
    "orderStatus": "http://schema.org/OrderProcessing",
    "priceCurrency": "NGN",
    "price": order.totalAmount,
    "acceptedOffer": order.items.map(item => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "Product",
        "name": `${item.productTitle} - ${item.variantTitle}`
      },
      "price": item.price,
      "priceCurrency": "NGN",
      "eligibleQuantity": {
        "@type": "QuantitativeValue",
        "value": item.quantity
      }
    })),
    "customer": {
      "@type": "Person",
      "name": order.customerName,
      "email": order.email
    },
    "orderDelivery": {
      "@type": "ParcelDelivery",
      "deliveryAddress": {
        "@type": "PostalAddress",
        "streetAddress": order.shippingAddress.address,
        "addressLocality": order.shippingAddress.city,
        "addressRegion": order.shippingAddress.state,
        "addressCountry": "NG"
      },
      "expectedArrivalFrom": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      "expectedArrivalUntil": new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    "url": `${siteUrl}/orders`,
    "potentialAction": {
      "@type": "ViewAction",
      "url": `${siteUrl}/orders`,
      "name": "View Order"
    }
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
          <td style="text-align: right; padding-top: 16px;">₦${order.totalAmount.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    
    <div class="info-box">
      <p><strong>Shipping Address</strong></p>
      <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
      <p>${order.shippingAddress.address}</p>
      <p>${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
      <p>Nigeria</p>
    </div>
    
    <p>Your order will be handcrafted with care. Production typically takes 7-10 days, after which we'll ship it to you.</p>
    
    <p>You'll receive another email when your order ships with tracking information.</p>
    
    <a href="${siteUrl}/orders" class="button">Track Your Order</a>
    
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
