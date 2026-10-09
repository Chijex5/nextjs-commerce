"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteCampaignButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Delete ${name}`}
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Delete “${name}”? This can't be undone.`)) return;
        setBusy(true);
        const res = await fetch(`/api/admin/campaigns/${id}`, {
          method: "DELETE",
        });
        setBusy(false);
        if (!res.ok) return toast.error("Couldn't delete the campaign.");
        toast.success("Campaign deleted");
        router.refresh();
      }}
      className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-red-600"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </button>
  );
}
