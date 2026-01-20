"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateCouponCode } from "lib/coupon-utils";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
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
}

export default function CouponsPageClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [createCouponLoading, setCreateCouponLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useAutoGenerate, setUseAutoGenerate] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxUses: "",
    maxUsesPerUser: "",
    requiresLogin: false,
    startDate: "",
    expiryDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, [filter]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`/api/admin/coupons?status=${filter}`);
      const data = await response.json();
      setCoupons(data.coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = () => {
    const code = generateCouponCode();
    setFormData({ ...formData, code });
    toast.success(`Generated code: ${code}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCouponLoading(true);
    // Validate discount value
    if (
      formData.discountType !== "free_shipping" &&
      (!formData.discountValue || parseFloat(formData.discountValue) <= 0)
    ) {
      toast.error("Please enter a valid discount value");
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
          discountValue: parseFloat(formData.discountValue) || 0,
          minOrderValue: formData.minOrderValue
            ? parseFloat(formData.minOrderValue)
            : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser
            ? parseInt(formData.maxUsesPerUser)
            : null,
          requiresLogin: formData.requiresLogin,
          startDate: formData.startDate || null,
          expiryDate: formData.expiryDate || null,
          isActive: formData.isActive,
          autoGenerate: useAutoGenerate && !formData.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Coupon "${data.coupon.code}" created successfully`);
        setShowCreateForm(false);
        setFormData({
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: "",
          minOrderValue: "",
          maxUses: "",
          maxUsesPerUser: "",
          requiresLogin: false,
          startDate: "",
          expiryDate: "",
          isActive: true,
        });
        setUseAutoGenerate(true);
        fetchCoupons();
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

      if (response.ok) {
        toast.success(`Coupon ${!currentStatus ? "activated" : "deactivated"}`);
        fetchCoupons();
      } else {
        toast.error("Failed to update coupon");
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

      if (response.ok) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error("Failed to delete coupon");
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
    <>
      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Discount Coupons
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Create and manage promotional discount codes ({coupons.length}{" "}
                total)
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {showCreateForm ? "Cancel" : "+ Create Coupon"}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Create New Coupon
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Fill in the details below to create a new discount coupon
                </p>
              </div>

              <form onSubmit={handleCreateCoupon} className="p-6">
                <div className="space-y-6">
                  {/* Coupon Code Section */}
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Coupon Code
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="autoGenerate"
                          checked={useAutoGenerate}
                          onChange={(e) => {
                            setUseAutoGenerate(e.target.checked);
                            if (e.target.checked) {
                              setFormData({ ...formData, code: "" });
                            }
                          }}
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                        />
                        <label
                          htmlFor="autoGenerate"
                          className="text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          Auto-generate code
                        </label>
                      </div>

                      {!useAutoGenerate && (
                        <div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.code}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  code: e.target.value.toUpperCase(),
                                })
                              }
                              placeholder="e.g., SAVE20 or WELCOME"
                              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
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
                            Use uppercase letters, numbers, and hyphens (3-50
                            characters)
                          </p>
                        </div>
                      )}

                      {useAutoGenerate && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          A unique code will be automatically generated when you
                          create the coupon
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="e.g., 20% off for new customers"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      rows={2}
                    />
                  </div>

                  {/* Discount Settings */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Discount Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value,
                          })
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
                              setFormData({
                                ...formData,
                                discountValue: e.target.value,
                              })
                            }
                            placeholder={
                              formData.discountType === "percentage"
                                ? "20"
                                : "1000"
                            }
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
                          setFormData({
                            ...formData,
                            minOrderValue: e.target.value,
                          })
                        }
                        placeholder="e.g., 5000"
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 pr-10 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                      <span className="absolute right-3 top-2 text-sm text-neutral-500">
                        ₦
                      </span>
                    </div>
                  </div>

                  {/* Usage Limits */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Total Usage Limit
                      </label>
                      <input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) =>
                          setFormData({ ...formData, maxUses: e.target.value })
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
                          setFormData({
                            ...formData,
                            maxUsesPerUser: e.target.value,
                          })
                        }
                        placeholder="Unlimited"
                        min="0"
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                    </div>
                  </div>

                  {/* Validity Period */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
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
                          setFormData({
                            ...formData,
                            expiryDate: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                    </div>
                  </div>

                  {/* Status and Settings */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requiresLogin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requiresLogin: e.target.checked,
                          })
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
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        Active (coupon can be used immediately)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                  <button
                    type="submit"
                    className="rounded-md bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Filter Tabs */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("inactive")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === "inactive"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Coupons Table */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            className="mb-3 h-12 w-12 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                            />
                          </svg>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            No coupons found
                          </p>
                          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Create your first coupon to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr
                        key={coupon.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {coupon.code}
                              </div>
                              {coupon.description && (
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {coupon.description}
                                </div>
                              )}
                              {coupon.requiresLogin && (
                                <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Requires Login
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-neutral-900 dark:text-neutral-100">
                          {coupon.discountType.replace("_", " ")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : coupon.discountType === "fixed"
                              ? `₦${Number(coupon.discountValue).toLocaleString()}`
                              : "Free Shipping"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                          {coupon.usedCount}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              coupon.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                          {coupon.expiryDate
                            ? new Date(coupon.expiryDate).toLocaleDateString()
                            : "No expiry"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
