import { baseTemplate } from "./base";

export const adminNewOrderTemplate = (data: {
  orderNumber: string;
  orderUrl: string;
  customerName: string;
  email: string;
  phone?: string | null;
  totalAmount: number;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  currencyCode: string;
  orderDate: string;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
  }>;
}) => {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td>${item.productTitle}</td>
        <td>${item.variantTitle}</td>
        <td>${item.quantity}</td>
      </tr>
    `,
    )
    .join("");

  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: data.currencyCode || "NGN",
    maximumFractionDigits: 0,
  }).format(data.totalAmount);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: data.currencyCode || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);

  return baseTemplate(`
    <h2>New Order Received</h2>
    <p>A new order has been placed and needs attention.</p>

    <div class="info-box">
      <p><strong>Order:</strong> ${data.orderNumber}</p>
      <p><strong>Placed:</strong> ${new Date(data.orderDate).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
      <p><strong>Total:</strong> ${formattedTotal}</p>
      ${data.subtotalAmount !== undefined ? `<p><strong>Subtotal:</strong> ${formatMoney(data.subtotalAmount)}</p>` : ""}
      ${data.discountAmount && data.discountAmount > 0 ? `<p><strong>Discount${data.couponCode ? ` (${data.couponCode})` : ""}:</strong> -${formatMoney(data.discountAmount)}</p>` : ""}
      ${data.shippingAmount !== undefined ? `<p><strong>Shipping:</strong> ${formatMoney(data.shippingAmount)}</p>` : ""}
      ${data.taxAmount !== undefined && data.taxAmount > 0 ? `<p><strong>Tax:</strong> ${formatMoney(data.taxAmount)}</p>` : ""}
    </div>

    <h3>Items</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Variant</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <a href="${data.orderUrl}" class="button">View Order</a>
  `);
};
