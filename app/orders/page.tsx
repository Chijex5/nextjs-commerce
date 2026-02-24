"use client";

import { Suspense } from "react";
import OrdersPageClient from "./order-page-client";

function OrdersPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-56 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPageClient />
    </Suspense>
  );
}
