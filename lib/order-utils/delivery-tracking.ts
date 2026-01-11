/**
 * Order Delivery Status Management Utilities
 *
 * This module provides utilities for calculating estimated delivery dates
 * based on order status and shipping location.
 *
 * DELIVERY STATUS TYPES:
 * - production: Item is being manufactured/prepared
 * - sorting: Item is being sorted and packaged
 * - dispatch: Item is out for delivery
 * - paused: Order processing is temporarily paused
 * - completed: Order has been delivered
 * - cancelled: Order has been cancelled
 *
 * DELIVERY TIME CALCULATION RULES:
 *
 * For Lagos State:
 * - Production: 7 days from order date
 * - Sorting: 3 days from order date
 * - Dispatch: 1 day (24 hours) from order date
 *
 * For Other States:
 * - Production: 7 days from order date
 * - Sorting: 5 days from order date
 * - Dispatch: 2 days from order date
 *
 * Special Cases:
 * - Paused: No estimated arrival (null)
 * - Completed: Actual delivery date (already passed)
 * - Cancelled: No estimated arrival (null)
 */

export type DeliveryStatus =
  | "production"
  | "sorting"
  | "dispatch"
  | "paused"
  | "completed"
  | "cancelled";

interface ShippingAddress {
  state?: string;
  [key: string]: any;
}

/**
 * Calculate estimated arrival date based on order date, delivery status, and shipping location
 *
 * @param orderDate - The date when the order was placed
 * @param deliveryStatus - Current delivery status of the order
 * @param shippingAddress - Shipping address containing state information
 * @returns Estimated arrival date or null if not applicable
 */
export function calculateEstimatedArrival(
  orderDate: Date,
  deliveryStatus: DeliveryStatus,
  shippingAddress: ShippingAddress,
): Date | null {
  // No estimation for paused, completed, or cancelled orders
  if (["paused", "completed", "cancelled"].includes(deliveryStatus)) {
    return null;
  }

  const state = shippingAddress.state?.toLowerCase() || "";
  const isLagos = state === "lagos";

  // Calculate delivery days based on status and location
  let deliveryDays = 0;

  switch (deliveryStatus) {
    case "production":
      deliveryDays = 7; // Same for all states
      break;
    case "sorting":
      deliveryDays = isLagos ? 3 : 5;
      break;
    case "dispatch":
      deliveryDays = isLagos ? 1 : 2;
      break;
    default:
      deliveryDays = 7; // Default to production timeline
  }

  // Calculate estimated arrival date
  const estimatedDate = new Date(orderDate);
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

  return estimatedDate;
}

/**
 * Get human-readable delivery status description
 */
export function getDeliveryStatusDescription(status: DeliveryStatus): string {
  const descriptions: Record<DeliveryStatus, string> = {
    production: "Your order is being prepared in our production house",
    sorting: "Your order is being sorted and packaged for delivery",
    dispatch: "Your order is out for delivery",
    paused: "Your order processing is temporarily paused",
    completed: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
  };

  return descriptions[status] || "Status unknown";
}

/**
 * Get delivery status color for UI display
 */
export function getDeliveryStatusColor(status: DeliveryStatus): string {
  const colors: Record<DeliveryStatus, string> = {
    production:
      "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20",
    sorting:
      "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20",
    dispatch:
      "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20",
    paused:
      "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20",
    completed:
      "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20",
    cancelled: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20",
  };

  return (
    colors[status] ||
    "text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900/20"
  );
}

/**
 * Format estimated arrival date for display
 */
export function formatEstimatedArrival(date: Date | null): string {
  if (!date) {
    return "Not available";
  }

  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Overdue";
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/**
 * Get delivery progress percentage (0-100)
 */
export function getDeliveryProgress(status: DeliveryStatus): number {
  const progress: Record<DeliveryStatus, number> = {
    production: 25,
    sorting: 50,
    dispatch: 75,
    completed: 100,
    paused: 0,
    cancelled: 0,
  };

  return progress[status] || 0;
}
