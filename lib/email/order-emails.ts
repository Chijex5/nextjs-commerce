import { sendEmail } from './resend';
import { orderConfirmationTemplate } from './templates/order-confirmation';
import { orderConfirmationWithMarkupTemplate } from './templates/order-confirmation-with-markup';
import { shippingNotificationTemplate } from './templates/shipping-notification';
import { orderStatusUpdateTemplate } from './templates/order-status-update';
import { abandonedCartTemplate } from './templates/abandoned-cart';

interface OrderData {
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
    productImage?: string | null;
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
    console.warn('Missing shippingAddress or orderDate for order confirmation with markup');
    // Fall back to simple confirmation
    return sendOrderConfirmation(order);
  }

  return sendEmail({
    to: order.email,
    subject: `Order Confirmation #${order.orderNumber} - D'FOOTPRINT`,
    html: orderConfirmationWithMarkupTemplate({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      totalAmount: order.totalAmount,
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
