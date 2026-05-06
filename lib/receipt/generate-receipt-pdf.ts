import React from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";
import { type DeliveryStatus } from "lib/order-utils/delivery-tracking";
import { ReceiptDocument, type ReceiptData, type ReceiptItem } from "./receipt-docuent";

/**
 * Transform order data from the API to ReceiptData format for PDF generation
 */
export function transformOrderToReceiptData(order: any): ReceiptData {
  const items: ReceiptItem[] = (order.items || []).map((item: any) => ({
    title: item.productTitle || "Unknown Product",
    variant: item.variantTitle || "N/A",
    qty: item.quantity || 0,
    price: parseFloat(item.price) || 0,
  }));

  const shippingAddress = order.shippingAddress || {};
  const status: DeliveryStatus = (order.deliveryStatus || "production") as DeliveryStatus;

  return {
    orderNum: order.orderNumber || order.id || "N/A",
    orderDate: order.createdAt || new Date().toISOString(),
    status,
    tracking: order.trackingNumber || null,
    // Customer
    fname: shippingAddress.firstName || "Customer",
    lname: shippingAddress.lastName || "",
    phone1: shippingAddress.phone1 || "Not provided",
    phone2: shippingAddress.phone2 || null,
    // Address
    street: shippingAddress.streetAddress || null,
    busstop: shippingAddress.nearestBusStop || null,
    lga: shippingAddress.lga || null,
    state: shippingAddress.state || null,
    landmark: shippingAddress.landmark || null,
    // Financials
    shipping: parseFloat(order.shippingAmount) || 0,
    discount: parseFloat(order.discountAmount) || 0,
    coupon: order.couponCode || null,
    // Items
    items,
  };
}

/**
 * Generate and download a receipt PDF for an order
 */
export async function downloadReceiptPdf(order: any): Promise<void> {
  try {
    const receiptData = transformOrderToReceiptData(order);
    const doc = ReceiptDocument({ data: receiptData }) as unknown as React.ReactElement<DocumentProps>;

    // Generate PDF blob
    const blob = await pdf(doc).toBlob();

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt-${receiptData.orderNum}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw new Error("Failed to generate receipt PDF");
  }
}
