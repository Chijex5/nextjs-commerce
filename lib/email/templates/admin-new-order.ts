import { baseTemplate } from "./base";

export const adminNewOrderTemplate = (data: {
  orderNumber: string;
  orderUrl: string;
  customerName: string;
  email: string;
  phone?: string | null;
  totalAmount: number;
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
