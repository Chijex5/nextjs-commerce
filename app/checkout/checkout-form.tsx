"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import { LocationSelectGroup } from "components/locations/location-select-group";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import { identifyUser } from "lib/analytics/tiktok-pixel";
import {
  type CheckoutField,
  type FieldErrors,
  normalizeNigerianPhone,
  validateField,
} from "lib/checkout/details";
import { formatDeliveryRange } from "lib/checkout/delivery-estimate";
import type { CheckoutQuote } from "lib/checkout/quote";
import {
  getCouponCustomerKey,
  getStoredCoupon,
  saveStoredCoupon,
} from "lib/coupon-storage";
import { normalizeLocationName } from "lib/locations";
import { ChevronDown, Lock, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

export type CheckoutPrefill = {
  email: string;
  phone1: string;
  phone2: string;
  firstName: string;
  lastName: string;
  state: string;
  lga: string;
  ward: string;
  streetAddress: string;
  landmark: string;
};

type Values = CheckoutPrefill;

const EMPTY: Values = {
  email: "",
  phone1: "",
  phone2: "",
  firstName: "",
  lastName: "",
  state: "",
  lga: "",
  ward: "",
  streetAddress: "",
  landmark: "",
};

/** Details remembered on this device so the next order is one tap. */
const REMEMBER_KEY = "dfp-checkout-details";

/** Order of the fields on the page, for "jump to the first problem". */
const FIELD_ORDER: CheckoutField[] = [
  "email",
  "phone1",
  "phone2",
  "firstName",
  "lastName",
  "state",
  "lga",
  "streetAddress",
  "landmark",
];

/** What the ?error= codes from the redirect fallback mean to a shopper. */
const RETURN_ERRORS: Record<string, string> = {
  payment_failed:
    "Your payment didn't go through. Nothing was charged — try again or use another method.",
  payment_amount_mismatch:
    "We couldn't match that payment to your bag. If you were charged, we'll sort it out — reply to any of our emails.",
  verification_failed:
    "We couldn't confirm your payment yet. If you were charged, your order will appear by email shortly; otherwise try again.",
};

const naira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (
        accessCode: string,
        callbacks: {
          onSuccess?: (tx: { reference: string }) => void;
          onCancel?: () => void;
          onError?: (error: { message?: string }) => void;
        },
      ) => void;
    };
  }
}

export function CheckoutForm({
  cartId,
  initialQuote,
  prefill,
  signedIn,
  userId,
  returnError,
}: {
  cartId: string;
  initialQuote: CheckoutQuote;
  prefill: CheckoutPrefill | null;
  signedIn: boolean;
  userId: string | null;
  returnError: string | null;
}) {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [values, setValues] = useState<Values>(prefill ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPhone2, setShowPhone2] = useState(Boolean(prefill?.phone2));
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);

  const [quote, setQuote] = useState(initialQuote);
  const [quoting, setQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    returnError
      ? (RETURN_ERRORS[returnError] ?? RETURN_ERRORS.verification_failed!)
      : null,
  );
  const [summaryOpen, setSummaryOpen] = useState(false);

  const fieldRefs = useRef<Partial<Record<CheckoutField, HTMLElement | null>>>(
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Remembered details (guests) and a coupon carried over from the bag.
  useEffect(() => {
    if (!prefill) {
      try {
        const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null");
        if (saved && typeof saved === "object") {
          setValues((v) => ({ ...v, ...pickValues(saved) }));
          if (saved.phone2) setShowPhone2(true);
        }
      } catch {
        /* nothing remembered */
      }
    }
    const stored = getStoredCoupon(cartId, getCouponCustomerKey(userId));
    if (stored?.code) setCouponCode(stored.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (field: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    // Clear an error as soon as the field is fixed; don't nag while typing.
    if (errors[field as CheckoutField]) {
      const message = validateField(field as CheckoutField, value);
      setErrors((e) => ({ ...e, [field]: message }));
    }
  };

  const touch = (field: CheckoutField) => {
    const message = validateField(field, values[field]);
    setErrors((e) => ({ ...e, [field]: message }));
    if (field === "email" && !message) {
      void identifyUser({ email: values.email.trim() });
    }
  };

  // ── Live quote: shipping, coupon, delivery date, bag problems ──────────
  const showWard = normalizeLocationName(values.lga) === "ojo";
  const bagSignature = useMemo(
    () =>
      (cart?.lines ?? [])
        .map((l) => `${l.merchandise.id}:${l.quantity}`)
        .join(","),
    [cart?.lines],
  );
  const firstRender = useRef(true);
  const lastBag = useRef(bagSignature);

  useEffect(() => {
    if (firstRender.current && !couponCode) {
      firstRender.current = false;
      return; // the server already priced the starting state
    }
    firstRender.current = false;
    // After a bag edit, give the bag a moment to sync to the server first.
    const bagChanged = lastBag.current !== bagSignature;
    lastBag.current = bagSignature;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setQuoting(true);
        try {
          const res = await fetch("/api/checkout/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: {
                state: values.state,
                lga: values.lga,
                ward: showWard ? values.ward : "",
              },
              couponCode,
            }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (data?.quote) applyQuote(data.quote);
        } catch {
          /* superseded or offline; the next change re-quotes */
        } finally {
          if (!controller.signal.aborted) setQuoting(false);
        }
      },
      bagChanged ? 900 : 250,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.state, values.lga, values.ward, couponCode, bagSignature]);

  const applyQuote = useCallback(
    (next: CheckoutQuote) => {
      setQuote(next);
      if (couponCode && next.couponError) {
        setCouponMessage(`${couponCode.toUpperCase()}: ${next.couponError}`);
        setCouponCode(null);
        setShowCoupon(true);
      } else if (next.coupon) {
        setCouponMessage(null);
        saveStoredCoupon({
          code: next.coupon.code,
          cartId,
          customerKey: getCouponCustomerKey(userId),
          discountAmount: next.discount,
        });
      }
    },
    [couponCode, cartId, userId],
  );

  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponMessage(null);
    setCouponCode(code);
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponInput("");
    try {
      localStorage.removeItem("appliedCoupon");
    } catch {}
  };

  // ── Pay ─────────────────────────────────────────────────────────────────
  const focusFirst = (errs: FieldErrors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (!first) return;
    if (first === "phone2") setShowPhone2(true);
    const el =
      fieldRefs.current[first] ??
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const verify = async (reference: string) => {
    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.orderNumber) {
        finish(data.orderNumber);
        return;
      }
      if (res.status === 409) {
        setNotice(
          RETURN_ERRORS[data.error] ?? RETURN_ERRORS.verification_failed!,
        );
        setPaying(false);
        return;
      }
    } catch {
      /* fall through to the server-side check */
    }
    // Let the server finish the job (and redirect) if the browser couldn't.
    window.location.href = `/api/checkout/verify?reference=${encodeURIComponent(reference)}`;
  };

  const finish = (orderNumber: string) => {
    try {
      localStorage.removeItem("appliedCoupon");
    } catch {}
    clearCart();
    router.replace(
      `/checkout/success?order=${encodeURIComponent(orderNumber)}`,
    );
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (paying) return;
    setNotice(null);

    const errs: FieldErrors = {};
    for (const f of FIELD_ORDER) {
      if (f === "phone2" && !showPhone2) continue;
      const message = validateField(f, values[f]);
      if (message) errs[f] = message;
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirst(errs);
      return;
    }

    setPaying(true);
    const details = {
      email: values.email,
      phone1: values.phone1,
      phone2: showPhone2 ? values.phone2 : "",
      address: {
        firstName: values.firstName,
        lastName: values.lastName,
        state: values.state,
        lga: values.lga,
        ward: showWard ? values.ward : "",
        streetAddress: values.streetAddress,
        landmark: values.landmark,
      },
    };
    try {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ ...pickValues(values), phone2: details.phone2 }),
      );
    } catch {}

    let data: Record<string, any> = {};
    let status = 0;
    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          notes,
          couponCode,
          acceptsMarketing,
          saveAddress: signedIn && saveAddress,
          expectedAmountInKobo: quote.amountInKobo,
        }),
      });
      status = res.status;
      data = await res.json().catch(() => ({}));
    } catch {
      setNotice("You seem to be offline. Check your connection and try again.");
      setPaying(false);
      return;
    }

    if (status === 400 && data.fieldErrors) {
      setErrors(data.fieldErrors);
      focusFirst(data.fieldErrors);
      setPaying(false);
      return;
    }
    if (status === 409 && data.quote) {
      applyQuote(data.quote);
      setNotice(
        data.code === "price_changed"
          ? `Your total is now ${naira(data.quote.total)}. Check it, then press Pay again.`
          : data.code === "bag_changed"
            ? "Something in your bag just changed — see below, then press Pay again."
            : (data.error ?? "Please check your order and try again."),
      );
      setSummaryOpen(true);
      setPaying(false);
      return;
    }
    if (data.freeCheckout && data.orderNumber) {
      finish(data.orderNumber);
      return;
    }
    if (!data.accessCode && !data.authorizationUrl) {
      setNotice(
        data.error ?? "We couldn't start the payment. Please try again.",
      );
      setPaying(false);
      return;
    }

    // Pay without leaving the page; fall back to Paystack's own page.
    if (window.PaystackPop && data.accessCode) {
      try {
        new window.PaystackPop().resumeTransaction(data.accessCode, {
          onSuccess: (tx) => void verify(tx.reference || data.reference),
          onCancel: () => {
            setPaying(false);
            setNotice(
              "Payment cancelled — nothing was charged. Your details are saved; press Pay when you're ready.",
            );
          },
          onError: () => {
            window.location.href = data.authorizationUrl;
          },
        });
        return;
      } catch {
        /* fall back to redirect */
      }
    }
    window.location.href = data.authorizationUrl;
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const shippingKnown = quote.shipping !== null;
  const blocked = quote.issues.length > 0 || quote.lines.length === 0;
  const payLabel = paying
    ? "Opening secure payment…"
    : quote.total === 0 && quote.coupon
      ? "Place order"
      : `Pay ${naira(quote.total)}`;

  const errorText = (f: CheckoutField) => errors[f];
  const fieldProps = (f: CheckoutField) => ({
    name: f,
    value: values[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(f, e.target.value),
    onBlur: () => touch(f),
    error: Boolean(errors[f]),
    ref: (el: HTMLInputElement | null) => {
      fieldRefs.current[f] = el;
    },
  });

  const summary = (
    <OrderSummary
      quote={quote}
      quoting={quoting}
      shippingKnown={shippingKnown}
      couponCode={couponCode}
      couponInput={couponInput}
      setCouponInput={setCouponInput}
      showCoupon={showCoupon}
      setShowCoupon={setShowCoupon}
      couponMessage={couponMessage}
      applyCoupon={applyCoupon}
      removeCoupon={removeCoupon}
    />
  );

  return (
    <>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="lazyOnload" />

      <div className="flex items-end justify-between gap-4 border-b-4 border-fg pb-4">
        <h1 className="display text-[clamp(3rem,9vw,6rem)]">Checkout</h1>
        <p className="label mb-2 hidden items-center gap-1.5 text-fg-3 sm:flex">
          <Lock className="size-3.5" aria-hidden /> Secure · Paystack
        </p>
      </div>

      {/* Phones: the bag folds away above the form. */}
      <div className="border-b border-line lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between py-4 text-left"
        >
          <span className="label flex items-center gap-2">
            {summaryOpen ? "Hide" : "Show"} bag ({quote.itemCount})
            <ChevronDown
              className={clsx(
                "size-4 transition-transform",
                summaryOpen && "rotate-180",
              )}
              aria-hidden
            />
          </span>
          <span className="font-semibold tabular-nums">
            {naira(quote.total)}
          </span>
        </button>
        {summaryOpen ? <div className="pb-6">{summary}</div> : null}
      </div>

      {notice ? (
        <p
          role="alert"
          className="mt-6 border-l-4 border-fg bg-fg/5 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <form
          id="checkout-form"
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="space-y-12"
        >
          <Section number="01" title="Contact">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              placeholder="e.g. ada@gmail.com"
              hint={
                errorText("email") ?? "Your receipt and order updates go here."
              }
              {...fieldProps("email")}
            />
            <PhoneField
              label="Phone"
              required
              hint={
                errorText("phone1") ??
                "The rider calls this number when they arrive."
              }
              autoComplete="tel-national"
              {...fieldProps("phone1")}
            />
            {showPhone2 ? (
              <PhoneField
                label="Another phone (optional)"
                hint={
                  errorText("phone2") ?? "In case we can't reach the first."
                }
                {...fieldProps("phone2")}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowPhone2(true)}
                className="label text-fg-3 underline-offset-4 hover:text-fg hover:underline"
              >
                + Add another number
              </button>
            )}
          </Section>

          <Section number="02" title="Delivery">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="First name"
                autoComplete="given-name"
                required
                hint={errorText("firstName")}
                {...fieldProps("firstName")}
              />
              <Field
                label="Last name"
                autoComplete="family-name"
                required
                hint={errorText("lastName")}
                {...fieldProps("lastName")}
              />
            </div>
            <LocationSelectGroup
              stateValue={values.state}
              lgaValue={values.lga}
              wardValue={values.ward}
              showWard={showWard}
              wardLabel="Area in Ojo (optional — Iba ships cheaper)"
              onStateChange={(value, source) => {
                setValues((v) => ({
                  ...v,
                  state: value,
                  ...(source === "select" && value !== v.state
                    ? { lga: "", ward: "" }
                    : {}),
                }));
                if (errors.state && value)
                  setErrors((e) => ({ ...e, state: undefined }));
              }}
              onLgaChange={(value, source) => {
                setValues((v) => ({
                  ...v,
                  lga: value,
                  ...(source === "select" ? { ward: "" } : {}),
                }));
                if (errors.lga && value)
                  setErrors((e) => ({ ...e, lga: undefined }));
              }}
              onWardChange={(value) =>
                setValues((v) => ({ ...v, ward: value }))
              }
              onStateBlur={() => touch("state")}
              onLgaBlur={() => touch("lga")}
              stateError={errors.state}
              lgaError={errors.lga}
              stateRequired
              lgaRequired
              labelClassName="label !mb-1 !text-[11px] !font-normal !text-fg-3"
              inputClassName="!h-12 !rounded-none !border-0 !border-b !border-line !bg-transparent !px-0 !py-0 !text-base !text-fg !shadow-none focus:!border-fg focus:!ring-0 placeholder:!text-fg-3"
              menuClassName="!rounded-none !border-line !bg-canvas !shadow-none"
            />
            <Field
              label="House number and street"
              autoComplete="address-line1"
              required
              placeholder="e.g. 14 Admiralty Way"
              hint={errorText("streetAddress")}
              {...fieldProps("streetAddress")}
            />
            <Field
              label="Landmark or bus stop"
              autoComplete="off"
              required
              placeholder="e.g. opposite First Bank, Obalende bus stop"
              hint={
                errorText("landmark") ??
                "What a rider would look for to find you."
              }
              {...fieldProps("landmark")}
            />
            {showNotes ? (
              <div>
                <label htmlFor="notes" className="label mb-1 block text-fg-3">
                  Note for us (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Gate code, best time to call, a gift message…"
                  className="w-full resize-y border border-line bg-transparent p-3 text-base outline-none focus:border-fg"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="label block text-fg-3 underline-offset-4 hover:text-fg hover:underline"
              >
                + Add a note
              </button>
            )}
          </Section>

          <Section number="03" title="Pay">
            <ul className="space-y-2 text-sm text-fg-2">
              <li>
                Pay by <strong className="text-fg">bank transfer</strong>, card
                or USSD in a secure Paystack window — you stay on this page.
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {shippingKnown ? (
                    <>
                      Arrives{" "}
                      <strong className="text-fg">
                        {formatDeliveryRange(quote.delivery)}
                      </strong>
                      {quote.delivery.productionDays > 0
                        ? ` — made by hand for you first (about ${quote.delivery.productionDays} days).`
                        : "."}
                    </>
                  ) : (
                    "Choose your state to see when it arrives."
                  )}
                </span>
              </li>
            </ul>

            <div className="space-y-3">
              {signedIn ? (
                <Checkbox checked={saveAddress} onChange={setSaveAddress}>
                  Save these details to my account
                </Checkbox>
              ) : null}
              <Checkbox
                checked={acceptsMarketing}
                onChange={setAcceptsMarketing}
              >
                Email me new drops and offers (no spam, unsubscribe anytime)
              </Checkbox>
            </div>

            <button
              type="submit"
              disabled={paying || blocked}
              className={buttonClass("solid", "lg", "hidden w-full lg:flex")}
            >
              {paying ? null : <Lock className="size-4" aria-hidden />}
              {payLabel}
            </button>
            <p className="text-xs text-fg-3">
              By paying you agree to our{" "}
              <Link href="/terms-conditions" className="underline">
                terms
              </Link>
              . Questions? We&apos;re on WhatsApp and email — see{" "}
              <Link href="/contact" className="underline">
                contact
              </Link>
              .
            </p>
          </Section>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-24">{summary}</div>
        </aside>
      </div>

      {/* Phones: total and Pay always in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-fg-3">
            Total{shippingKnown ? "" : " (before delivery)"}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {naira(quote.total)}
          </span>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={paying || blocked}
          className={buttonClass("solid", "lg", "w-full")}
        >
          {paying ? null : <Lock className="size-4" aria-hidden />}
          {payLabel}
        </button>
      </div>
    </>
  );
}

const pickValues = (raw: Record<string, unknown>): Partial<Values> => {
  const out: Partial<Values> = {};
  for (const key of Object.keys(EMPTY) as (keyof Values)[]) {
    if (typeof raw[key] === "string") out[key] = raw[key] as string;
  }
  return out;
};

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${number}`}>
      <div className="mb-6 flex items-baseline gap-3 border-b border-fg pb-2">
        <span className="label text-fg-3">{number}</span>
        <h2
          id={`step-${number}`}
          className="display text-[clamp(1.75rem,4vw,2.5rem)]"
        >
          {title}
        </h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

/** Nigerian mobile with a fixed +234 prefix; accepts 0803…, 803… or +234… */
function PhoneField({
  label,
  hint,
  error,
  ref,
  onChange,
  value,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  hint?: string;
  error?: boolean;
  value: string;
  ref?: React.Ref<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = `phone-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="label mb-1 block text-fg-3">
        {label}
        {props.required ? <span aria-hidden> *</span> : null}
      </label>
      <div
        className={clsx(
          "flex h-12 items-center border-b transition-colors focus-within:border-fg",
          error ? "border-red-600" : "border-line",
        )}
      >
        <span className="pr-2 text-base text-fg-3">+234</span>
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="tel"
          placeholder="803 123 4567"
          aria-invalid={error || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={value}
          onChange={(e) => {
            // Keep just the 10 national digits, however it was typed or
            // pasted (0803…, +234 803…, 803 123 4567).
            e.target.value = normalizeNigerianPhone(e.target.value).slice(
              0,
              10,
            );
            onChange(e);
          }}
          className="h-full w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-3"
          {...props}
        />
      </div>
      {hint ? (
        <p
          id={`${id}-hint`}
          className={clsx(
            "mt-1.5 text-xs",
            error ? "text-red-600" : "text-fg-3",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-fg-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-current"
      />
      <span>{children}</span>
    </label>
  );
}

function OrderSummary({
  quote,
  quoting,
  shippingKnown,
  couponCode,
  couponInput,
  setCouponInput,
  showCoupon,
  setShowCoupon,
  couponMessage,
  applyCoupon,
  removeCoupon,
}: {
  quote: CheckoutQuote;
  quoting: boolean;
  shippingKnown: boolean;
  couponCode: string | null;
  couponInput: string;
  setCouponInput: (v: string) => void;
  showCoupon: boolean;
  setShowCoupon: (v: boolean) => void;
  couponMessage: string | null;
  applyCoupon: () => void;
  removeCoupon: () => void;
}) {
  return (
    <div className="border border-line p-5 sm:p-6">
      <p className="label mb-4 text-fg-3">
        Your bag · {quote.itemCount} {quote.itemCount === 1 ? "item" : "items"}
      </p>

      {quote.issues.length ? (
        <ul
          role="alert"
          className="mb-4 space-y-1 border-l-4 border-red-600 pl-3 text-sm"
        >
          {quote.issues.map((issue) => (
            <li key={issue.variantId}>
              <strong>{issue.productTitle}</strong>{" "}
              {issue.kind === "insufficient_stock"
                ? `— only ${issue.available} left. Lower the quantity in your bag.`
                : "— just sold out. Remove it from your bag to continue."}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="divide-y divide-line">
        {quote.lines.map((line) => (
          <li key={line.lineId} className="flex gap-4 py-3">
            <div className="relative size-16 shrink-0 overflow-hidden bg-fg/5">
              {line.image ? (
                <Image
                  src={line.image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : null}
              <span className="absolute right-0 top-0 grid size-5 place-items-center bg-fg text-[10px] font-semibold text-canvas">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold uppercase">
                {line.productTitle}
              </p>
              <p className="text-xs text-fg-3">{line.variantTitle}</p>
            </div>
            <p className="text-sm tabular-nums">{naira(line.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line pt-4">
        {couponCode && quote.coupon ? (
          <div className="flex items-center justify-between text-sm">
            <span>
              <span className="label">{quote.coupon.code}</span> applied
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-xs text-fg-3 underline hover:text-fg"
            >
              Remove
            </button>
          </div>
        ) : showCoupon ? (
          <div>
            <div className="flex gap-2">
              <label htmlFor="coupon" className="sr-only">
                Discount code
              </label>
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
                placeholder="Discount code"
                autoCapitalize="characters"
                className="h-11 min-w-0 flex-1 border border-line bg-transparent px-3 text-base uppercase outline-none focus:border-fg"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={!couponInput.trim() || quoting}
                className={buttonClass("outline", "md", "h-11")}
              >
                Apply
              </button>
            </div>
            {couponMessage ? (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {couponMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCoupon(true)}
            className="text-sm text-fg-3 underline-offset-4 hover:text-fg hover:underline"
          >
            Have a discount code?
          </button>
        )}
      </div>

      <dl
        className={clsx(
          "mt-4 space-y-2 border-t border-line pt-4 text-sm transition-opacity",
          quoting && "opacity-60",
        )}
        aria-busy={quoting}
      >
        <Row label="Subtotal" value={naira(quote.subtotal)} />
        <Row
          label="Delivery"
          value={
            shippingKnown
              ? quote.shipping === 0
                ? "Free"
                : naira(quote.shipping!)
              : "Choose your state"
          }
          muted={!shippingKnown}
        />
        {quote.discount > 0 ? (
          <Row
            label={`Discount${quote.coupon ? ` (${quote.coupon.code})` : ""}`}
            value={`−${naira(quote.discount)}`}
          />
        ) : null}
        <div className="flex items-baseline justify-between border-t border-fg pt-3">
          <dt className="label">Total</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {naira(quote.total)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-fg-3">
        Prices in Naira. What you see here is exactly what you pay.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-fg-2">{label}</dt>
      <dd className={clsx("tabular-nums", muted && "text-fg-3")}>{value}</dd>
    </div>
  );
}
