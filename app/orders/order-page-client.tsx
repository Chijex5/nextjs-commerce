"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import PageLoader from "components/page-loader";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import {
  formatEstimatedArrival,
  getDeliveryStatusColor,
  getDeliveryStatusDescription,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";

type OrderItem = {
  id?: string;
  productId?: string;
  productVariantId?: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: string;
  productImage?: string;
};

type Order = {
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
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    streetAddress?: string;
    nearestBusStop?: string;
    landmark?: string;
    lga?: string;
    state?: string;
    phone1?: string;
    phone2?: string;
  } | null;
  items: OrderItem[];
};

const deliveryStages: { status: DeliveryStatus; label: string }[] = [
  { status: "production", label: "Production" },
  { status: "sorting", label: "Packed" },
  { status: "dispatch", label: "Dispatched" },
  { status: "completed", label: "Delivered" },
];

export default function OrdersPageClient() {
  const { data: session, status } = useUserSession();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const autoTrackedRef = useRef<string | null>(null);
  const orderNumberParam = searchParams.get("orderNumber")?.trim() || "";

  useEffect(() => {
    if (session) {
      void fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsOrdersLoading(false);
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

      if (!response.ok) {
        setTrackedOrder(null);
        toast.error("Order not found");
        return;
      }

      const data = await response.json();
      setTrackedOrder(data.order);
    } catch {
      setTrackedOrder(null);
      toast.error("Failed to track order");
    } finally {
      setIsTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderNumberParam) return;
    if (autoTrackedRef.current === orderNumberParam) return;

    autoTrackedRef.current = orderNumberParam;
    setTrackingInput(orderNumberParam);
    void trackOrderByNumber(orderNumberParam);
  }, [orderNumberParam, trackOrderByNumber]);

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading orders..." />;
  }

  return (
    <div className="space-y-8 pb-10 md:space-y-10">
      <header className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 md:pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          {orderNumberParam ? "Track order" : "Orders"}
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          {orderNumberParam
            ? "Review delivery progress and order details for your order number."
            : "View all your orders and track any order with a valid order number."}
        </p>
      </header>

      {!orderNumberParam ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Track an order
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Enter your order number (e.g. ORD-123456).
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void trackOrderByNumber(trackingInput);
            }}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Order number"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isTrackingLoading}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {isTrackingLoading ? "Checking..." : "Track"}
            </button>
          </form>
        </section>
      ) : null}

      {trackedOrder ? (
        <OrderCard order={trackedOrder} />
      ) : orderNumberParam && !isTrackingLoading ? (
        <section className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          We couldn&apos;t find an order with that number.
        </section>
      ) : null}

      {session && !orderNumberParam ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              My orders
            </h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {orders.length} total
            </span>
          </div>

          {isOrdersLoading ? (
            <div className="space-y-3">
              <div className="h-40 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-40 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-neutral-600 dark:text-neutral-400">
                You haven&apos;t placed any orders yet.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Start shopping
              </Link>
            </section>
          )}
        </section>
      ) : null}

      {!session && !orderNumberParam ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Want to view all your past orders?
          </p>
          <Link
            href="/auth/login?callbackUrl=/orders"
            className="mt-3 inline-block rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-900 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Login to account
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const createdDate = new Date(order.createdAt).toLocaleDateString();
  const stageIndex = deliveryStages.findIndex(
    (item) => item.status === order.deliveryStatus,
  );

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
            Order number
          </p>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {order.orderNumber}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Placed on {createdDate}
          </p>
        </div>

        <div className="text-right">
          <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
            {order.status}
          </span>
          <Price
            amount={order.totalAmount}
            currencyCode={order.currencyCode}
            currencyCodeClassName="hidden"
            className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {order.deliveryStatus ? (
        <div className="mt-5 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getDeliveryStatusColor(order.deliveryStatus)}`}
            >
              {getDeliveryStatusDescription(order.deliveryStatus)}
            </span>
            {order.estimatedArrival ? (
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                ETA:{" "}
                {formatEstimatedArrival(
                  order.estimatedArrival
                    ? new Date(order.estimatedArrival)
                    : null,
                )}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {deliveryStages.map((stage, index) => {
              const isDone = stageIndex >= 0 && index <= stageIndex;
              return (
                <div key={stage.status} className="space-y-2 text-center">
                  <div
                    className={`mx-auto h-2.5 w-full rounded-full ${
                      isDone
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {order.items.map((item) => {
          const key =
            item.id ||
            `${order.id}-${item.productVariantId || item.productTitle}`;

          return (
            <div key={key} className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productTitle}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {item.productTitle}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.variantTitle} · Qty {item.quantity}
                </p>
              </div>
              <Price
                amount={item.price}
                currencyCode={order.currencyCode}
                currencyCodeClassName="hidden"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              />
            </div>
          );
        })}
      </div>

      {order.shippingAddress ? (
        <div className="mt-5 rounded-xl border border-dashed border-neutral-300 p-4 text-sm dark:border-neutral-700">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            Delivery address
          </p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            {order.shippingAddress.streetAddress}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            {order.shippingAddress.lga}, {order.shippingAddress.state}
          </p>
        </div>
      ) : null}

      {order.notes ? (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Note: {order.notes}
        </p>
      ) : null}
    </article>
  );
}
