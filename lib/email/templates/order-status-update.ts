import { baseTemplate } from "./base";

interface OrderStatusUpdateData {
  orderNumber: string;
  customerName: string;
  oldStatus: string;
  newStatus: string;
  deliveryStatus?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
}

/**
 * Order status update email template
 * Sent when order status changes (e.g., processing -> dispatch -> delivered)
 */
export const orderStatusUpdateTemplate = (data: OrderStatusUpdateData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  // Get status title and message
  const getStatusInfo = (status: string, deliveryStatus?: string) => {
    if (deliveryStatus === "dispatch") {
      return {
        title: "Your Order Has Been Dispatched",
        message: "Your handcrafted footwear is on its way to you.",
      };
    } else if (deliveryStatus === "in_sorting") {
      return {
        title: "Order Update: In Sorting",
        message:
          "Your order is at our sorting facility and will be dispatched soon.",
      };
    } else if (deliveryStatus === "delivered") {
      return {
        title: "Order Delivered Successfully",
        message: "Your order has been delivered. We hope you love it.",
      };
    } else if (status === "production") {
      return {
        title: "Your Order is in Production",
        message:
          "Our artisans have started handcrafting your footwear with care.",
      };
    } else if (status === "cancelled") {
      return {
        title: "Order Cancelled",
        message: "Your order has been cancelled as requested.",
      };
    } else {
      return {
        title: "Order Status Updated",
        message: "There has been an update to your order status.",
      };
    }
  };

  const statusInfo = getStatusInfo(data.newStatus, data.deliveryStatus);

  const content = `
    <h2>${statusInfo.title}</h2>
    <p>Hi ${data.customerName},</p>
    <p>${statusInfo.message}</p>
    
    <div class="info-box">
      <p><strong>Order #${data.orderNumber}</strong></p>
      <p>Previous Status: ${data.oldStatus}</p>
      <p>Current Status: ${data.newStatus}</p>
      ${data.deliveryStatus ? `<p>Delivery Status: ${data.deliveryStatus}</p>` : ""}
    </div>
    
    ${
      data.trackingNumber
        ? `
    <div class="info-box">
      <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      ${data.estimatedArrival ? `<p><strong>Estimated Arrival:</strong> ${data.estimatedArrival}</p>` : ""}
    </div>
    `
        : ""
    }
    
    <a href="${siteUrl}/orders" class="button">View Order Details</a>
    
    ${
      data.deliveryStatus === "delivered"
        ? `
    <p>We hope you love your new D'FOOTPRINT footwear. If you have any questions or concerns, please contact us.</p>
    `
        : `
    <p>You can track your order status anytime from your account.</p>
    `
    }
    
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
