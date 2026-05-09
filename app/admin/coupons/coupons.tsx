"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { generateCouponCode } from "lib/coupon-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  grantsFreeShipping: boolean;
  includeShippingInDiscount: boolean;
  isActive: boolean;
  startDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

type CouponFilter = "all" | "active" | "inactive";

// ─── Form default ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage" as "percentage" | "fixed" | "free_shipping",
  discountValue: "",
  minOrderValue: "",
  maxUses: "",
  maxUsesPerUser: "",
  requiresLogin: false,
  grantsFreeShipping: false,
  includeShippingInDiscount: false,
  startDate: "",
  expiryDate: "",
  isActive: true,
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDiscount(coupon: Coupon) {
  const extras: string[] = [];
  if (coupon.grantsFreeShipping || coupon.discountType === "free_shipping") extras.push("free shipping");
  else if (coupon.discountType === "percentage" && coupon.includeShippingInDiscount) extras.push("incl. shipping");

  if (coupon.discountType === "percentage")
    return `${coupon.discountValue}% off${extras.length ? ` + ${extras.join(", ")}` : ""}`;
  if (coupon.discountType === "fixed")
    return `${formatCurrency(coupon.discountValue)} off${extras.length ? ` + ${extras.join(", ")}` : ""}`;
  return extras.length ? extras.join(", ") : "Free shipping";
}

function getCouponState(coupon: Coupon) {
  const now = Date.now();
  const startsAt  = coupon.startDate  ? new Date(coupon.startDate).getTime()  : null;
  const expiresAt = coupon.expiryDate ? new Date(coupon.expiryDate).getTime() : null;
  const isScheduled = startsAt  !== null && startsAt  > now;
  const isExpired   = expiresAt !== null && expiresAt < now;
  const isExhausted = typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses;
  const isLive = coupon.isActive && !isScheduled && !isExpired && !isExhausted;

  if (!coupon.isActive)  return { label: "Inactive",   dot: "bg-neutral-400",  pill: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",           isLive: false, isExpired, isExhausted };
  if (isScheduled)       return { label: "Scheduled",  dot: "bg-blue-500",     pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",                    isLive: false, isExpired, isExhausted };
  if (isExpired)         return { label: "Expired",    dot: "bg-amber-500",    pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",                 isLive: false, isExpired, isExhausted };
  if (isExhausted)       return { label: "Exhausted",  dot: "bg-orange-500",   pill: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",             isLive: false, isExpired, isExhausted };
  return                        { label: "Live",       dot: "bg-emerald-500",  pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",         isLive, isExpired, isExhausted };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls = "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500";

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
          checked ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform dark:bg-neutral-900 ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>}
      </div>
    </label>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">{label}</span>
      <span className={`text-2xl font-bold tracking-tight ${accent ?? "text-neutral-900 dark:text-neutral-100"}`}>
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Create Drawer ────────────────────────────────────────────────────────────

function CreateCouponDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [useAutoGenerate, setUseAutoGenerate] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (patch: Partial<typeof EMPTY_FORM>) => setForm((p) => ({ ...p, ...patch }));

  const handleGenerateCode = () => {
    const code = generateCouponCode();
    set({ code });
    toast.success(`Generated: ${code}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.discountType !== "free_shipping" && (!form.discountValue || Number(form.discountValue) <= 0)) {
      toast.error("Enter a valid discount value"); return;
    }
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) {
      toast.error("Percentage cannot exceed 100%"); return;
    }
    if (form.startDate && form.expiryDate && new Date(form.expiryDate) <= new Date(form.startDate)) {
      toast.error("Expiry must be after start date"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          description: form.description || null,
          discountType: form.discountType,
          discountValue: Number(form.discountValue) || 0,
          minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
          requiresLogin: form.requiresLogin,
          grantsFreeShipping: form.grantsFreeShipping,
          includeShippingInDiscount: form.includeShippingInDiscount,
          startDate: form.startDate || null,
          expiryDate: form.expiryDate || null,
          isActive: form.isActive,
          autoGenerate: useAutoGenerate && !form.code,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Coupon "${data.coupon.code}" created`);
        setForm(EMPTY_FORM);
        setUseAutoGenerate(true);
        onCreated();
        onClose();
      } else {
        toast.error(data.error || "Failed to create coupon");
      }
    } catch { toast.error("Failed to create coupon"); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Drawer header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">New Coupon</h2>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">Configure and publish a discount code</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <form id="create-coupon-form" onSubmit={handleSubmit} className="space-y-6 p-6">

            {/* ── Coupon code ── */}
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
              <FieldLabel>Coupon Code</FieldLabel>
              <Toggle
                checked={useAutoGenerate}
                onChange={(v) => { setUseAutoGenerate(v); if (v) set({ code: "" }); }}
                label="Auto-generate code"
                hint="A unique code will be created on submit"
              />
              {!useAutoGenerate && (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SAVE20"
                      className={`${inputCls} font-mono`}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="flex-shrink-0 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300"
                    >
                      Suggest
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                    Uppercase letters, numbers and hyphens only
                  </p>
                </div>
              )}
            </div>

            {/* ── Description ── */}
            <div>
              <FieldLabel htmlFor="desc">Description</FieldLabel>
              <textarea
                id="desc"
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="e.g. 20% off for first-time customers"
                rows={2}
                className={inputCls}
              />
            </div>

            {/* ── Discount type + value ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="dtype">Discount Type</FieldLabel>
                <select
                  id="dtype"
                  value={form.discountType}
                  onChange={(e) => {
                    const t = e.target.value as typeof form.discountType;
                    set({
                      discountType: t,
                      grantsFreeShipping: t === "free_shipping" ? true : form.grantsFreeShipping,
                      includeShippingInDiscount: t === "percentage" ? form.includeShippingInDiscount : false,
                    });
                  }}
                  className={inputCls}
                  required
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
              {form.discountType !== "free_shipping" && (
                <div>
                  <FieldLabel htmlFor="dval">Value</FieldLabel>
                  <div className="relative">
                    <input
                      id="dval"
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => set({ discountValue: e.target.value })}
                      placeholder={form.discountType === "percentage" ? "20" : "5000"}
                      min="0"
                      max={form.discountType === "percentage" ? "100" : undefined}
                      step="0.01"
                      required
                      className={`${inputCls} pr-9`}
                    />
                    <span className="absolute right-3 top-2.5 text-sm font-medium text-neutral-400">
                      {form.discountType === "percentage" ? "%" : "₦"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Shipping options ── */}
            <div className="space-y-3">
              <Toggle
                checked={form.grantsFreeShipping}
                onChange={(v) => set({ grantsFreeShipping: v })}
                label="Include free shipping"
              />
              {form.discountType === "percentage" && (
                <Toggle
                  checked={form.includeShippingInDiscount}
                  onChange={(v) => set({ includeShippingInDiscount: v })}
                  label="Apply % discount to shipping too"
                />
              )}
            </div>

            {/* ── Min order ── */}
            <div>
              <FieldLabel htmlFor="minorder">Minimum Order Value</FieldLabel>
              <div className="relative">
                <input
                  id="minorder"
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) => set({ minOrderValue: e.target.value })}
                  placeholder="No minimum"
                  min="0"
                  step="0.01"
                  className={`${inputCls} pr-9`}
                />
                <span className="absolute right-3 top-2.5 text-sm font-medium text-neutral-400">₦</span>
              </div>
            </div>

            {/* ── Limits ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="maxuses">Total usage limit</FieldLabel>
                <input
                  id="maxuses"
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => set({ maxUses: e.target.value })}
                  placeholder="Unlimited"
                  min="0"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel htmlFor="maxperuser">Per customer limit</FieldLabel>
                <input
                  id="maxperuser"
                  type="number"
                  value={form.maxUsesPerUser}
                  onChange={(e) => set({ maxUsesPerUser: e.target.value })}
                  placeholder="Unlimited"
                  min="0"
                  className={inputCls}
                />
              </div>
            </div>

            {/* ── Dates ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="start">Start Date</FieldLabel>
                <input
                  id="start"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => set({ startDate: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel htmlFor="expiry">Expiry Date</FieldLabel>
                <input
                  id="expiry"
                  type="datetime-local"
                  value={form.expiryDate}
                  onChange={(e) => set({ expiryDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* ── Toggles ── */}
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
              <Toggle
                checked={form.requiresLogin}
                onChange={(v) => set({ requiresLogin: v })}
                label="Require customer login to use"
                hint="Guests won't be able to apply this code"
              />
              <Toggle
                checked={form.isActive}
                onChange={(v) => set({ isActive: v })}
                label="Active immediately"
                hint="Code can be used at checkout right away"
              />
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-neutral-100 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-coupon-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {saving ? <><Spinner />Creating…</> : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coupon row ───────────────────────────────────────────────────────────────

function CouponRow({
  coupon,
  onToggle,
  onDelete,
}: {
  coupon: Coupon;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const state = getCouponState(coupon);
  const usagePct = typeof coupon.maxUses === "number" && coupon.maxUses > 0
    ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)
    : null;

  return (
    <tr className="group transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-950/30">
      {/* Code + description */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${state.dot}`}
          />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {coupon.code}
            </p>
            {coupon.description && (
              <p className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-500 max-w-[200px]">
                {coupon.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Discount */}
      <td className="px-5 py-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDiscount(coupon)}</p>
        {coupon.minOrderValue && (
          <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
            Min {formatCurrency(coupon.minOrderValue)}
          </p>
        )}
        {coupon.requiresLogin && (
          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            Login req.
          </span>
        )}
      </td>

      {/* Usage */}
      <td className="px-5 py-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {coupon.usedCount}
          {coupon.maxUses != null && (
            <span className="text-neutral-400 dark:text-neutral-500"> / {coupon.maxUses}</span>
          )}
        </p>
        {usagePct !== null && (
          <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-red-500" : usagePct >= 60 ? "bg-amber-500" : "bg-neutral-900 dark:bg-neutral-100"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        )}
      </td>

      {/* Validity */}
      <td className="px-5 py-4 text-xs text-neutral-400 dark:text-neutral-500">
        <p>From {formatDate(coupon.startDate)}</p>
        <p className="mt-0.5">Until {formatDate(coupon.expiryDate)}</p>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.pill}`}>
          {state.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            href={`/admin/coupons/${coupon.id}`}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => onToggle(coupon.id, coupon.isActive)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {coupon.isActive ? "Pause" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(coupon.id)}
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function CouponCard({
  coupon,
  onToggle,
  onDelete,
}: {
  coupon: Coupon;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const state = getCouponState(coupon);
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-neutral-100 px-4 py-3.5 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${state.dot}`} />
          <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">{coupon.code}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.pill}`}>{state.label}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {coupon.description && (
          <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">{coupon.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Discount</span>
            <p className="mt-0.5 font-medium text-neutral-700 dark:text-neutral-300">{formatDiscount(coupon)}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Used</span>
            <p className="mt-0.5 font-medium text-neutral-700 dark:text-neutral-300">
              {coupon.usedCount}{coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Start</span>
            <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">{formatDate(coupon.startDate)}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Expiry</span>
            <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">{formatDate(coupon.expiryDate)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <Link
          href={`/admin/coupons/${coupon.id}`}
          className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-center text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onToggle(coupon.id, coupon.isActive)}
          className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300"
        >
          {coupon.isActive ? "Pause" : "Activate"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(coupon.id)}
          className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouponsPageClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { void fetchCoupons(); }, [filter]);

  const stats = useMemo(() => {
    const now = Date.now();
    let live = 0, exhausted = 0, expiringSoon = 0, requiresLogin = 0;
    for (const c of coupons) {
      const s = getCouponState(c);
      if (s.isLive) live++;
      if (s.isExhausted) exhausted++;
      if (c.requiresLogin) requiresLogin++;
      if (c.expiryDate) {
        const t = new Date(c.expiryDate).getTime() - now;
        if (t > 0 && t <= 7 * 86_400_000) expiringSoon++;
      }
    }
    return { total: coupons.length, live, exhausted, expiringSoon, requiresLogin };
  }, [coupons]);

  const fetchCoupons = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/coupons?status=${filter}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to load coupons"); return; }
      setCoupons(data.coupons || []);
    } catch { toast.error("Failed to load coupons"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(current ? "Coupon paused" : "Coupon activated"); void fetchCoupons(); }
      else toast.error(data.error || "Failed to update");
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) { toast.success("Coupon deleted"); void fetchCoupons(); }
      else toast.error(data.error || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-32 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">

        {/* ══════════════════════════════════════════
            HEADER + STATS
            ══════════════════════════════════════════ */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">

          {/* Title row */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Coupons
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                Discount codes for checkout
              </p>
            </div>
            <div className="flex items-center gap-2">
              {refreshing && <Spinner />}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                New Coupon
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-neutral-100 sm:grid-cols-5 dark:divide-neutral-800">
            <StatPill label="Total"         value={stats.total}        />
            <StatPill label="Live"          value={stats.live}         accent="text-emerald-600 dark:text-emerald-400" />
            <StatPill label="Exhausted"     value={stats.exhausted}    accent="text-orange-600 dark:text-orange-400" />
            <div className="hidden sm:block">
              <StatPill label="Expiring soon" value={stats.expiringSoon} accent="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="hidden sm:block">
              <StatPill label="Login req."    value={stats.requiresLogin} accent="text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 border-t border-neutral-100 px-5 dark:border-neutral-800">
            {(["all", "active", "inactive"] as CouponFilter[]).map((f) => {
              const active = filter === f;
              const label = f === "all" ? "All" : f === "active" ? "Active" : "Inactive";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`relative py-3.5 pr-4 text-sm font-medium capitalize transition-colors ${
                    active
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-4 h-[2px] rounded-t-full bg-neutral-900 dark:bg-neutral-100" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            CONTENT
            ══════════════════════════════════════════ */}
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16 dark:border-neutral-800">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">No coupons found</p>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="mt-3 text-xs font-medium text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
            >
              Create your first coupon
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    {["Code", "Discount", "Usage", "Validity", "Status", ""].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400 last:text-right dark:text-neutral-500"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {coupons.map((coupon) => (
                    <CouponRow
                      key={coupon.id}
                      coupon={coupon}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          CREATE DRAWER (separate from the list)
          ══════════════════════════════════════════ */}
      <CreateCouponDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => void fetchCoupons()}
      />
    </>
  );
}