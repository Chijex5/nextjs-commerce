"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { generateCouponCode } from "lib/coupon-utils";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  requiresLogin: boolean;
  includesShipping: boolean;
  isActive: boolean;
  startDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

type CouponFilter = "all" | "active" | "inactive";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "",
  maxUses: "",
  maxUsesPerUser: "",
  requiresLogin: false,
  includesShipping: false,
  startDate: "",
  expiryDate: "",
  isActive: true,
};

function formatCurrency(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return withTime
    ? date.toLocaleString()
    : date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatDiscount(coupon: Coupon) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% off${coupon.includesShipping ? " (incl. shipping)" : ""}`;
  }

  if (coupon.discountType === "fixed") {
    return `${formatCurrency(coupon.discountValue)} off${coupon.includesShipping ? " (incl. shipping)" : ""}`;
  }

  return "Free shipping";
}

function getCouponState(coupon: Coupon) {
  const now = Date.now();
  const startsAt = coupon.startDate ? new Date(coupon.startDate).getTime() : null;
  const expiresAt = coupon.expiryDate ? new Date(coupon.expiryDate).getTime() : null;
  const isScheduled = startsAt !== null && startsAt > now;
  const isExpired = expiresAt !== null && expiresAt < now;
  const isExhausted =
    typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses;
  const isLive = coupon.isActive && !isScheduled && !isExpired && !isExhausted;

  if (!coupon.isActive) {
    return {
      label: "Inactive",
      className:
        "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      isLive: false,
      isExpired,
      isExhausted,
    };
  }

  if (isScheduled) {
    return {
      label: "Scheduled",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      isLive: false,
      isExpired,
      isExhausted,
    };
  }

  if (isExpired) {
    return {
      label: "Expired",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      isLive: false,
      isExpired,
      isExhausted,
    };
  }

  if (isExhausted) {
    return {
      label: "Exhausted",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      isLive: false,
      isExpired,
      isExhausted,
    };
  }

  return {
    label: "Live",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    isLive,
    isExpired,
    isExhausted,
  };
}

export default function CouponsPageClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [createCouponLoading, setCreateCouponLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useAutoGenerate, setUseAutoGenerate] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    void fetchCoupons();
  }, [filter]);

  const couponStats = useMemo(() => {
    const now = Date.now();
    const stats = {
      total: coupons.length,
      live: 0,
      exhausted: 0,
      expiringSoon: 0,
      requiresLogin: 0,
    };

    for (const coupon of coupons) {
      const state = getCouponState(coupon);
      if (state.isLive) stats.live += 1;
      if (state.isExhausted) stats.exhausted += 1;
      if (coupon.requiresLogin) stats.requiresLogin += 1;

      if (coupon.expiryDate) {
        const expiryTime = new Date(coupon.expiryDate).getTime();
        const timeLeft = expiryTime - now;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (timeLeft > 0 && timeLeft <= oneWeek) {
          stats.expiringSoon += 1;
        }
      }
    }

    return stats;
  }, [coupons]);

  const fetchCoupons = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/admin/coupons?status=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to load coupons");
        return;
      }

      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateCode = () => {
    const code = generateCouponCode();
    setFormData((prev) => ({ ...prev, code }));
    toast.success(`Generated code: ${code}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCouponLoading(true);

    if (
      formData.discountType !== "free_shipping" &&
      (!formData.discountValue || Number(formData.discountValue) <= 0)
    ) {
      toast.error("Please enter a valid discount value");
      setCreateCouponLoading(false);
      return;
    }

    if (
      formData.startDate &&
      formData.expiryDate &&
      new Date(formData.expiryDate).getTime() <=
        new Date(formData.startDate).getTime()
    ) {
      toast.error("Expiry date must be later than start date");
      setCreateCouponLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || null,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue) || 0,
          minOrderValue: formData.minOrderValue
            ? Number(formData.minOrderValue)
            : null,
          maxUses: formData.maxUses ? Number(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser
            ? Number(formData.maxUsesPerUser)
            : null,
          requiresLogin: formData.requiresLogin,
          includesShipping: formData.includesShipping,
          startDate: formData.startDate || null,
          expiryDate: formData.expiryDate || null,
          isActive: formData.isActive,
          autoGenerate: useAutoGenerate && !formData.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Coupon \"${data.coupon.code}\" created successfully`);
        setShowCreateForm(false);
        setFormData(EMPTY_FORM);
        setUseAutoGenerate(true);
        await fetchCoupons();
      } else {
        toast.error(data.error || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("Failed to create coupon");
    } finally {
      setCreateCouponLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Coupon ${!currentStatus ? "activated" : "deactivated"}`);
        await fetchCoupons();
      } else {
        toast.error(data.error || "Failed to update coupon");
      }
    } catch (error) {
      console.error("Error toggling coupon:", error);
      toast.error("Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Coupon deleted successfully");
        await fetchCoupons();
      } else {
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100"></div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading coupons...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Discount Coupons
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Create, monitor, and manage discount codes for checkout.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Refreshing...
              </span>
            )}
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {showCreateForm ? "Close Form" : "+ Create Coupon"}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800 sm:px-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Create New Coupon
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Fill in the details below to create a new discount coupon.
              </p>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-6 p-5 sm:p-6">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <h3 className="mb-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Coupon Code
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoGenerate"
                      checked={useAutoGenerate}
                      onChange={(e) => {
                        setUseAutoGenerate(e.target.checked);
                        if (e.target.checked) {
                          setFormData((prev) => ({ ...prev, code: "" }));
                        }
                      }}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      Auto-generate code
                    </span>
                  </label>

                  {!useAutoGenerate && (
                    <div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              code: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="e.g., SAVE20"
                          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateCode}
                          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          Generate
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Use uppercase letters, numbers, and hyphens.
                      </p>
                    </div>
                  )}

                  {useAutoGenerate && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      A unique code will be generated when you create the coupon.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="e.g., 20% off for first-time customers"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Discount Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: e.target.value as
                          | "percentage"
                          | "fixed"
                          | "free_shipping",
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    required
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {formData.discountType !== "free_shipping" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Discount Value <span className="text-red-600">*</span>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discountValue: e.target.value,
                          }))
                        }
                        placeholder={formData.discountType === "percentage" ? "20" : "1000"}
                        required
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 pr-10 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                      <span className="absolute right-3 top-2 text-sm text-neutral-500">
                        {formData.discountType === "percentage" ? "%" : "₦"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Minimum Order Value
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minOrderValue: e.target.value }))
                    }
                    placeholder="e.g., 5000"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 pr-10 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  <span className="absolute right-3 top-2 text-sm text-neutral-500">₦</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maxUses: e.target.value }))
                    }
                    placeholder="Unlimited"
                    min="0"
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Per Customer Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsesPerUser}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxUsesPerUser: e.target.value,
                      }))
                    }
                    placeholder="Unlimited"
                    min="0"
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresLogin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requiresLogin: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Require customer login/signup to use
                  </span>
                </label>

                {formData.discountType !== "free_shipping" && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includesShipping}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          includesShipping: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      Apply discount to shipping cost too
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Active (coupon can be used immediately)
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={createCouponLoading}
                >
                  {createCouponLoading ? "Creating..." : "Create Coupon"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-md border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {couponStats.total}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Live
            </p>
            <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-300">
              {couponStats.live}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Exhausted
            </p>
            <p className="mt-2 text-2xl font-semibold text-orange-600 dark:text-orange-300">
              {couponStats.exhausted}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Expiring in 7 Days
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-300">
              {couponStats.expiringSoon}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Login Required
            </p>
            <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-300">
              {couponStats.requiresLogin}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:max-w-sm">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              filter === "active"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              filter === "inactive"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Inactive
          </button>
        </div>

        {coupons.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-neutral-100 p-3 text-neutral-400 dark:bg-neutral-800">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              No coupons found
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Create your first coupon to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white shadow dark:border-neutral-800 dark:bg-neutral-900 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead className="bg-neutral-50 dark:bg-neutral-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 lg:px-6">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 lg:px-6">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 lg:px-6">
                        Usage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 lg:px-6">
                        Validity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 lg:px-6">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 lg:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {coupons.map((coupon) => {
                      const state = getCouponState(coupon);
                      const usagePercent =
                        typeof coupon.maxUses === "number" && coupon.maxUses > 0
                          ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)
                          : null;

                      return (
                        <tr
                          key={coupon.id}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          <td className="px-4 py-4 lg:px-6">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {coupon.code}
                            </p>
                            {coupon.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                                {coupon.description}
                              </p>
                            )}
                            {coupon.requiresLogin && (
                              <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Login required
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-900 dark:text-neutral-100 lg:px-6">
                            {formatDiscount(coupon)}
                            {coupon.minOrderValue && (
                              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Min order {formatCurrency(coupon.minOrderValue)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-900 dark:text-neutral-100 lg:px-6">
                            <p>
                              {coupon.usedCount}
                              {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                            </p>
                            {usagePercent !== null && (
                              <div className="mt-2 h-1.5 w-28 rounded-full bg-neutral-200 dark:bg-neutral-700">
                                <div
                                  className="h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-neutral-500 dark:text-neutral-400 lg:px-6">
                            <p>Start: {formatDate(coupon.startDate)}</p>
                            <p className="mt-1">End: {formatDate(coupon.expiryDate)}</p>
                          </td>
                          <td className="px-4 py-4 lg:px-6">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${state.className}`}
                            >
                              {state.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium lg:px-6">
                            <div className="flex justify-end gap-3">
                              <Link
                                href={`/admin/coupons/${coupon.id}`}
                                className="text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                              >
                                View / Edit
                              </Link>
                              <button
                                onClick={() =>
                                  handleToggleActive(coupon.id, coupon.isActive)
                                }
                                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                              >
                                {coupon.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {coupons.map((coupon) => {
                const state = getCouponState(coupon);
                return (
                  <div
                    key={coupon.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                          {coupon.code}
                        </p>
                        {coupon.description && (
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                            {coupon.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${state.className}`}
                      >
                        {state.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Discount
                        </p>
                        <p className="mt-1 text-neutral-900 dark:text-neutral-100">
                          {formatDiscount(coupon)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Usage
                        </p>
                        <p className="mt-1 text-neutral-900 dark:text-neutral-100">
                          {coupon.usedCount}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Start
                        </p>
                        <p className="mt-1 text-neutral-900 dark:text-neutral-100">
                          {formatDate(coupon.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Expiry
                        </p>
                        <p className="mt-1 text-neutral-900 dark:text-neutral-100">
                          {formatDate(coupon.expiryDate)}
                        </p>
                      </div>
                    </div>

                    {coupon.requiresLogin && (
                      <span className="mt-3 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Login required
                      </span>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                      <Link
                        href={`/admin/coupons/${coupon.id}`}
                        className="text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                      >
                        View / Edit
                      </Link>
                      <button
                        onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                        className="text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                      >
                        {coupon.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
