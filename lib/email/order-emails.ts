import { sendEmail } from "./resend";
import { orderConfirmationTemplate } from "./templates/order-confirmation";
import { orderConfirmationWithMarkupTemplate } from "./templates/order-confirmation-with-markup";
import { shippingNotificationTemplate } from "./templates/shipping-notification";
import { orderStatusUpdateTemplate } from "./templates/order-status-update";
import { abandonedCartTemplate } from "./templates/abandoned-cart";
import { getReviewApprovedEmailTemplate } from "./templates/review-approved";
import { adminNewOrderTemplate } from "./templates/admin-new-order";

const ORDER_FROM_EMAIL = "order@dfootprint.me";
const ORDER_REPLY_TO = "support@dfootprint.me";

interface OrderData {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  email: string;
  totalAmount: number;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
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
  trackingNumber?: string;
  estimatedArrival?: string;
  shippingAddress?: any;
  orderDate?: string;
}

/**
 * Send order confirmation email with Google Email Markup
 * Called immediately after order is created (after payment verification)
 */
export const sendOrderConfirmationWithMarkup = async (order: OrderData) => {
  if (!order.shippingAddress || !order.orderDate) {
    console.warn(
      "Missing shippingAddress or orderDate for order confirmation with markup",
    );
    // Fall back to simple confirmation
    return sendOrderConfirmation(order);
  }

  return sendEmail({
    to: order.email,
    from: ORDER_FROM_EMAIL,
    replyTo: ORDER_REPLY_TO,
    subject: `Order Confirmation #${order.orderNumber} - D'FOOTPRINT`,
    html: orderConfirmationWithMarkupTemplate({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      totalAmount: order.totalAmount,
      subtotalAmount: order.subtotalAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      couponCode: order.couponCode,
      items: order.items,
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate,
    }),
  });
};

/**
 * Send order confirmation email (simple version without markup)
 * Called immediately after order is created
 */
export const sendOrderConfirmation = async (order: OrderData) => {
  return sendEmail({
    to: order.email,
    from: ORDER_FROM_EMAIL,
    replyTo: ORDER_REPLY_TO,
    subject: `Order Confirmation #${order.orderNumber} - D'FOOTPRINT`,
    html: orderConfirmationTemplate(order),
  });
};

/**
 * Send shipping notification email
 * Called when order status changes to dispatch
 */
export const sendShippingNotification = async (order: OrderData) => {
  return sendEmail({
    to: order.email,
    from: ORDER_FROM_EMAIL,
    replyTo: ORDER_REPLY_TO,
    subject: `Your Order Has Shipped! #${order.orderNumber} - D'FOOTPRINT`,
    html: shippingNotificationTemplate(order),
  });
};

/**
 * Send order status update email
 * Called when order status or delivery status changes
 */
export const sendOrderStatusUpdate = async (data: {
  orderNumber: string;
  customerName: string;
  email: string;
  oldStatus: string;
  newStatus: string;
  deliveryStatus?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
}) => {
  return sendEmail({
    to: data.email,
    from: ORDER_FROM_EMAIL,
    replyTo: ORDER_REPLY_TO,
    subject: `Order Update: ${data.orderNumber} - D'FOOTPRINT`,
    html: orderStatusUpdateTemplate(data),
  });
};

/**
 * Send abandoned cart email
 * Called for logged-in users who abandoned their cart
 */
export const sendAbandonedCartEmail = async (data: {
  customerName: string;
  email: string;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
}) => {
  return sendEmail({
    to: data.email,
    subject: `You Left Something Behind - D'FOOTPRINT`,
    html: abandonedCartTemplate(data),
  });
};

/**
 * Send review approved email
 * Called when admin approves a customer review
 */
export const sendReviewApprovedEmail = async (data: {
  to: string;
  customerName: string;
  productTitle: string;
  productHandle: string;
  reviewTitle: string;
  reviewComment: string;
  rating: number;
}) => {
  return sendEmail({
    to: data.to,
    subject: `Your Review is Live! - D'FOOTPRINT`,
    html: getReviewApprovedEmailTemplate(data),
  });
};

/**
 * Send new order notification email to admins
 * Called immediately after order is created
 */
export const sendAdminNewOrderNotification = async (data: {
  to: string | string[];
  orderNumber: string;
  orderId: string;
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
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  return sendEmail({
    to: data.to,
    from: data.email,
    replyTo: ORDER_REPLY_TO,
    subject: `New Order: ${data.orderNumber} - D'FOOTPRINT`,
    html: adminNewOrderTemplate({
      orderNumber: data.orderNumber,
      orderUrl: `${siteUrl}/admin/orders/${data.orderId}`,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      totalAmount: data.totalAmount,
      subtotalAmount: data.subtotalAmount,
      shippingAmount: data.shippingAmount,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount,
      couponCode: data.couponCode,
      currencyCode: data.currencyCode,
      orderDate: data.orderDate,
      items: data.items,
    }),
  });
};
