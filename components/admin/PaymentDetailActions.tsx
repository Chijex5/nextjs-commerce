"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PaymentDetailActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"verify" | "reconcile" | null>(null);

  const runAction = async (action: "verify" | "reconcile") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${action} payment`);
        return;
      }
      toast.success(
        action === "verify"
          ? "Payment refreshed from Paystack"
          : data.success
            ? "Payment reconciled"
            : "Reconcile attempted",
      );
      router.refresh();
    } catch {
      toast.error(`Failed to ${action} payment`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => runAction("verify")}
        disabled={Boolean(loading)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {loading === "verify" ? "Refreshing..." : "Refresh from Paystack"}
      </button>
      <button
        onClick={() => runAction("reconcile")}
        disabled={Boolean(loading)}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading === "reconcile" ? "Reconciling..." : "Retry Reconcile"}
      </button>
    </div>
  );
}
