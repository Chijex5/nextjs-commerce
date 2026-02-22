"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import Price from "components/price";
import PageLoader from "components/page-loader";
import { useUserSession } from "hooks/useUserSession";
import {
  getDeliveryStatusDescription,
  getDeliveryStatusColor,
  formatEstimatedArrival,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";

interface OrderItem {
  id?: string;
  productId?: string;
  productVariantId?: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: string;
  productImage?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  deliveryStatus?: DeliveryStatus;
  estimatedArrival?: string | null;
  totalAmount: string;
  currencyCode: string;
  createdAt: string;
  trackingNumber?: string | null;
  notes?: string | null;
  shippingAddress?: any;
  items: OrderItem[];
}

export default function OrdersPageClient() {
  const { data: session, status } = useUserSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const searchParams = useSearchParams();
  const autoTrackedRef = useRef<string | null>(null);
  const orderNumberParam = searchParams.get("orderNumber")?.trim() || "";

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackOrderByNumber = useCallback(async (orderNumber: string) => {
    const trimmed = orderNumber.trim();
    if (!trimmed) {
      toast.error("Please enter an order number");
      return;
    }

    setIsTrackingLoading(true);
    try {
      const response = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(trimmed)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTrackedOrder(data.order);
        toast.success("Order found!");
      } else {
        toast.error("Order not found");
        setTrackedOrder(null);
      }
    } catch (error) {
      toast.error("Failed to track order");
      setTrackedOrder(null);
    } finally {
      setIsTrackingLoading(false);
    }
  }, []);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await trackOrderByNumber(trackingId);
  };

  useEffect(() => {
    if (!orderNumberParam) return;
    if (autoTrackedRef.current === orderNumberParam) return;
    autoTrackedRef.current = orderNumberParam;
    setTrackingId(orderNumberParam);
    trackOrderByNumber(orderNumberParam);
  }, [orderNumberParam, trackOrderByNumber]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "processing":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
      case "shipped":
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20";
      case "cancelled":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      default:
        return "text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900/20";
    }
  };

  const DeliveryTimeline = ({
    deliveryStatus,
  }: {
    deliveryStatus: DeliveryStatus;
  }) => {
    const stages: { status: DeliveryStatus; label: string }[] = [
      { status: "production", label: "Production" },
      { status: "sorting", label: "Sorting & Packaging" },
      { status: "dispatch", label: "Out for Delivery" },
      { status: "completed", label: "Delivered" },
    ];

    const currentIndex = stages.findIndex((s) => s.status === deliveryStatus);

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => (
            <div key={stage.status} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    index <= currentIndex
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  {index < currentIndex ? (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <span className="mt-2 text-center text-xs font-medium">
                  {stage.label}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`mx-2 h-1 flex-1 ${
                    index < currentIndex
                      ? "bg-blue-600"
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const deliveryStatus = (order.deliveryStatus ||
      "production") as DeliveryStatus;
    const estimatedArrival = order.estimatedArrival
      ? new Date(order.estimatedArrival)
      : null;

    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Order #{order.orderNumber}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Order Date:{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
          >
            {order.status}
          </span>
        </div>

        {/* Delivery Status Section */}
        <div className="mb-4 rounded-md bg-neutral-50 p-4 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Delivery Status</h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getDeliveryStatusColor(deliveryStatus)}`}
            >
              {deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
            </span>
          </div>

          <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
            {getDeliveryStatusDescription(deliveryStatus)}
          </p>

          {estimatedArrival && (
            <div className="mb-3 text-sm">
              <span className="font-medium">Estimated Arrival: </span>
              <span className="text-neutral-600 dark:text-neutral-400">
                {formatEstimatedArrival(estimatedArrival)}
              </span>
            </div>
          )}

          {deliveryStatus !== "paused" &&
            deliveryStatus !== "cancelled" &&
            deliveryStatus !== "completed" && (
              <DeliveryTimeline deliveryStatus={deliveryStatus} />
            )}
        </div>

        {(order.trackingNumber || order.notes) && (
          <div className="mb-4 space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
            {order.trackingNumber && (
              <p className="text-sm">
                <span className="font-medium">Tracking Number:</span>{" "}
                <span className="text-neutral-700 dark:text-neutral-300">
                  {order.trackingNumber}
                </span>
              </p>
            )}
            {order.notes && (
              <p className="text-sm">
                <span className="font-medium">Order Note:</span>{" "}
                <span className="text-neutral-700 dark:text-neutral-300">
                  {order.notes}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="mb-4 space-y-3">
          {order.items.map((item) => {
            const itemKey =
              item.id ||
              `${order.id}-${item.productVariantId || item.productTitle}-${item.variantTitle}`;
            return (
              <div key={itemKey} className="flex items-center gap-3">
                {item.productImage && (
                  <Image
                    src={item.productImage}
                    alt={item.productTitle}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.productTitle}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {item.variantTitle} × {item.quantity}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <span className="font-medium">Total</span>
          <Price
            amount={order.totalAmount}
            currencyCode={order.currencyCode}
            className="text-lg font-bold"
          />
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading orders..." />;
  }

  return (
    <div className="mx-auto mt-20 max-w-4xl px-4 pb-20">
      <h1 className="mb-6 text-3xl font-bold">
        {orderNumberParam ? "Order Details" : "Orders"}
      </h1>

      {/* Logged in user - Show their orders */}
      {session && !orderNumberParam && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">My Orders</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"
                ></div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-black">
              <p className="text-neutral-600 dark:text-neutral-400">
                You haven't placed any orders yet.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
              >
                Start shopping
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Track Order by ID - Available to all */}
      <div>
        {!orderNumberParam && (
          <>
            <h2 className="mb-4 text-xl font-semibold">Track an Order</h2>
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                Enter your order number to track your order status
              </p>
              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Order number (e.g., ORD-123456)"
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isTrackingLoading}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTrackingLoading ? "Tracking..." : "Track"}
                </button>
              </form>
            </div>
          </>
        )}

        {isTrackingLoading && orderNumberParam && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-400">
            Loading order details...
          </div>
        )}
        {!isTrackingLoading && orderNumberParam && !trackedOrder && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-400">
            Order not found for that number.
          </div>
        )}
        {trackedOrder && (
          <div className="mt-4">
            <OrderCard order={trackedOrder} />
          </div>
        )}
      </div>

      {!session && !orderNumberParam && (
        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-black">
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            Want to see all your orders?
          </p>
          <Link
            href="/auth/login?callbackUrl=/orders"
            className="inline-block rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Login to Your Account
          </Link>
        </div>
      )}
    </div>
  );
}
