"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { trackPurchase } from "lib/analytics";
import { useUserSession } from "hooks/useUserSession";

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { status } = useUserSession();
  const [mounted, setMounted] = useState(false);
  const trackedOrderRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!orderNumber || trackedOrderRef.current === orderNumber) return;

    const trackOrder = async () => {
      try {
        const response = await fetch(
          `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}`,
        );

        if (!response.ok) return;

        const data = await response.json();
        const order = data?.order;
        if (!order) return;

        trackedOrderRef.current = orderNumber;
        trackPurchase({
          orderId: order.orderNumber,
          value: parseFloat(order.totalAmount),
          items: order.items.map((item: any) => ({
            id: item.productId,
            name: item.productTitle,
            quantity: item.quantity,
          })),
        });
      } catch (error) {
        console.error("Failed to track purchase:", error);
      }
    };

    trackOrder();
  }, [orderNumber]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-auto mt-20 max-w-2xl px-4 pb-20">
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-black">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="mb-4 text-3xl font-bold">Order Placed Successfully!</h1>

        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          Thank you for your purchase. Your order has been confirmed and is
          being processed.
        </p>

        {orderNumber && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Order Number
            </p>
            <p className="text-xl font-bold">{orderNumber}</p>
          </div>
        )}

        <p className="mb-8 text-sm text-neutral-600 dark:text-neutral-400">
          A confirmation email has been sent to your email address with the
          order details.
        </p>

        {status === "unauthenticated" && (
          <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-4 text-left text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-100">
            <p className="font-medium">Create an account to track this order</p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
              Save your details for faster checkout and see updates in one
              place.
            </p>
            <Link
              href={`/auth/register?callbackUrl=${encodeURIComponent(`/orders?order=${orderNumber || ""}`)}`}
              className="mt-2 inline-flex text-xs font-medium text-blue-700 hover:underline dark:text-blue-200"
            >
              Create account
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/orders"
            className="rounded-md bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700"
          >
            View Order Status
          </Link>
          <Link
            href="/"
            className="rounded-md border border-neutral-300 px-6 py-3 text-center font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
        <h2 className="mb-4 text-lg font-semibold">What's Next?</h2>
        <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              You'll receive an email confirmation with your order details
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>We'll notify you when your order is shipped</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              Track your order anytime from your account or using the order
              number
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
