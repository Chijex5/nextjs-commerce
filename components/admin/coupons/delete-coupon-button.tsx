"use client";

import { buttonClass } from "components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteCouponButton({
  id,
  code,
  used,
}: {
  id: string;
  code: string;
  used: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        const msg = used
          ? `Delete ${code}? It's been used ${used} times. Past orders keep their discount, but the code stops working. Turning it off keeps the history.`
          : `Delete ${code}? This can't be undone.`;
        if (!window.confirm(msg)) return;
        setBusy(true);
        const res = await fetch(`/api/admin/coupons/${id}`, {
          method: "DELETE",
        });
        setBusy(false);
        if (!res.ok) return toast.error("Couldn't delete the coupon.");
        toast.success(`Deleted ${code}`);
        router.push("/admin/coupons");
        router.refresh();
      }}
      className={buttonClass(
        "outline",
        "md",
        "hover:!border-red-600 hover:!bg-red-600 hover:!text-white",
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}{" "}
      Delete
    </button>
  );
}
