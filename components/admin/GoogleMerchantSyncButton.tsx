"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type SyncResponse = {
  success: boolean;
  totalProducts: number;
  attempted: number;
  synced: number;
  skipped: number;
  failed: number;
  failures?: Array<{ productId: string; handle: string; reason: string }>;
  carousel?: {
    enabled: boolean;
    collectionHandle: string;
    insertedCount: number;
    createdCollection: boolean;
  };
  error?: string;
};

export default function GoogleMerchantSyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);

    try {
      const response = await fetch("/api/admin/products/sync-google-merchant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          includeAlreadySynced: false,
          syncCarousel: true,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | SyncResponse
        | null;

      if (!response.ok || !data) {
        throw new Error(data?.error || "Failed to sync products");
      }

      const carouselInfo = data.carousel?.enabled
        ? `, carousel +${data.carousel.insertedCount}`
        : "";

      toast.success(
        `Google Merchant sync complete: ${data.synced} synced, ${data.skipped} skipped, ${data.failed} failed${carouselInfo}`,
      );

      if (data.failed > 0 && data.failures && data.failures.length > 0) {
        const firstFailure = data.failures[0];
        if (firstFailure) {
          toast.error(
            `${data.failed} product(s) failed. Example: ${firstFailure.handle} - ${firstFailure.reason}`,
          );
        }
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
    >
      {syncing ? "Syncing..." : "Sync Google Merchant"}
    </button>
  );
}
