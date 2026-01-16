"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import Price from "components/price";
import LoadingDots from "components/loading-dots";
import {
  getDeliveryStatusDescription,
  getDeliveryStatusColor,
  formatEstimatedArrival,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";

interface OrderItem {
  id: string;
  productId: string;
  productVariantId: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: any;
  totalAmount: any;
  currencyCode: string;
  productImage: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  status: string;
  deliveryStatus: string;
  estimatedArrival: Date | null;
  shippingAddress: any;
  billingAddress: any;
  subtotalAmount: any;
  taxAmount: any;
  shippingAmount: any;
  totalAmount: any;
  currencyCode: string;
  notes: string | null;
  trackingNumber: string | null;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  items: OrderItem[];
}

export default function OrderDetailView({ order }: { order: Order }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(order.deliveryStatus);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber || "",
  );
  const [notes, setNotes] = useState(order.notes || "");
  const [acknowledgedAt, setAcknowledgedAt] = useState<Date | null>(
    order.acknowledgedAt ? new Date(order.acknowledgedAt) : null,
  );
  const [acknowledgedBy, setAcknowledgedBy] = useState<string | null>(
    order.acknowledgedBy || null,
  );
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: orderStatus,
          deliveryStatus,
          trackingNumber: trackingNumber.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success("Order updated successfully");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update order");
      }
    } catch (error) {
      toast.error("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcknowledge = async () => {
    if (acknowledgedAt) return;
    setIsAcknowledging(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acknowledge: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const acknowledgedAtValue = data?.order?.acknowledgedAt
          ? new Date(data.order.acknowledgedAt)
          : new Date();
        setAcknowledgedAt(acknowledgedAtValue);
        setAcknowledgedBy(data?.order?.acknowledgedBy || null);
        toast.success("Order acknowledged");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to acknowledge order");
      }
    } catch (error) {
      toast.error("Failed to acknowledge order");
    } finally {
      setIsAcknowledging(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400";
    }
  };

  const shippingAddr = order.shippingAddress as any;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.productImage && (
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                      {item.productTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {item.variantTitle}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <Price
                      amount={item.totalAmount.toString()}
                      currencyCode={item.currencyCode}
                      className="font-medium"
                    />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      <Price
                        amount={item.price.toString()}
                        currencyCode={item.currencyCode}
                      />{" "}
                      each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Subtotal
                </span>
                <Price
                  amount={order.subtotalAmount.toString()}
                  currencyCode={order.currencyCode}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Shipping
                </span>
                <Price
                  amount={order.shippingAmount.toString()}
                  currencyCode={order.currencyCode}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Tax
                </span>
                <Price
                  amount={order.taxAmount.toString()}
                  currencyCode={order.currencyCode}
                />
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-700">
                <span>Total</span>
                <Price
                  amount={order.totalAmount.toString()}
                  currencyCode={order.currencyCode}
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Name
                </p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Email
                </p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {order.email}
                </p>
              </div>
              {order.phone && (
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Phone
                  </p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {order.phone}
                  </p>
                </div>
              )}
              {order.user && (
                <div className="mt-4 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Registered User
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    This order is linked to a user account
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Shipping Address
            </h2>
            <div className="text-sm">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {shippingAddr.firstName} {shippingAddr.lastName}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {shippingAddr.streetAddress}
              </p>
              {shippingAddr.nearestBusStop && (
                <p className="text-neutral-600 dark:text-neutral-400">
                  Nearest Bus Stop: {shippingAddr.nearestBusStop}
                </p>
              )}
              {shippingAddr.landmark && (
                <p className="text-neutral-600 dark:text-neutral-400">
                  Landmark: {shippingAddr.landmark}
                </p>
              )}
              <p className="text-neutral-600 dark:text-neutral-400">
                {shippingAddr.lga}, {shippingAddr.state}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {shippingAddr.country}
              </p>
              {shippingAddr.phone1 && (
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  Phone 1: +234 {shippingAddr.phone1}
                </p>
              )}
              {shippingAddr.phone2 && (
                <p className="text-neutral-600 dark:text-neutral-400">
                  Phone 2: +234 {shippingAddr.phone2}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Acknowledgement */}
          <div
            className={`rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 ${
              acknowledgedAt
                ? ""
                : "bg-amber-50/60 dark:bg-amber-950/20"
            }`}
          >
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Acknowledgement
            </h2>
            {acknowledgedAt ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Acknowledged
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {acknowledgedBy
                    ? `Acknowledged by ${acknowledgedBy}`
                    : "Acknowledged by admin"}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {acknowledgedAt.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  This order has not been acknowledged yet.
                </p>
                <button
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging}
                  className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {isAcknowledging ? (
                    <LoadingDots className="bg-white" />
                  ) : (
                    "Acknowledge Order"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Status Management */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Order Status
            </h2>

            <div className="mb-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Order Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(orderStatus)}`}
                >
                  {orderStatus}
                </span>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Delivery Status
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="production">Production</option>
                  <option value="sorting">Sorting & Packaging</option>
                  <option value="dispatch">Out for Delivery</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getDeliveryStatusColor(deliveryStatus as DeliveryStatus)}`}
                >
                  {deliveryStatus}
                </span>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {getDeliveryStatusDescription(
                    deliveryStatus as DeliveryStatus,
                  )}
                </p>
              </div>
            </div>

            {order.estimatedArrival && (
              <div className="mb-4 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Estimated Arrival
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatEstimatedArrival(new Date(order.estimatedArrival))}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                  Updates automatically when delivery status changes
                </p>
              </div>
            )}

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {isUpdating ? <LoadingDots className="bg-white" /> : "Update Order"}
            </button>
          </div>

          {/* Tracking & Notes */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Additional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Order Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Customer note or internal notes..."
                  rows={4}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* Order Metadata */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Order Details
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Order ID:
                </span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100">
                  {order.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Created:
                </span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Last Updated:
                </span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {new Date(order.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
