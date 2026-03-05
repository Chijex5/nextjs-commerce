"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  isActive: boolean;
  startDate: string | null;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CouponStats {
  remainingUses: number | null;
  usageRatePercent: number | null;
  usageEvents: number;
  uniqueUsers: number;
  guestUses: number;
  lastUsedAt: string | null;
  orderCount: number;
  totalRevenue: number;
  totalDiscountGiven: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
}

interface UsageRow {
  id: string;
  userId: string | null;
  sessionId: string | null;
  usedAt: string;
  userEmail: string | null;
  userName: string | null;
}

interface TopUserRow {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  usageCount: number;
  lastUsedAt: string | null;
}

interface RecentOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  createdAt: string;
}

interface CouponDetailResponse {
  coupon: Coupon;
  stats: CouponStats;
  recentUsage: UsageRow[];
  topUsers: TopUserRow[];
  recentOrders: RecentOrderRow[];
}

interface CouponDetailClientProps {
  couponId: string;
}

interface CouponFormData {
  code: string;
  description: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  maxUsesPerUser: string;
  requiresLogin: boolean;
  isActive: boolean;
  startDate: string;
  expiryDate: string;
}

function formatCurrency(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getCouponStatus(coupon: Coupon) {
  const now = Date.now();
  const startsAt = coupon.startDate ? new Date(coupon.startDate).getTime() : null;
  const expiresAt = coupon.expiryDate ? new Date(coupon.expiryDate).getTime() : null;
  const isScheduled = startsAt !== null && startsAt > now;
  const isExpired = expiresAt !== null && expiresAt < now;
  const isExhausted =
    typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses;

  if (!coupon.isActive) {
    return {
      label: "Inactive",
      className:
        "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
    };
  }

  if (isScheduled) {
    return {
      label: "Scheduled",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
  }

  if (isExpired) {
    return {
      label: "Expired",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
  }

  if (isExhausted) {
    return {
      label: "Exhausted",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
  }

  return {
    label: "Live",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
}

function formatDiscount(coupon: Coupon) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}%`;
  }

  if (coupon.discountType === "fixed") {
    return formatCurrency(coupon.discountValue);
  }

  return "Free shipping";
}

export default function CouponDetailClient({ couponId }: CouponDetailClientProps) {
  const [data, setData] = useState<CouponDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxUses: "",
    maxUsesPerUser: "",
    requiresLogin: false,
    isActive: true,
    startDate: "",
    expiryDate: "",
  });

  const hydrateForm = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue:
        coupon.discountType === "free_shipping"
          ? ""
          : String(Number(coupon.discountValue || 0)),
      minOrderValue:
        coupon.minOrderValue === null ? "" : String(Number(coupon.minOrderValue)),
      maxUses: coupon.maxUses === null ? "" : String(coupon.maxUses),
      maxUsesPerUser:
        coupon.maxUsesPerUser === null ? "" : String(coupon.maxUsesPerUser),
      requiresLogin: coupon.requiresLogin,
      isActive: coupon.isActive,
      startDate: toDateTimeInputValue(coupon.startDate),
      expiryDate: toDateTimeInputValue(coupon.expiryDate),
    });
  };

  const fetchCouponDetails = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        cache: "no-store",
      });

      if (response.status === 404) {
        setNotFound(true);
        setData(null);
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || "Failed to load coupon details");
        return;
      }

      setData(payload);
      setNotFound(false);
      hydrateForm(payload.coupon);
    } catch (error) {
      console.error("Error loading coupon details:", error);
      toast.error("Failed to load coupon details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchCouponDetails();
  }, [couponId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (
      formData.discountType !== "free_shipping" &&
      (!formData.discountValue || Number(formData.discountValue) <= 0)
    ) {
      toast.error("Please enter a valid discount value");
      return;
    }

    if (
      formData.startDate &&
      formData.expiryDate &&
      new Date(formData.expiryDate).getTime() <=
        new Date(formData.startDate).getTime()
    ) {
      toast.error("Expiry date must be later than start date");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          discountType: formData.discountType,
          discountValue:
            formData.discountType === "free_shipping"
              ? 0
              : Number(formData.discountValue),
          minOrderValue: formData.minOrderValue
            ? Number(formData.minOrderValue)
            : null,
          maxUses: formData.maxUses ? Number(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser
            ? Number(formData.maxUsesPerUser)
            : null,
          requiresLogin: formData.requiresLogin,
          isActive: formData.isActive,
          startDate: formData.startDate || null,
          expiryDate: formData.expiryDate || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || "Failed to update coupon");
        return;
      }

      toast.success("Coupon updated successfully");
      setData((prev) => (prev ? { ...prev, coupon: payload.coupon } : prev));
      hydrateForm(payload.coupon);
      await fetchCouponDetails(true);
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast.error("Failed to update coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!data) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !data.coupon.isActive }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || "Failed to update coupon status");
        return;
      }

      const message = payload.coupon.isActive
        ? "Coupon activated"
        : "Coupon deactivated";
      toast.success(message);
      setData((prev) => (prev ? { ...prev, coupon: payload.coupon } : prev));
      hydrateForm(payload.coupon);
      await fetchCouponDetails(true);
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      toast.error("Failed to update coupon status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading coupon details...
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Coupon not found
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          The coupon you requested does not exist or may have been deleted.
        </p>
        <Link
          href="/admin/coupons"
          className="mt-4 inline-flex rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back to Coupons
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { coupon, stats, recentUsage, topUsers, recentOrders } = data;
  const status = getCouponStatus(coupon);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/coupons"
          className="w-fit text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back to coupons
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                {coupon.code}
              </h1>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
              {coupon.requiresLogin && (
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Login required
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {coupon.description || "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {refreshing && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Refreshing...
              </span>
            )}
            <button
              onClick={handleToggleActive}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {coupon.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => fetchCouponDetails(true)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || refreshing}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6 xl:col-span-2"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Edit Coupon
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Update the coupon configuration and availability.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Coupon Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Discount Type
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
                    discountValue:
                      e.target.value === "free_shipping" ? "" : prev.discountValue,
                  }))
                }
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          {formData.discountType !== "free_shipping" && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Discount Value
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
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 pr-10 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  required
                />
                <span className="absolute right-3 top-2 text-sm text-neutral-500">
                  {formData.discountType === "percentage" ? "%" : "₦"}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Minimum Order Value
              </label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minOrderValue: e.target.value,
                  }))
                }
                min="0"
                step="0.01"
                placeholder="Unlimited"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
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
                min={coupon.usedCount}
                placeholder="Unlimited"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Used so far: {coupon.usedCount}
              </p>
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
                min="1"
                placeholder="Unlimited"
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
                Active and available for checkout
              </span>
            </label>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Discount
            </p>
            <p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {formatDiscount(coupon)}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Used Count
            </p>
            <p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {coupon.usedCount}
              {typeof coupon.maxUses === "number" ? ` / ${coupon.maxUses}` : ""}
            </p>
            {stats.usageRatePercent !== null && (
              <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-2 rounded-full bg-neutral-900 dark:bg-neutral-100"
                  style={{ width: `${Math.min(stats.usageRatePercent, 100)}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Remaining uses: {stats.remainingUses ?? "Unlimited"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Total Orders
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {stats.orderCount}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Usage Events
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {stats.usageEvents}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Unique Users
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {stats.uniqueUsers}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Guest Uses
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {stats.guestUses}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Total Discount Given
            </p>
            <p className="mt-2 text-xl font-semibold text-green-600 dark:text-green-300">
              {formatCurrency(stats.totalDiscountGiven)}
            </p>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Revenue influenced: {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Avg order value: {formatCurrency(stats.avgOrderValue)}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Activity
            </p>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              Last used: {formatDateTime(stats.lastUsedAt)}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              Last coupon order: {formatDateTime(stats.lastOrderAt)}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              Created: {formatDateTime(coupon.createdAt)}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              Updated: {formatDateTime(coupon.updatedAt)}
            </p>
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 xl:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Recent Usage Events
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Most recent coupon use records (up to 20 events).
          </p>

          {recentUsage.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              No usage events recorded yet.
            </p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Used At
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Customer
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Identifier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {recentUsage.map((usage) => (
                      <tr key={usage.id}>
                        <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                          {formatDateTime(usage.usedAt)}
                        </td>
                        <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                          {usage.userName || usage.userEmail || "Guest checkout"}
                        </td>
                        <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                          {usage.userEmail || usage.userId || usage.sessionId || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {recentUsage.map((usage) => (
                  <div
                    key={usage.id}
                    className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                  >
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {usage.userName || usage.userEmail || "Guest checkout"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(usage.usedAt)}
                    </p>
                    <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
                      {usage.userEmail || usage.userId || usage.sessionId || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Top Users
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Customers with the highest usage count.
          </p>

          {topUsers.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              No logged-in user usage yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topUsers.map((user) => (
                <li
                  key={user.userId || user.userEmail}
                  className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {user.userName || user.userEmail || "Unknown user"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {user.usageCount} use{user.usageCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Last used: {formatDateTime(user.lastUsedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Recent Coupon Orders
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Latest orders where this coupon was applied.
        </p>

        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            No orders have used this coupon yet.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Order
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Discount
                    </th>
                    <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Total
                    </th>
                    <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                        <p>{order.customerName}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {order.email}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                        {order.status}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-300">
                        {formatCurrency(order.discountAmount)}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {order.email}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <p className="text-green-600 dark:text-green-300">
                      Discount: {formatCurrency(order.discountAmount)}
                    </p>
                    <p className="text-right text-neutral-700 dark:text-neutral-300">
                      Total: {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
