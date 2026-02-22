"use client";
import { Suspense } from "react";
import OrdersPageClient from "./order-page-client";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersPageClient />
    </Suspense>
  );
}