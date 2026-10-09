"use client";

import clsx from "clsx";
import { buttonClass } from "components/ui/button";
import { describeDiscount, describeRules } from "lib/admin/coupons";
import { generateCouponCode } from "lib/coupon-utils";
import { Loader2, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type CouponFormValues = {
  code: string;
  description: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  maxUsesPerUser: string;
  requiresLogin: boolean;
  grantsFreeShipping: boolean;
  includeShippingInDiscount: boolean;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
};

export const EMPTY_COUPON: CouponFormValues = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "",
  maxUses: "",
  maxUsesPerUser: "1",
  requiresLogin: false,
  grantsFreeShipping: false,
  includeShippingInDiscount: false,
  startDate: "",
  expiryDate: "",
  isActive: true,
};

const TYPES = [
  { value: "percentage", label: "% off" },
  { value: "fixed", label: "₦ off" },
  { value: "free_shipping", label: "Free delivery" },
] as const;

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-fg-3">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-fg-3">{hint}</span>
      ) : null}
    </label>
  );
}

function Check({
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
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4"
      />
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {hint ? <span className="block text-xs text-fg-3">{hint}</span> : null}
      </span>
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="sr-only">{title}</legend>
      <p className="mb-4 text-[15px] font-semibold">{title}</p>
      {children}
    </fieldset>
  );
}

/** Create (no id) or edit (with id) a coupon. */
export function CouponForm({
  id,
  initial = EMPTY_COUPON,
  usedCount = 0,
}: {
  id?: string;
  initial?: CouponFormValues;
  usedCount?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<CouponFormValues>) =>
    setForm((f) => ({ ...f, ...patch }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const preview = {
    discountType: form.discountType,
    discountValue: Number(form.discountValue) || 0,
    minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
    maxUses: form.maxUses ? Number(form.maxUses) : null,
    usedCount,
    maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
    requiresLogin: form.requiresLogin,
    grantsFreeShipping: form.grantsFreeShipping,
    isActive: form.isActive,
    startDate: form.startDate || null,
    expiryDate: form.expiryDate || null,
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      form.discountType !== "free_shipping" &&
      !(Number(form.discountValue) > 0)
    )
      return toast.error("Enter how much the discount is worth");
    if (form.discountType === "percentage" && Number(form.discountValue) > 100)
      return toast.error("A percentage can't be over 100");
    if (
      form.startDate &&
      form.expiryDate &&
      new Date(form.expiryDate) <= new Date(form.startDate)
    ) {
      return toast.error("The end date must be after the start date");
    }
    setSaving(true);
    const body = {
      code: form.code.trim() || undefined,
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue:
        form.discountType === "free_shipping" ? 0 : Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
      requiresLogin: form.requiresLogin,
      grantsFreeShipping:
        form.discountType === "free_shipping" ? true : form.grantsFreeShipping,
      includeShippingInDiscount: form.includeShippingInDiscount,
      // datetime-local has no zone; the shop runs on Lagos time.
      startDate: form.startDate ? `${form.startDate}:00+01:00` : null,
      expiryDate: form.expiryDate ? `${form.expiryDate}:00+01:00` : null,
      isActive: form.isActive,
      ...(id ? {} : { autoGenerate: !form.code.trim() }),
    };
    try {
      const res = await fetch(
        id ? `/api/admin/coupons/${id}` : "/api/admin/coupons",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save the coupon");
      toast.success(
        id ? "Coupon saved" : `Created ${data.coupon?.code ?? "coupon"}`,
      );
      if (!id && data.coupon?.id)
        router.push(`/admin/coupons/${data.coupon.id}`);
      else router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't save the coupon",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-6">
        <Section title="Code">
          <div className="flex gap-2">
            <input
              value={form.code}
              onChange={(e) =>
                set({ code: e.target.value.toUpperCase().replace(/\s+/g, "") })
              }
              placeholder={id ? "" : "Leave blank to generate one"}
              className={clsx(input, "font-mono uppercase tracking-wider")}
              aria-label="Coupon code"
            />
            <button
              type="button"
              onClick={() => set({ code: generateCouponCode() })}
              className={buttonClass("outline", "md", "h-11 shrink-0")}
            >
              <Shuffle className="size-4" /> Generate
            </button>
          </div>
          <div className="mt-4">
            <Field
              label="Internal note"
              hint="Only you see this, e.g. “Instagram giveaway, October”."
            >
              <input
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                className={input}
              />
            </Field>
          </div>
        </Section>

        <Section title="Discount">
          <div
            role="radiogroup"
            aria-label="Discount type"
            className="mb-4 flex border border-line"
          >
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={form.discountType === t.value}
                onClick={() => set({ discountType: t.value })}
                className={clsx(
                  "h-10 flex-1 border-r border-line font-mono text-[11px] uppercase tracking-wide last:border-r-0",
                  form.discountType === t.value
                    ? "bg-fg text-canvas"
                    : "text-fg-3 hover:text-fg",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {form.discountType !== "free_shipping" ? (
              <Field
                label={
                  form.discountType === "percentage"
                    ? "Percent off"
                    : "Naira off"
                }
              >
                <input
                  inputMode="numeric"
                  value={form.discountValue}
                  onChange={(e) =>
                    set({
                      discountValue: e.target.value.replace(/[^\d.]/g, ""),
                    })
                  }
                  placeholder={
                    form.discountType === "percentage" ? "15" : "5000"
                  }
                  className={input}
                />
              </Field>
            ) : null}
            <Field label="Minimum order (₦)" hint="Leave blank for any order.">
              <input
                inputMode="numeric"
                value={form.minOrderValue}
                onChange={(e) =>
                  set({ minOrderValue: e.target.value.replace(/[^\d.]/g, "") })
                }
                placeholder="No minimum"
                className={input}
              />
            </Field>
          </div>
          {form.discountType !== "free_shipping" ? (
            <div className="mt-2">
              <Check
                checked={form.grantsFreeShipping}
                onChange={(v) => set({ grantsFreeShipping: v })}
                label="Also give free delivery"
              />
              <Check
                checked={form.includeShippingInDiscount}
                onChange={(v) => set({ includeShippingInDiscount: v })}
                label="Apply the discount to delivery too"
                hint="Off by default: the discount only reduces the price of the shoes."
              />
            </div>
          ) : null}
        </Section>

        <Section title="Limits">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total uses" hint="Leave blank for unlimited.">
              <input
                inputMode="numeric"
                value={form.maxUses}
                onChange={(e) =>
                  set({ maxUses: e.target.value.replace(/\D/g, "") })
                }
                placeholder="Unlimited"
                className={input}
              />
            </Field>
            <Field label="Uses per customer">
              <input
                inputMode="numeric"
                value={form.maxUsesPerUser}
                onChange={(e) =>
                  set({ maxUsesPerUser: e.target.value.replace(/\D/g, "") })
                }
                placeholder="Unlimited"
                className={input}
              />
            </Field>
          </div>
          <div className="mt-2">
            <Check
              checked={form.requiresLogin}
              onChange={(v) => set({ requiresLogin: v })}
              label="Signed-in customers only"
              hint="Makes per-customer limits reliable. Guests can't use the code."
            />
          </div>
        </Section>

        <Section title="Schedule">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" hint="Blank = straight away.">
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="Ends" hint="Blank = never.">
              <input
                type="datetime-local"
                value={form.expiryDate}
                onChange={(e) => set({ expiryDate: e.target.value })}
                className={input}
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* Summary sticks while scrolling the form. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-line p-5">
          <p className="label text-fg-3">Customers get</p>
          <p className="mt-3 font-head text-3xl font-extrabold uppercase leading-[0.95] [font-stretch:70%]">
            {describeDiscount(preview)}
          </p>
          <p className="mt-3 text-sm text-fg-2">{describeRules(preview)}</p>
          {form.code ? (
            <p className="mt-4 inline-block border border-dashed border-fg px-3 py-1.5 font-mono text-sm tracking-widest">
              {form.code}
            </p>
          ) : null}
          <div className="mt-5 border-t border-line pt-4">
            <Check
              checked={form.isActive}
              onChange={(v) => set({ isActive: v })}
              label="Active"
              hint="Turn off to pause the code without deleting it."
            />
          </div>
          <button
            type="submit"
            disabled={saving || (!!id && !dirty)}
            className={buttonClass(
              id && !dirty ? "outline" : "solid",
              "md",
              "mt-4 w-full",
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {id ? (dirty ? "Save changes" : "Saved") : "Create coupon"}
          </button>
        </div>
      </aside>
    </form>
  );
}
