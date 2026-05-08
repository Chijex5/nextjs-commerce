"use client";

import LoadingDots from "components/loading-dots";
import {
  LocationSelectGroup,
  type LocationChangeSource,
} from "components/locations/location-select-group";
import PageLoader from "components/page-loader";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import { identifyUser } from "lib/analytics/tiktok-pixel";
import {
  getCouponCustomerKey,
  getStoredCoupon,
  migrateGuestCouponToUser,
} from "lib/coupon-storage";
import { normalizeLocationName } from "lib/locations";
import { calculateShippingAmount } from "lib/shipping";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ORDER_NOTE_STORAGE_KEY = "orderNote";
const DEV_COUPON_DEBUG = process.env.NODE_ENV !== "production";

function logCouponDebug(message: string, payload?: unknown) {
  if (!DEV_COUPON_DEBUG) return;
  console.debug(`[coupon][checkout] ${message}`, payload);
}

interface CartItem {
  id?: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    selectedOptions: Array<{ name: string; value: string }>;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: { url: string; altText: string };
    };
  };
  cost: { totalAmount: { amount: string; currencyCode: string } };
}

interface Cart {
  id?: string;
  lines: CartItem[];
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
    totalTaxAmount: { amount: string; currencyCode: string };
  };
}

interface Address {
  firstName: string;
  lastName: string;
  streetAddress: string;
  nearestBusStop: string;
  landmark: string;
  ward: string;
  lga: string;
  state: string;
  phone1: string;
  phone2: string;
  country: string;
}

interface CheckoutFormData {
  email: string;
  shippingAddress: Address;
  billingAddress: Address;
  saveAddress: boolean;
  useSameAddress: boolean;
}

type AddressType = "shippingAddress" | "billingAddress";
type Step = "contact" | "shipping" | "review";

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: "contact", label: "Contact", short: "1" },
  { id: "shipping", label: "Delivery", short: "2" },
  { id: "review", label: "Review", short: "3" },
];

const emptyAddress: Address = {
  firstName: "",
  lastName: "",
  streetAddress: "",
  nearestBusStop: "",
  landmark: "",
  ward: "",
  lga: "",
  state: "",
  phone1: "",
  phone2: "",
  country: "Nigeria",
};

/* ── Phone number normalization ─────────────────────────── */
/**
 * Strips leading 0 (and the +234 prefix if pasted in),
 * removes all non-digits, then caps at 10 characters.
 *
 * Valid Nigerian mobile numbers after +234 are 10 digits,
 * never starting with 0.  e.g. 08012345678 → 8012345678
 */
function normalizePhone(raw: string): string {
  // Remove all non-digits first
  let digits = raw.replace(/\D/g, "");
  // Strip country code if someone pasted +2348012345678
  if (digits.startsWith("234") && digits.length > 10) {
    digits = digits.slice(3);
  }
  // Strip leading zero
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  // Cap at 10 digits
  return digits.slice(0, 10);
}

function PhoneValidationHint({ value }: { value: string }) {
  if (!value) return null;
  const isValid = value.length === 10 && !value.startsWith("0");
  if (isValid) return null;
  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans), sans-serif",
        fontSize: "0.62rem",
        color: "var(--dp-ember)",
        marginTop: "0.3rem",
      }}
    >
      {value.startsWith("0")
        ? "Skip the leading 0 — we add +234 automatically"
        : value.length < 10
          ? `${10 - value.length} more digit${10 - value.length === 1 ? "" : "s"} needed`
          : null}
    </p>
  );
}

/* ── Shared input style ─────────────────────────────────── */
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(242,232,213,0.04)",
  border: "1px solid rgba(242,232,213,0.09)",
  color: "var(--dp-cream)",
  fontFamily: "var(--font-dm-sans), sans-serif",
  fontSize: "0.82rem",
  padding: "0.65rem 0.75rem",
  outline: "none",
  transition: "border-color 0.2s",
};

const PHONE_PREFIX_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  flexShrink: 0,
  padding: "0.65rem 0.75rem",
  background: "rgba(242,232,213,0.03)",
  border: "1px solid rgba(242,232,213,0.09)",
  borderRight: "none",
  fontFamily: "var(--font-dm-sans), sans-serif",
  fontSize: "0.78rem",
  color: "var(--dp-muted)",
};

function DPInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...INPUT_STYLE, ...props.style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--dp-ember)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(242,232,213,0.09)";
        props.onBlur?.(e);
      }}
    />
  );
}

function SectionCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--dp-charcoal)",
        border: "1px solid var(--dp-border)",
        padding: "1.5rem clamp(1.25rem,3vw,2rem)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.6rem",
          fontWeight: 500,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: "var(--dp-ember)",
          marginBottom: "1.25rem",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      style={{
        display: "block",
        fontFamily: "var(--font-dm-sans), sans-serif",
        fontSize: "0.68rem",
        fontWeight: 500,
        letterSpacing: "0.08em",
        color: "var(--dp-muted)",
        marginBottom: "0.4rem",
      }}
    >
      {children}
      {required && (
        <span style={{ color: "var(--dp-ember)", marginLeft: 2 }}>*</span>
      )}
    </label>
  );
}

function PhoneField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ display: "flex" }}>
        <span style={PHONE_PREFIX_STYLE}>
          <span style={{ fontSize: "1rem" }}>🇳🇬</span>
          <span>+234</span>
        </span>
        <DPInput
          type="tel"
          required={required}
          value={value}
          onChange={(e) => onChange(normalizePhone(e.target.value))}
          placeholder={placeholder ?? "801 2345 678"}
          maxLength={10}
          style={{ ...INPUT_STYLE, flex: 1, borderLeft: "none" }}
        />
      </div>
      <PhoneValidationHint value={value} />
    </div>
  );
}

function AddressFields({
  type,
  formData,
  handleInputChange,
  handleLocationChange,
}: {
  type: AddressType;
  formData: CheckoutFormData;
  handleInputChange: (
    field: string,
    value: string | boolean,
    addressType?: AddressType,
  ) => void;
  handleLocationChange: (
    addressType: AddressType,
    field: "state" | "lga" | "ward",
    value: string,
    source: LocationChangeSource,
  ) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
        className="sm:grid-cols-2"
      >
        <div>
          <FieldLabel required>First Name</FieldLabel>
          <DPInput
            title="first-name"
            type="text"
            required
            value={formData[type].firstName}
            onChange={(e) =>
              handleInputChange("firstName", e.target.value, type)
            }
          />
        </div>
        <div>
          <FieldLabel required>Last Name</FieldLabel>
          <DPInput
            title="last-name"
            type="text"
            required
            value={formData[type].lastName}
            onChange={(e) =>
              handleInputChange("lastName", e.target.value, type)
            }
          />
        </div>
      </div>

      <LocationSelectGroup
        stateValue={formData[type].state}
        lgaValue={formData[type].lga}
        wardValue={formData[type].ward}
        onStateChange={(v, s) => handleLocationChange(type, "state", v, s)}
        onLgaChange={(v, s) => handleLocationChange(type, "lga", v, s)}
        onWardChange={(v, s) => handleLocationChange(type, "ward", v, s)}
        inputClassName="dp-location-input"
        menuClassName="dp-location-menu"
        stateRequired
        lgaRequired
      />

      <div>
        <FieldLabel required>Street Address</FieldLabel>
        <DPInput
          type="text"
          required
          value={formData[type].streetAddress}
          onChange={(e) =>
            handleInputChange("streetAddress", e.target.value, type)
          }
          placeholder="House number and street name"
        />
      </div>
      <div>
        <FieldLabel required>Nearest Bus Stop / Junction</FieldLabel>
        <DPInput
          type="text"
          required
          value={formData[type].nearestBusStop}
          onChange={(e) =>
            handleInputChange("nearestBusStop", e.target.value, type)
          }
          placeholder="e.g., Obalende Bus Stop"
        />
      </div>
      <div>
        <FieldLabel required>Closest Landmark</FieldLabel>
        <DPInput
          type="text"
          required
          value={formData[type].landmark}
          onChange={(e) => handleInputChange("landmark", e.target.value, type)}
          placeholder="e.g., Opposite First Bank, Beside Redeemed Church"
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
        className="sm:grid-cols-2"
      >
        <PhoneField
          label="Phone Number 1"
          required
          value={formData[type].phone1}
          onChange={(v) => handleInputChange("phone1", v, type)}
          placeholder="801 2345 678"
        />
        <PhoneField
          label="Phone Number 2"
          required
          value={formData[type].phone2}
          onChange={(v) => handleInputChange("phone2", v, type)}
          placeholder="802 3456 789"
        />
      </div>
    </div>
  );
}

/* ── Step indicator ─────────────────────────────────────── */
function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
}: {
  currentStep: Step;
  onStepClick: (step: Step) => void;
  completedSteps: Set<Step>;
}) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: "2rem",
      }}
    >
      {STEPS.map((step, i) => {
        const isDone = completedSteps.has(step.id);
        const isCurrent = step.id === currentStep;
        const isClickable = isDone || i < currentIdx;
        return (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}
          >
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "none",
                cursor: isClickable ? "pointer" : "default",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${isCurrent ? "var(--dp-ember)" : isDone ? "var(--dp-green)" : "var(--dp-border)"}`,
                  background: isCurrent
                    ? "var(--dp-ember)"
                    : isDone
                      ? "rgba(74,140,92,0.15)"
                      : "transparent",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: isCurrent
                    ? "var(--dp-cream)"
                    : isDone
                      ? "var(--dp-green)"
                      : "var(--dp-muted)",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {isDone ? "✓" : step.short}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: isCurrent ? 500 : 400,
                  color: isCurrent
                    ? "var(--dp-cream)"
                    : isDone
                      ? "var(--dp-sand)"
                      : "var(--dp-muted)",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  margin: "0 0.75rem",
                  background: isDone
                    ? "var(--dp-green)"
                    : "var(--dp-border)",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Review summary row ─────────────────────────────────── */
function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "0.4rem 0",
        borderBottom: "1px solid var(--dp-border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.65rem",
          color: "var(--dp-muted)",
          minWidth: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.72rem",
          color: "var(--dp-sand)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useUserSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("contact");
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [couponData, setCouponData] = useState<{
    code: string;
    amount: number;
    productDiscountAmount: number;
    shippingDiscountAmount: number;
    includeShippingInDiscount: boolean;
    grantsFreeShipping: boolean;
  } | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const tiktokIdentifyKeyRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    shippingAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    saveAddress: false,
    useSameAddress: true,
  });

  useEffect(() => {
    void fetchCart();
    if (session) void fetchUserAddresses();
  }, [session]);
  useEffect(() => {
    try {
      const n = localStorage.getItem(ORDER_NOTE_STORAGE_KEY);
      if (n) setOrderNote(n);
    } catch {}
  }, []);
  useEffect(() => {
    const email = formData.email?.trim();
    if (!email) return;
    const key = email;
    if (key === tiktokIdentifyKeyRef.current) return;
    tiktokIdentifyKeyRef.current = key;
    identifyUser({ email: email || undefined });
  }, [formData.email]);

  const loadCouponData = async (cartId: string, cartTotal: number) => {
    if (!cartId) { setCouponData(null); return; }
    try {
      const customerKey = getCouponCustomerKey(session?.id);
      let coupon = getStoredCoupon(cartId, customerKey);
      if (!coupon && session?.id)
        coupon = migrateGuestCouponToUser(cartId, session.id);
      if (coupon) {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: coupon.code, cartTotal }),
        });
        if (response.ok) {
          const data = await response.json();
          setCouponData({
            code: data.coupon.code,
            amount: data.coupon.discountAmount,
            productDiscountAmount: data.coupon.productDiscountAmount || 0,
            shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
            includeShippingInDiscount: Boolean(data.coupon.includeShippingInDiscount),
            grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
          });
        } else {
          logCouponDebug("Initial load validation failed", { cartId });
          setCouponData(null);
        }
      } else {
        setCouponData(null);
      }
    } catch (err) {
      logCouponDebug("Initial load validation error", { cartId, error: err instanceof Error ? err.message : String(err) });
      setCouponData(null);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch("/api/user-auth/addresses");
      if (response.ok) {
        const data = await response.json();
        const norm = (input?: Partial<Address>): Address => ({ ...emptyAddress, ...(input || {}) });
        setFormData((prev) => ({
          ...prev,
          email: session?.email || "",
          shippingAddress: norm(data.addresses.shippingAddress || prev.shippingAddress),
          billingAddress: norm(data.addresses.billingAddress || prev.billingAddress),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        if (!data.cart || data.cart.lines.length === 0) {
          toast.error("Your cart is empty");
          router.push("/");
          return;
        }
        setCart(data.cart);
        if (data.cart?.id)
          await loadCouponData(data.cart.id, parseFloat(data.cart.cost.subtotalAmount.amount));
        else setCouponData(null);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean,
    addressType?: AddressType,
  ) => {
    if (addressType)
      setFormData((prev) => ({ ...prev, [addressType]: { ...prev[addressType], [field]: value } }));
    else setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (
    addressType: AddressType,
    field: "state" | "lga" | "ward",
    value: string,
    source: LocationChangeSource,
  ) => {
    const changed = normalizeLocationName(formData[addressType][field] || "") !== normalizeLocationName(value);
    handleInputChange(field, value, addressType);
    if (source !== "select" || !changed) return;
    if (field === "state") {
      handleInputChange("lga", "", addressType);
      handleInputChange("ward", "", addressType);
    }
    if (field === "lga") handleInputChange("ward", "", addressType);
  };

  /* ── Step validation ──────────────────────────────────── */
  const isContactValid = () => {
    return formData.email.trim().length > 0;
  };

  const isShippingValid = () => {
    const a = formData.shippingAddress;
    return (
      a.firstName.trim() &&
      a.lastName.trim() &&
      a.state.trim() &&
      a.lga.trim() &&
      a.streetAddress.trim() &&
      a.nearestBusStop.trim() &&
      a.landmark.trim() &&
      a.phone1.length === 10 &&
      (!a.phone2 || a.phone2.length === 10)
    );
  };

  const advanceStep = (from: Step) => {
    setCompletedSteps((prev) => new Set([...prev, from]));
    if (from === "contact") setCurrentStep("shipping");
    else if (from === "shipping") setCurrentStep("review");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === "contact") {
      if (!isContactValid()) { toast.error("Please fill in your email"); return; }
      advanceStep("contact");
      return;
    }
    if (currentStep === "shipping") {
      if (!isShippingValid()) { toast.error("Please complete all delivery fields"); return; }
      advanceStep("shipping");
      return;
    }
    // Final submit
    setSubmitting(true);
    try {
      // Phone numbers stored without leading zero, API expects with +234 prefix — we send raw 10-digit
      const checkoutData = {
        email: formData.email,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useSameAddress
          ? formData.shippingAddress
          : formData.billingAddress,
        saveAddress: formData.saveAddress,
        couponCode: couponData?.code,
        phone1: formData.shippingAddress.phone1,
        phone2: formData.shippingAddress.phone2,
        phone: formData.shippingAddress.phone1,
        notes: orderNote.trim() || undefined,
      };
      const response = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });
      const data = await response.json();
      if (response.ok && data.authorizationUrl)
        window.location.href = data.authorizationUrl;
      else if (response.ok && data.freeCheckout && data.orderNumber) {
        toast.success("Order placed successfully");
        router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
      } else toast.error(data.error || "Failed to initialize payment");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = parseFloat(cart?.cost.subtotalAmount.amount ?? "0");
  const discountAmount = couponData?.amount || 0;
  const totalQuantity = cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  const hasShippingState = Boolean(formData.shippingAddress.state?.trim());
  const shippingCost = hasShippingState
    ? calculateShippingAmount({
        address: formData.shippingAddress,
        subtotalAmount: subtotal,
        totalQuantity,
      })
    : 0;
  const shippingDiscountAmount = couponData?.shippingDiscountAmount || 0;
  const netShippingCost = Math.max(shippingCost - shippingDiscountAmount, 0);
  const totalDue = subtotal - discountAmount + shippingCost;
  const isFreeCheckout = totalDue <= 0;

  useEffect(() => {
    if (loading || !cart || !couponData?.code) return;
    const revalidate = async () => {
      const customerKey = getCouponCustomerKey(session?.id);
      const payload: { code: string; cartTotal: number; shippingAmount: number; sessionId?: string } = {
        code: couponData.code,
        cartTotal: subtotal,
        shippingAmount: shippingCost,
      };
      if (!session?.id) payload.sessionId = customerKey.replace("guest:", "");
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        logCouponDebug("Shipping revalidation failed", { cartId: cart.id, status: response.status });
        setCouponData(null);
        return;
      }
      const data = await response.json();
      setCouponData({
        code: data.coupon.code,
        amount: data.coupon.discountAmount,
        productDiscountAmount: data.coupon.productDiscountAmount || 0,
        shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
        includeShippingInDiscount: Boolean(data.coupon.includeShippingInDiscount),
        grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
      });
    };
    void revalidate();
  }, [loading, cart, couponData?.code, shippingCost, subtotal, session?.id]);

  if (loading) return <PageLoader size="lg" message="Loading checkout..." />;
  if (!cart || cart.lines.length === 0) return null;

  const ctaLabel = currentStep === "contact"
    ? "Continue to Delivery →"
    : currentStep === "shipping"
      ? "Review Order →"
      : submitting
        ? null
        : isFreeCheckout
          ? "Place Order →"
          : "Proceed to Payment →";

  return (
    <>
      <style>{`
        :root {
          --dp-ink:     #0A0704;
          --dp-charcoal:#191209;
          --dp-card:    #1E1510;
          --dp-cream:   #F2E8D5;
          --dp-sand:    #C9B99A;
          --dp-muted:   #6A5A48;
          --dp-ember:   #BF5A28;
          --dp-gold:    #C0892A;
          --dp-green:   #4A8C5C;
          --dp-border:  rgba(242,232,213,0.09);
        }

        .dp-location-input {
          width: 100% !important;
          background: rgba(242,232,213,0.04) !important;
          border: 1px solid rgba(242,232,213,0.09) !important;
          border-radius: 0 !important;
          color: var(--dp-cream) !important;
          font-family: var(--font-dm-sans), sans-serif !important;
          font-size: 0.82rem !important;
          padding: 0.65rem 0.75rem !important;
          outline: none !important;
          transition: border-color 0.2s !important;
        }
        .dp-location-input:focus { border-color: var(--dp-ember) !important; }
        .dp-location-menu {
          background: var(--dp-charcoal) !important;
          border: 1px solid var(--dp-border) !important;
          border-radius: 0 !important;
        }

        .dp-checkbox {
          appearance: none;
          width: 1rem; height: 1rem; flex-shrink: 0;
          border: 1px solid var(--dp-border);
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: border-color 0.2s, background 0.2s;
        }
        .dp-checkbox:checked { background: var(--dp-ember); border-color: var(--dp-ember); }
        .dp-checkbox:checked::after {
          content: '';
          position: absolute; top: 2px; left: 5px;
          width: 4px; height: 7px;
          border: 1.5px solid var(--dp-cream);
          border-top: none; border-left: none;
          transform: rotate(45deg);
        }

        .dp-sum-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--dp-border);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          color: var(--dp-muted);
        }
        .dp-sum-row:last-child { border-bottom: none; }

        .dp-step-panel {
          animation: dp-rise 0.35s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ background: "var(--dp-ink)", color: "var(--dp-cream)", minHeight: "100vh", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, var(--dp-ember), var(--dp-gold) 50%, transparent 100%)" }} />

        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "3rem clamp(1rem,4vw,3rem) 5rem" }}>
          {/* Page header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--dp-ember)", marginBottom: "0.5rem" }}>
              D&apos;FOOTPRINT
            </p>
            <h1 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: "0.08em", color: "var(--dp-cream)", lineHeight: 1 }}>
              Checkout
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "2rem", alignItems: "start" }} className="lg:grid-cols-[1fr_380px]">

              {/* ── LEFT: Step forms ──────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <StepIndicator
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                  completedSteps={completedSteps}
                />

                {/* STEP 1 — Contact */}
                {currentStep === "contact" && (
                  <div key="contact" className="dp-step-panel">
                    <SectionCard label="Contact Information">
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <FieldLabel required>Email</FieldLabel>
                          <DPInput
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="your.email@example.com"
                          />
                        </div>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "var(--dp-muted)", lineHeight: 1.6, marginTop: "0.25rem" }}>
                          Your order confirmation and delivery updates will be sent here.
                        </p>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* STEP 2 — Delivery */}
                {currentStep === "shipping" && (
                  <div key="shipping" className="dp-step-panel">
                    <SectionCard label="Delivery Address">
                      <AddressFields
                        type="shippingAddress"
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleLocationChange={handleLocationChange}
                      />
                    </SectionCard>

                    {/* Billing toggle */}
                    <div style={{ background: "var(--dp-charcoal)", border: "1px solid var(--dp-border)", padding: "1.1rem 1.5rem", marginTop: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.useSameAddress}
                          onChange={(e) => handleInputChange("useSameAddress", e.target.checked)}
                          className="dp-checkbox"
                        />
                        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "var(--dp-sand)" }}>
                          Billing address same as shipping
                        </span>
                      </label>
                    </div>

                    {!formData.useSameAddress && (
                      <div style={{ marginTop: "1rem" }}>
                        <SectionCard label="Billing Address">
                          <AddressFields
                            type="billingAddress"
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleLocationChange={handleLocationChange}
                          />
                        </SectionCard>
                      </div>
                    )}

                    {session && (
                      <div style={{ background: "var(--dp-charcoal)", border: "1px solid var(--dp-border)", padding: "1.1rem 1.5rem", marginTop: "1rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={formData.saveAddress}
                            onChange={(e) => handleInputChange("saveAddress", e.target.checked)}
                            className="dp-checkbox"
                          />
                          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "var(--dp-sand)" }}>
                            Save this address to my account for future orders
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3 — Review */}
                {currentStep === "review" && (
                  <div key="review" className="dp-step-panel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <SectionCard label="Contact">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <ReviewRow label="Email" value={formData.email} />
                        <button
                          type="button"
                          onClick={() => setCurrentStep("contact")}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "var(--dp-ember)", letterSpacing: "0.08em", flexShrink: 0, padding: "0 0 0 1rem" }}
                        >
                          Edit
                        </button>
                      </div>
                    </SectionCard>

                    <SectionCard label="Delivery Address">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <ReviewRow label="Name" value={`${formData.shippingAddress.firstName} ${formData.shippingAddress.lastName}`} />
                          <ReviewRow label="Address" value={formData.shippingAddress.streetAddress} />
                          <ReviewRow label="Bus Stop" value={formData.shippingAddress.nearestBusStop} />
                          <ReviewRow label="Landmark" value={formData.shippingAddress.landmark} />
                          <ReviewRow label="LGA / State" value={`${formData.shippingAddress.lga}, ${formData.shippingAddress.state}`} />
                          <ReviewRow label="Phone 1" value={formData.shippingAddress.phone1 ? `+234 ${formData.shippingAddress.phone1}` : ""} />
                          <ReviewRow label="Phone 2" value={formData.shippingAddress.phone2 ? `+234 ${formData.shippingAddress.phone2}` : ""} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep("shipping")}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "var(--dp-ember)", letterSpacing: "0.08em", flexShrink: 0, padding: "0 0 0 1rem", alignSelf: "flex-start" }}
                        >
                          Edit
                        </button>
                      </div>
                    </SectionCard>

                    {/* Order note */}
                    <SectionCard label="Order Note (optional)">
                      <textarea
                        value={orderNote}
                        onChange={(e) => {
                          setOrderNote(e.target.value);
                          try { localStorage.setItem(ORDER_NOTE_STORAGE_KEY, e.target.value); } catch {}
                        }}
                        placeholder="Any special instructions for your order…"
                        rows={3}
                        style={{
                          ...INPUT_STYLE,
                          resize: "vertical",
                          minHeight: 80,
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--dp-ember)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(242,232,213,0.09)"; }}
                      />
                    </SectionCard>
                  </div>
                )}

                {/* Step CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "block",
                    width: "100%",
                    background: submitting ? "var(--dp-muted)" : "var(--dp-cream)",
                    color: "var(--dp-ink)",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    padding: "0.9rem",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontWeight: 500,
                    fontSize: "0.72rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--dp-ember)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-cream)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--dp-cream)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-ink)";
                    }
                  }}
                >
                  {submitting ? <LoadingDots className="bg-neutral-600" /> : ctaLabel}
                </button>
              </div>

              {/* ── RIGHT: Order summary ───────────────────── */}
              <div style={{ position: "sticky", top: "5.5rem" }}>
                <div style={{ background: "var(--dp-charcoal)", border: "1px solid var(--dp-border)" }}>
                  <div style={{ height: 2, background: "linear-gradient(90deg, var(--dp-ember), transparent 80%)" }} />
                  <div style={{ padding: "1.5rem" }}>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--dp-ember)", marginBottom: "1.1rem" }}>
                      Order Summary
                    </p>

                    {/* Cart items */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
                      {cart.lines.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0, background: "var(--dp-card)", overflow: "hidden" }}>
                            <Image src={item.merchandise.product.featuredImage.url} alt={item.merchandise.product.title} fill className="object-cover" />
                            <span style={{ position: "absolute", top: 2, right: 2, background: "var(--dp-ember)", color: "var(--dp-cream)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 600, padding: "1px 5px", lineHeight: 1.5 }}>
                              {item.quantity}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="line-clamp-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: "var(--dp-sand)", lineHeight: 1.35 }}>
                              {item.merchandise.product.title}
                            </p>
                            {item.merchandise.title && item.merchandise.title !== "Default Title" && (
                              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "var(--dp-muted)", marginTop: "0.15rem" }}>
                                {item.merchandise.title}
                              </p>
                            )}
                          </div>
                          <Price
                            amount={item.cost.totalAmount.amount}
                            currencyCode={item.cost.totalAmount.currencyCode}
                            currencyCodeClassName="hidden"
                            className="dp-wordmark"
                            style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "0.9rem", color: "var(--dp-cream)", flexShrink: 0 } as React.CSSProperties}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div style={{ borderTop: "1px solid var(--dp-border)", paddingTop: "0.875rem" }}>
                      <div className="dp-sum-row">
                        <span>Subtotal</span>
                        <Price amount={cart.cost.subtotalAmount.amount} currencyCode={cart.cost.subtotalAmount.currencyCode} currencyCodeClassName="hidden" style={{ color: "var(--dp-sand)" } as React.CSSProperties} />
                      </div>
                      {couponData && (
                        <div className="dp-sum-row">
                          <span style={{ color: "var(--dp-green)" }}>Discount ({couponData.code})</span>
                          <span style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "0.85rem", color: "var(--dp-green)", letterSpacing: "0.04em" }}>
                            -₦{discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="dp-sum-row">
                        <span>Shipping</span>
                        {hasShippingState ? (
                          <div style={{ textAlign: "right" }}>
                            <Price amount={netShippingCost.toString()} currencyCode={cart.cost.totalAmount.currencyCode} currencyCodeClassName="hidden" style={{ color: "var(--dp-sand)" } as React.CSSProperties} />
                            {shippingDiscountAmount > 0 && (
                              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: "var(--dp-green)", marginTop: 2 }}>
                                Saved ₦{shippingDiscountAmount.toFixed(2)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.68rem", fontStyle: "italic" }}>Select state</span>
                        )}
                      </div>
                      <div className="dp-sum-row" style={{ borderTop: "1px solid var(--dp-border)", marginTop: "0.25rem", paddingTop: "0.75rem" }}>
                        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500, fontSize: "0.8rem", color: "var(--dp-cream)" }}>Total</span>
                        <span style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: "1.2rem", color: "var(--dp-cream)", letterSpacing: "0.06em" }}>
                          {new Intl.NumberFormat(undefined, { style: "currency", currency: cart.cost.totalAmount.currencyCode, currencyDisplay: "narrowSymbol" }).format(totalDue)}
                        </span>
                      </div>
                      {isFreeCheckout && (
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "var(--dp-green)", marginTop: "0.4rem", lineHeight: 1.5 }}>
                          Your coupon fully covers this order. No payment required.
                        </p>
                      )}
                    </div>

                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "var(--dp-muted)", lineHeight: 1.65, marginTop: "0.875rem", borderTop: "1px solid var(--dp-border)", paddingTop: "0.75rem" }}>
                      Shipping is calculated from your location and item count.
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.875rem" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dp-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: "var(--dp-muted)", letterSpacing: "0.08em" }}>
                        Secure payment via Paystack
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
}
