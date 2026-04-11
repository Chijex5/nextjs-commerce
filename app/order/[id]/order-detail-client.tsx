"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import PageLoader from "components/page-loader";
import Price from "components/price";
import {
    formatEstimatedArrival,
    type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";
import OrderActions from "./order-actions";
import OrderFinancialSummary from "./order-financial-summary";
import OrderStatusStepper from "./order-status-stepper";

type OrderItem = {
  id?: string;
  productId?: string;
  productVariantId?: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: string;
  totalAmount?: string;
  productImage?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  orderType?: "catalog" | "custom" | string;
  customRequestNumber?: string | null;
  status: string;
  deliveryStatus?: DeliveryStatus;
  estimatedArrival?: string | null;
  subtotalAmount?: string;
  shippingAmount?: string;
  discountAmount?: string;
  couponCode?: string | null;
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
    ward?: string;
    lga?: string;
    state?: string;
    phone1?: string;
    phone2?: string;
  } | null;
  items: OrderItem[];
};

const deliverySteps = [
  { id: "placed", label: "Order placed" },
  { id: "production", label: "In production" },
  { id: "sorting", label: "Packed" },
  { id: "dispatch", label: "Dispatched" },
  { id: "completed", label: "Delivered" },
];

const stepByDeliveryStatus: Record<DeliveryStatus, number> = {
  production: 1,
  sorting: 2,
  dispatch: 3,
  completed: 4,
  paused: 1,
  cancelled: 1,
};

function parseMoney(value?: string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDeliveryWindow(estimatedArrival?: string | null) {
  if (!estimatedArrival) {
    return "Delivery in 3–5 days";
  }

  return `Expected by ${formatEstimatedArrival(new Date(estimatedArrival))}`;
}

function getCurrentStatusLine(status?: DeliveryStatus) {
  const statusLine: Record<DeliveryStatus, string> = {
    production: "We’re currently crafting your pair by hand.",
    sorting: "Your order has been finished and is now packed with care.",
    dispatch: "Your order is on the way to you.",
    completed: "Delivered. We hope you love your pair.",
    paused: "Your order is on hold while we resolve a delivery issue.",
    cancelled: "This order was cancelled.",
  };

  return status
    ? statusLine[status]
    : "We’re currently crafting your pair by hand.";
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber")?.trim() || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      const query = orderNumber
        ? `?orderNumber=${encodeURIComponent(orderNumber)}`
        : "";
      const response = await fetch(`/api/orders/${orderId}${query}`);

      if (!response.ok) {
        setOrder(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setOrder(data.order || null);
      setIsLoading(false);
    };

    void fetchOrder();
  }, [orderId, orderNumber]);

  if (isLoading) {
    return <PageLoader size="lg" message="Loading order..." />;
  }

  if (!order) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-neutral-600 dark:text-neutral-400">
          Order not found.
        </p>
        <Link
          href="/orders"
          className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Back to orders
        </Link>
      </section>
    );
  }

  const parsedSubtotal = parseMoney(order.subtotalAmount);
  const parsedShipping = parseMoney(order.shippingAmount);
  const parsedDiscount = parseMoney(order.discountAmount);
  const parsedTotal = parseMoney(order.totalAmount);
  const itemBasedSubtotal = order.items.reduce((sum, item) => {
    const lineTotal = item.totalAmount
      ? parseMoney(item.totalAmount)
      : parseMoney(item.price) * item.quantity;
    return sum + lineTotal;
  }, 0);
  const summarySubtotal =
    parsedSubtotal > 0 ? parsedSubtotal : itemBasedSubtotal;
  const computedTotal = Math.max(
    summarySubtotal + parsedShipping - parsedDiscount,
    0,
  );
  const finalTotal = parsedTotal > 0 ? parsedTotal : computedTotal;
  const currentStep = order.deliveryStatus
    ? stepByDeliveryStatus[order.deliveryStatus]
    : 1;
  const deliveryState =
    order.shippingAddress?.state || order.shippingAddress?.lga || "Nigeria";

  return (
    <div className="space-y-5 pb-10">
      <header className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
          Order confirmed
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Thank you — your payment was successful
        </h1>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          {getCurrentStatusLine(order.deliveryStatus)}
        </p>

        <div className="mt-4 inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
          {formatDeliveryWindow(order.estimatedArrival)}
        </div>

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">Order ID</p>
            <p className="mt-1 font-medium text-neutral-900 [overflow-wrap:anywhere] dark:text-neutral-100">
              {order.orderNumber}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">Placed</p>
            <p className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">Total paid</p>
            <Price
              amount={finalTotal.toFixed(2)}
              currencyCode={order.currencyCode}
              currencyCodeClassName="hidden"
              className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </header>

      <section
        id="status"
        className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6"
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Order status
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {getCurrentStatusLine(order.deliveryStatus)}
        </p>
        <div className="mt-4">
          <OrderStatusStepper steps={deliverySteps} currentStep={currentStep} />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Delivery information
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Estimated delivery
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatDeliveryWindow(order.estimatedArrival)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Delivery location
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {deliveryState}
            </p>
          </div>
        </div>
      </section>

      <OrderFinancialSummary
        items={order.items.map((item) => ({
          id:
            item.id ||
            `${item.productId || order.id}-${item.productVariantId || item.productTitle}`,
          name: `${item.productTitle} × ${item.quantity}`,
          amount:
            item.totalAmount ||
            (parseMoney(item.price) * item.quantity).toFixed(2),
        }))}
        currencyCode={order.currencyCode}
        shippingAmount={parsedShipping.toFixed(2)}
        discountAmount={parsedDiscount.toFixed(2)}
        couponCode={order.couponCode}
        totalPaid={finalTotal.toFixed(2)}
      />

      <OrderActions orderNumber={order.orderNumber} />

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Purchased items
        </h2>

        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <article
              key={
                item.id ||
                `${order.id}-${item.productVariantId || item.productTitle}`
              }
              className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
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
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {item.productTitle}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.variantTitle} · Quantity {item.quantity}
                </p>
              </div>
              <Price
                amount={
                  item.totalAmount ||
                  (parseMoney(item.price) * item.quantity).toFixed(2)
                }
                currencyCode={order.currencyCode}
                currencyCodeClassName="hidden"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              />
            </article>
          ))}
        </div>

        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          Need to make a change? Contact support with your order ID above.
        </p>
      </section>

      <div className="px-1">
        <Link
          href="/orders"
          className="text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Back to all orders
        </Link>
      </div>
    </div>
  );
}
