"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Price from "components/price";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  createdAt: string;
  items: {
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: string;
    productImage?: string;
  }[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

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

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setIsTrackingLoading(true);
    try {
      const response = await fetch(`/api/orders/track?orderNumber=${trackingId}`);
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
  };

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

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
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

      <div className="mb-4 space-y-3">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.productImage && (
              <img
                src={item.productImage}
                alt={item.productTitle}
                className="h-16 w-16 rounded-md object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{item.productTitle}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {item.variantTitle} × {item.quantity}
              </p>
            </div>
          </div>
        ))}
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

  if (status === "loading") {
    return (
      <div className="mx-auto mt-20 max-w-4xl px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div className="h-64 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-20 max-w-4xl px-4 pb-20">
      <h1 className="mb-6 text-3xl font-bold">Orders</h1>

      {/* Logged in user - Show their orders */}
      {session && (
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

        {trackedOrder && (
          <div className="mt-4">
            <OrderCard order={trackedOrder} />
          </div>
        )}
      </div>

      {!session && (
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
