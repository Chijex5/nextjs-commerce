"use client";

import { buttonClass } from "components/ui/button";
import { Loader2, RefreshCw, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PaymentDetailActions({
  paymentId,
  provider,
}: {
  paymentId: string;
  provider: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"verify" | "reconcile" | null>(null);

  if (provider !== "paystack") {
    return (
      <p className="text-xs text-fg-3">
        Actions are only available for Paystack payments.
      </p>
    );
  }

  const runAction = async (action: "verify" | "reconcile") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "That didn't work. Try again in a moment.");
        return;
      }
      toast.success(
        action === "verify"
          ? "Updated with the latest status from Paystack"
          : data.success
            ? "Matched to an order"
            : "Tried again. Still couldn't match it. See the history below.",
      );
      router.refresh();
    } catch {
      toast.error("That didn't work. Try again in a moment.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => runAction("verify")}
        disabled={Boolean(loading)}
        className={buttonClass("outline", "md")}
      >
        {loading === "verify" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Check with Paystack
      </button>
      <button
        type="button"
        onClick={() => runAction("reconcile")}
        disabled={Boolean(loading)}
        className={buttonClass("solid", "md")}
      >
        {loading === "reconcile" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Link2 className="size-4" />
        )}
        Match to order again
      </button>
    </div>
  );
}
