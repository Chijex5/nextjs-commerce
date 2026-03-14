"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import PageLoader from "components/page-loader";
import Price from "components/price";
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
  orderType?: "catalog" | "custom" | string;
  customRequestNumber?: string | null;
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
    ward?: string;
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

  const stageIndex = deliveryStages.findIndex(
    (item) => item.status === order.deliveryStatus,
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
          Order details
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-900 [overflow-wrap:anywhere] dark:text-neutral-100 md:text-4xl">
          {order.orderNumber}
        </h1>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Placed
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Status
            </p>
            <p className="mt-1 text-sm font-medium uppercase text-neutral-900 dark:text-neutral-100">
              {order.status}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Delivery
            </p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                order.deliveryStatus
                  ? getDeliveryStatusColor(order.deliveryStatus)
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {order.deliveryStatus
                ? getDeliveryStatusDescription(order.deliveryStatus)
                : "Pending"}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Total
            </p>
            <Price
              amount={order.totalAmount}
              currencyCode={order.currencyCode}
              currencyCodeClassName="hidden"
              className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </header>

      {order.deliveryStatus ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Shipping progress
          </h2>

          {order.estimatedArrival ? (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Estimated arrival:{" "}
              {formatEstimatedArrival(new Date(order.estimatedArrival))}
            </p>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {deliveryStages.map((stage, index) => {
              const isDone = stageIndex >= 0 && index <= stageIndex;
              return (
                <div
                  key={stage.status}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div
                    className={`h-2 w-full rounded-full ${
                      isDone
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                  />
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Items
        </h2>

        <div className="mt-5 space-y-3">
          {order.items.map((item) => (
            <article
              key={
                item.id ||
                `${order.id}-${item.productVariantId || item.productTitle}`
              }
              className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productTitle}
                    fill
                    sizes="80px"
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
                amount={item.price}
                currencyCode={order.currencyCode}
                currencyCodeClassName="hidden"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
