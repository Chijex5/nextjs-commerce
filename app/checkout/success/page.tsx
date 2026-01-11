"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
