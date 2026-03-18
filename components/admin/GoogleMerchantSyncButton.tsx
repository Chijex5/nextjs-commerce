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

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function GoogleMerchantSyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);

    try {
      const response = await fetch("/api/admin/products/sync-google-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeAlreadySynced: false, syncCarousel: true }),
      });

      const data = (await response.json().catch(() => null)) as SyncResponse | null;

      if (!response.ok || !data) {
        throw new Error(data?.error || "Failed to sync products");
      }

      const carouselInfo = data.carousel?.enabled
        ? `, carousel +${data.carousel.insertedCount}`
        : "";

      toast.success(
        `Google Merchant sync complete: ${data.synced} synced, ${data.skipped} skipped, ${data.failed} failed${carouselInfo}`,
      );

      if (data.failed > 0 && data.failures?.length) {
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
      className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 sm:px-4"
    >
      {syncing ? (
        <svg
          className="h-4 w-4 shrink-0 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <GoogleIcon />
      )}

      {/* Short label on mobile, full label on sm+ */}
      <span className="sm:hidden">{syncing ? "Syncing…" : "Sync"}</span>
      <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync Google Merchant"}</span>
    </button>
  );
}