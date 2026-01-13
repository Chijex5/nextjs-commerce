import { sendEmail } from './resend';
import { orderConfirmationTemplate } from './templates/order-confirmation';
import { shippingNotificationTemplate } from './templates/shipping-notification';

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
  }>;
  trackingNumber?: string;
  estimatedArrival?: string;
}

/**
 * Send order confirmation email
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
