"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserSession } from "hooks/useUserSession";
import {
  COUPON_STORAGE_KEY,
  getCouponCustomerKey,
  getStoredCoupon,
} from "lib/coupon-storage";

interface CouponInputProps {
  onApply: (discountAmount: number, couponCode: string) => void;
  cartTotal: number;
  cartId: string;
  variant?: "card" | "compact";
}

export default function CouponInput({
  onApply,
  cartTotal,
  cartId,
  variant = "card",
}: CouponInputProps) {
  const isCompact = variant === "compact";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const { data: session } = useUserSession();

  // Load coupon from localStorage on mount and revalidate
  useEffect(() => {
    const loadStoredCoupon = async () => {
      if (!cartId) {
        setAppliedCoupon(null);
        onApply(0, "");
        return;
      }

      try {
        const customerKey = getCouponCustomerKey(session?.id);
        const couponData = getStoredCoupon(cartId, customerKey);
        if (couponData) {
          // Revalidate the coupon
          const payload: {
            code: string;
            cartTotal: number;
            sessionId?: string;
          } = {
            code: couponData.code,
            cartTotal,
          };

          if (!session?.id) {
            payload.sessionId = customerKey.replace("guest:", "");
          }

          const response = await fetch("/api/coupons/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            setAppliedCoupon(data.coupon);
            onApply(data.coupon.discountAmount, data.coupon.code);
          } else {
            // Coupon no longer valid, remove it
            localStorage.removeItem(COUPON_STORAGE_KEY);
          }
        }
      } catch (err) {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    };

    loadStoredCoupon();
  }, [cartId, cartTotal, onApply, session?.id]);

  const handleApply = async () => {
    const trimmedCode = code.trim().toUpperCase();

    if (!cartId) {
      toast.error(
        "Unable to apply coupon right now. Please refresh and try again.",
      );
      return;
    }

    if (!trimmedCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    setLoading(true);

    try {
      const payload: { code: string; cartTotal: number; sessionId?: string } = {
        code: trimmedCode,
        cartTotal,
      };
      const customerKey = getCouponCustomerKey(session?.id);

      if (!session?.id) {
        payload.sessionId = customerKey.replace("guest:", "");
      }

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Invalid coupon code");
        return;
      }

      setAppliedCoupon(data.coupon);
      setCode("");
      toast.success(
        `Coupon applied! You saved ₦${data.coupon.discountAmount.toFixed(2)}`,
      );
      onApply(data.coupon.discountAmount, data.coupon.code);

      // Store in localStorage for persistence
      try {
        localStorage.setItem(
          COUPON_STORAGE_KEY,
          JSON.stringify({
            code: data.coupon.code,
            discountAmount: data.coupon.discountAmount,
            description: data.coupon.description,
            cartId,
            customerKey,
          }),
        );
      } catch (err) {
        console.error("Failed to save coupon to storage:", err);
      }
    } catch (err) {
      toast.error("Failed to apply coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCode("");
    onApply(0, "");
    toast.success("Coupon removed");

    // Remove from localStorage
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to remove coupon from storage:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  if (appliedCoupon) {
    if (isCompact) {
      return (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Coupon
              </span>
              <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800 dark:bg-green-900/40 dark:text-green-200">
                {appliedCoupon.code}
              </span>
            </div>
            <button
              onClick={handleRemove}
              className="rounded-full border border-green-300 px-2.5 py-1 text-[11px] font-semibold text-green-800 hover:bg-green-100 dark:border-green-700 dark:text-green-200 dark:hover:bg-green-900/30"
              aria-label="Remove coupon"
            >
              Remove
            </button>
          </div>
          <div className="flex items-center justify-between text-[13px] text-green-700 dark:text-green-300">
            <span>Savings</span>
            <span className="font-semibold">
              -₦{appliedCoupon.discountAmount.toFixed(2)}
            </span>
          </div>
          {appliedCoupon.description && (
            <p className="text-[11px] text-green-700/80 dark:text-green-300/80">
              {appliedCoupon.description}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Coupon Applied:{" "}
                <span className="font-bold">{appliedCoupon.code}</span>
              </p>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Discount: -₦{appliedCoupon.discountAmount.toFixed(2)}
            </p>
            {appliedCoupon.description && (
              <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                {appliedCoupon.description}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="ml-2 text-sm font-medium text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
            aria-label="Remove coupon"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="coupon"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400"
          >
            Discount code
          </label>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Optional
          </span>
        </div>
        <div className="flex w-full items-center gap-2">
          <input
            type="text"
            id="coupon"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Code (e.g., SAVE20)"
            disabled={loading}
            maxLength={50}
            className="
              h-9 flex-1 min-w-0 rounded-md border border-neutral-300 bg-white px-3 text-sm uppercase tracking-wide
              text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-neutral-900/30 dark:border-neutral-700 dark:bg-neutral-800
              dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-neutral-100/20
            "
          />
          <button
            onClick={handleApply}
            disabled={loading || !code.trim()}
            className="
              flex h-9 min-w-[88px] shrink-0 items-center justify-center rounded-md bg-neutral-900 px-3 text-sm font-semibold
              text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50
              dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:focus-visible:ring-neutral-100/20
            "
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            ) : (
              "Apply"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <label
        htmlFor="coupon"
        className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100"
      >
        Have a discount code?
      </label>

      {/* Make it a single control group */}
      <div className="flex w-full overflow-hidden rounded-md border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <input
          type="text"
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Enter code (e.g., SAVE20)"
          disabled={loading}
          maxLength={50}
          className="
            h-10 flex-1 bg-transparent px-3 text-sm uppercase tracking-wide
            text-neutral-900 placeholder:text-neutral-400
            focus:outline-none
            dark:text-neutral-100 dark:placeholder:text-neutral-500
          "
        />

        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className={`
            h-10 min-w-[92px] shrink-0 px-4 text-sm font-medium
            bg-neutral-900 text-white hover:bg-neutral-800 flex items-center
            disabled:cursor-not-allowed disabled:opacity-50
            dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600
            focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30
            dark:focus-visible:ring-neutral-100/20
            ${loading ? "justify-center" : "justify-start"}
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
          ) : (
            "Apply"
          )}
        </button>
      </div>

      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Enter your coupon code to receive a discount on your order
      </p>
    </div>
  );
}
