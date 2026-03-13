"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import PageLoader from "components/page-loader";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import {
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

type CustomRequest = {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  status: string;
  customerName: string;
  email: string;
  quotedAmount?: string | null;
  currencyCode?: string;
  quoteExpiresAt?: string | null;
  createdAt: string;
  latestQuote?: {
    id: string;
    version: number;
    amount: string;
    currencyCode?: string;
    status: string;
    expiresAt?: string | null;
  } | null;
};

export default function OrdersPageClient() {
  const { data: session, status } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [trackingInput, setTrackingInput] = useState("");
  const [customTrackRequestNumber, setCustomTrackRequestNumber] = useState("");
  const [customTrackEmail, setCustomTrackEmail] = useState("");
  const [trackedCustomRequest, setTrackedCustomRequest] =
    useState<CustomRequest | null>(null);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [isCustomRequestsLoading, setIsCustomRequestsLoading] = useState(false);
  const [isCustomTrackingLoading, setIsCustomTrackingLoading] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"order" | "custom">("order");

  const autoTrackedOrderRef = useRef<string | null>(null);
  const autoTrackedCustomRef = useRef<string | null>(null);
  const orderNumberParam = searchParams.get("orderNumber")?.trim() || "";
  const customRequestParam = searchParams.get("customRequest")?.trim() || "";
  const emailParam = searchParams.get("email")?.trim() || "";

  useEffect(() => {
    if (session) {
      void fetchOrders();
      void fetchCustomRequests();
    }
  }, [session]);

  useEffect(() => {
    if (emailParam) {
      setCustomTrackEmail(emailParam);
    } else if (session?.email) {
      setCustomTrackEmail(session.email);
    }
  }, [emailParam, session?.email]);

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

  const fetchCustomRequests = async () => {
    setIsCustomRequestsLoading(true);
    try {
      const response = await fetch("/api/custom-order-requests");
      if (response.ok) {
        const data = await response.json();
        setCustomRequests(data.requests || []);
      } else if (response.status !== 404) {
        toast.error("Failed to load custom requests");
      }
    } catch {
      toast.error("Failed to load custom requests");
    } finally {
      setIsCustomRequestsLoading(false);
    }
  };

  const trackOrderByNumber = useCallback(
    async (orderNumber: string) => {
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
          toast.error("Order not found");
          return;
        }

        const data = await response.json();
        const order = data.order as Order;
        router.push(
          `/order/${order.id}?orderNumber=${encodeURIComponent(order.orderNumber)}`,
        );
        setIsTrackingModalOpen(false);
      } catch {
        toast.error("Failed to track order");
      } finally {
        setIsTrackingLoading(false);
      }
    },
    [router],
  );

  const trackCustomRequest = useCallback(
    async (requestNumber: string, email: string) => {
      const trimmedRequestNumber = requestNumber.trim();
      const trimmedEmail = email.trim();

      if (!trimmedRequestNumber || !trimmedEmail) {
        toast.error("Request number and email are required");
        return;
      }

      setIsCustomTrackingLoading(true);
      try {
        const response = await fetch(
          `/api/custom-order-requests/track?requestNumber=${encodeURIComponent(
            trimmedRequestNumber,
          )}&email=${encodeURIComponent(trimmedEmail)}`,
        );

        if (!response.ok) {
          setTrackedCustomRequest(null);
          toast.error("Custom request not found");
          return;
        }

        const data = await response.json();
        setTrackedCustomRequest(data.request || null);
      } catch {
        setTrackedCustomRequest(null);
        toast.error("Failed to track custom request");
      } finally {
        setIsCustomTrackingLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!orderNumberParam) return;
    if (autoTrackedOrderRef.current === orderNumberParam) return;

    autoTrackedOrderRef.current = orderNumberParam;
    setTrackingInput(orderNumberParam);
    setTrackingMode("order");
    setIsTrackingModalOpen(true);
    void trackOrderByNumber(orderNumberParam);
  }, [orderNumberParam, trackOrderByNumber]);

  useEffect(() => {
    if (!customRequestParam) return;
    if (autoTrackedCustomRef.current === customRequestParam) return;
    if (!customTrackEmail && !emailParam) return;

    autoTrackedCustomRef.current = customRequestParam;
    setCustomTrackRequestNumber(customRequestParam);
    setTrackingMode("custom");
    setIsTrackingModalOpen(true);
    void trackCustomRequest(
      customRequestParam,
      customTrackEmail || emailParam || "",
    );
  }, [customRequestParam, customTrackEmail, emailParam, trackCustomRequest]);

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading orders..." />;
  }

  const hasTrackingResults = Boolean(
    trackedCustomRequest ||
      (customRequestParam && (customTrackEmail || emailParam)),
  );

  const openTrackingModal = (mode: "order" | "custom") => {
    setTrackingMode(mode);
    setIsTrackingModalOpen(true);
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
          Account
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
              Orders
            </h1>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              Keep your catalog purchases and custom request history organized
              in dedicated sections. Open tracking only when you need it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openTrackingModal("order")}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Track order
            </button>
            <button
              type="button"
              onClick={() => openTrackingModal("custom")}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-200"
            >
              Track custom request
            </button>
          </div>
        </div>
      </header>

      {hasTrackingResults ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Tracking result
            </h2>
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(true)}
              className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline dark:text-neutral-400"
            >
              Track another
            </button>
          </div>

          {trackedCustomRequest ? (
            <CustomRequestCard request={trackedCustomRequest} />
          ) : null}
          {customRequestParam &&
          !trackedCustomRequest &&
          !isCustomTrackingLoading ? (
            <section className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
              We couldn&apos;t find a custom request with those details.
            </section>
          ) : null}
        </section>
      ) : null}

      {session ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Catalog orders
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {session ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Custom requests
            </h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {customRequests.length} total
            </span>
          </div>

          {isCustomRequestsLoading ? (
            <div className="space-y-3">
              <div className="h-32 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-32 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ) : customRequests.length > 0 ? (
            <div className="space-y-4">
              {customRequests.map((request) => (
                <CustomRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-neutral-600 dark:text-neutral-400">
                No custom requests yet.
              </p>
              <Link
                href="/custom-orders"
                className="mt-4 inline-block rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-900 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
              >
                Start a custom order
              </Link>
            </section>
          )}
        </section>
      ) : null}

      {!session ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Login to see all your past orders and linked custom requests.
          </p>
          <Link
            href="/auth/login?callbackUrl=/orders"
            className="mt-3 inline-block rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-900 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Login to account
          </Link>
        </section>
      ) : null}

      {isTrackingModalOpen ? (
        <TrackingModal
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          trackingInput={trackingInput}
          setTrackingInput={setTrackingInput}
          isTrackingLoading={isTrackingLoading}
          onTrackOrder={trackOrderByNumber}
          customTrackRequestNumber={customTrackRequestNumber}
          setCustomTrackRequestNumber={setCustomTrackRequestNumber}
          customTrackEmail={customTrackEmail}
          setCustomTrackEmail={setCustomTrackEmail}
          isCustomTrackingLoading={isCustomTrackingLoading}
          onTrackCustomRequest={trackCustomRequest}
          onClose={() => setIsTrackingModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

type TrackingModalProps = {
  trackingMode: "order" | "custom";
  setTrackingMode: (mode: "order" | "custom") => void;
  trackingInput: string;
  setTrackingInput: (value: string) => void;
  isTrackingLoading: boolean;
  onTrackOrder: (orderNumber: string) => Promise<void>;
  customTrackRequestNumber: string;
  setCustomTrackRequestNumber: (value: string) => void;
  customTrackEmail: string;
  setCustomTrackEmail: (value: string) => void;
  isCustomTrackingLoading: boolean;
  onTrackCustomRequest: (requestNumber: string, email: string) => Promise<void>;
  onClose: () => void;
};

function TrackingModal({
  trackingMode,
  setTrackingMode,
  trackingInput,
  setTrackingInput,
  isTrackingLoading,
  onTrackOrder,
  customTrackRequestNumber,
  setCustomTrackRequestNumber,
  customTrackEmail,
  setCustomTrackEmail,
  isCustomTrackingLoading,
  onTrackCustomRequest,
  onClose,
}: TrackingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 md:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Track shipment
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Choose what you want to track and submit your details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
          >
            Close
          </button>
        </div>

        <div className="mb-4 inline-flex rounded-full border border-neutral-300 p-1 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setTrackingMode("order")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              trackingMode === "order"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            Order
          </button>
          <button
            type="button"
            onClick={() => setTrackingMode("custom")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              trackingMode === "custom"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            Custom request
          </button>
        </div>

        {trackingMode === "order" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onTrackOrder(trackingInput);
            }}
            className="space-y-3"
          >
            <input
              value={trackingInput}
              onChange={(event) => setTrackingInput(event.target.value)}
              placeholder="Order number (e.g. ORD-123456)"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isTrackingLoading}
              className="w-full rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {isTrackingLoading ? "Checking..." : "Track order"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onTrackCustomRequest(
                customTrackRequestNumber,
                customTrackEmail,
              );
            }}
            className="space-y-3"
          >
            <input
              value={customTrackRequestNumber}
              onChange={(event) =>
                setCustomTrackRequestNumber(event.target.value)
              }
              placeholder="Request number (e.g. COR-123456)"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <input
              type="email"
              value={customTrackEmail}
              onChange={(event) => setCustomTrackEmail(event.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isCustomTrackingLoading}
              className="w-full rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {isCustomTrackingLoading ? "Checking..." : "Track custom request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const createdDate = new Date(order.createdAt).toLocaleDateString();

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        Order
      </p>
      <h3 className="mt-1 text-lg font-semibold text-neutral-900 [overflow-wrap:anywhere] dark:text-neutral-100">
        {order.orderNumber}
      </h3>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Placed on {createdDate}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
          {order.deliveryStatus
            ? getDeliveryStatusDescription(order.deliveryStatus)
            : order.status}
        </span>
        <Link
          href={`/order/${order.id}`}
          className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline dark:text-neutral-300"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function CustomRequestCard({ request }: { request: CustomRequest }) {
  const createdDate = new Date(request.createdAt).toLocaleDateString();
  const quoteAmount = request.latestQuote?.amount || request.quotedAmount;
  const currencyCode =
    request.latestQuote?.currencyCode || request.currencyCode || "NGN";

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
            Custom request
          </p>
          <h3 className="text-lg font-semibold text-neutral-900 [overflow-wrap:anywhere] dark:text-neutral-100">
            {request.requestNumber}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {request.title} · Submitted on {createdDate}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
            {request.status}
          </span>
          {quoteAmount ? (
            <Price
              amount={quoteAmount}
              currencyCode={currencyCode}
              currencyCodeClassName="hidden"
              className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-100"
            />
          ) : null}
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
        {request.description}
      </p>

      {request.quoteExpiresAt ? (
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Quote expires: {new Date(request.quoteExpiresAt).toLocaleString()}
        </p>
      ) : null}
    </article>
  );
}
