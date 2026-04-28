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
  phone: string;
  shippingAddress: Address;
  billingAddress: Address;
  saveAddress: boolean;
  useSameAddress: boolean;
}

type AddressType = "shippingAddress" | "billingAddress";

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

/* ── Shared input style ─────────────────────────────────── */
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(242,232,213,0.04)",
  border: "1px solid rgba(242,232,213,0.09)",
  color: "var(--dp-cream)",
  fontFamily: "DM Sans, sans-serif",
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
  fontFamily: "DM Sans, sans-serif",
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
          fontFamily: "DM Sans, sans-serif",
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
        fontFamily: "DM Sans, sans-serif",
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
        {(["phone1", "phone2"] as const).map((field, i) => (
          <div key={field}>
            <FieldLabel required>Phone Number {i + 1}</FieldLabel>
            <div style={{ display: "flex" }}>
              <span style={PHONE_PREFIX_STYLE}>
                <span style={{ fontSize: "1rem" }}>🇳🇬</span>
                <span>+234</span>
              </span>
              <DPInput
                type="tel"
                required
                value={formData[type][field]}
                onChange={(e) =>
                  handleInputChange(
                    field,
                    e.target.value.replace(/\D/g, ""),
                    type,
                  )
                }
                placeholder={i === 0 ? "801 2345 678" : "802 3456 789"}
                maxLength={10}
                style={{ ...INPUT_STYLE, flex: 1, borderLeft: "none" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useUserSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    phone: "",
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
    const phone = formData.phone?.trim();
    if (!email && !phone) return;
    const key = `${email || ""}|${phone || ""}`;
    if (key === tiktokIdentifyKeyRef.current) return;
    tiktokIdentifyKeyRef.current = key;
    identifyUser({
      email: email || undefined,
      phoneNumber: phone || undefined,
    });
  }, [formData.email, formData.phone]);

  const loadCouponData = async (cartId: string, cartTotal: number) => {
    if (!cartId) {
      setCouponData(null);
      return;
    }
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
            includeShippingInDiscount: Boolean(
              data.coupon.includeShippingInDiscount,
            ),
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
      logCouponDebug("Initial load validation error", {
        cartId,
        error: err instanceof Error ? err.message : String(err),
      });
      setCouponData(null);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch("/api/user-auth/addresses");
      if (response.ok) {
        const data = await response.json();
        const norm = (input?: Partial<Address>): Address => ({
          ...emptyAddress,
          ...(input || {}),
        });
        setFormData((prev) => ({
          ...prev,
          email: session?.email || "",
          phone: session?.phone || prev.phone,
          shippingAddress: norm(
            data.addresses.shippingAddress || prev.shippingAddress,
          ),
          billingAddress: norm(
            data.addresses.billingAddress || prev.billingAddress,
          ),
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
          await loadCouponData(
            data.cart.id,
            parseFloat(data.cart.cost.subtotalAmount.amount),
          );
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
      setFormData((prev) => ({
        ...prev,
        [addressType]: { ...prev[addressType], [field]: value },
      }));
    else setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (
    addressType: AddressType,
    field: "state" | "lga" | "ward",
    value: string,
    source: LocationChangeSource,
  ) => {
    const changed =
      normalizeLocationName(formData[addressType][field] || "") !==
      normalizeLocationName(value);
    handleInputChange(field, value, addressType);
    if (source !== "select" || !changed) return;
    if (field === "state") {
      handleInputChange("lga", "", addressType);
      handleInputChange("ward", "", addressType);
    }
    if (field === "lga") handleInputChange("ward", "", addressType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const checkoutData = {
        email: formData.email,
        phone: formData.phone,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useSameAddress
          ? formData.shippingAddress
          : formData.billingAddress,
        saveAddress: formData.saveAddress,
        couponCode: couponData?.code,
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
        router.push(
          `/checkout/success?order=${encodeURIComponent(data.orderNumber)}`,
        );
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
  const totalQuantity =
    cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
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
      const payload: {
        code: string;
        cartTotal: number;
        shippingAmount: number;
        sessionId?: string;
      } = {
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
        logCouponDebug("Shipping revalidation failed", {
          cartId: cart.id,
          status: response.status,
        });
        setCouponData(null);
        return;
      }
      const data = await response.json();
      setCouponData({
        code: data.coupon.code,
        amount: data.coupon.discountAmount,
        productDiscountAmount: data.coupon.productDiscountAmount || 0,
        shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
        includeShippingInDiscount: Boolean(
          data.coupon.includeShippingInDiscount,
        ),
        grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
      });
    };
    void revalidate();
  }, [loading, cart, couponData?.code, shippingCost, subtotal, session?.id]);

  if (loading) return <PageLoader size="lg" message="Loading checkout..." />;
  if (!cart || cart.lines.length === 0) return null;

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

        /* Location select override */
        .dp-location-input {
          width: 100% !important;
          background: rgba(242,232,213,0.04) !important;
          border: 1px solid rgba(242,232,213,0.09) !important;
          border-radius: 0 !important;
          color: var(--dp-cream) !important;
          font-family: 'DM Sans', sans-serif !important;
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

        /* Custom checkbox */
        .dp-checkbox {
          appearance: none;
          width: 1rem; height: 1rem; flex-shrink: 0;
          border: 1px solid var(--dp-border);
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: border-color 0.2s, background 0.2s;
        }
        .dp-checkbox:checked {
          background: var(--dp-ember);
          border-color: var(--dp-ember);
        }
        .dp-checkbox:checked::after {
          content: '';
          position: absolute; top: 2px; left: 5px;
          width: 4px; height: 7px;
          border: 1.5px solid var(--dp-cream);
          border-top: none; border-left: none;
          transform: rotate(45deg);
        }

        /* Summary row */
        .dp-sum-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--dp-border);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          color: var(--dp-muted);
        }
        .dp-sum-row:last-child { border-bottom: none; }

        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-rise { animation: dp-rise 0.7s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div
        style={{
          background: "var(--dp-ink)",
          color: "var(--dp-cream)",
          minHeight: "100vh",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, var(--dp-ember), var(--dp-gold) 50%, transparent 100%)",
          }}
        />

        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "3rem clamp(1rem,4vw,3rem) 5rem",
          }}
        >
          {/* Page header */}
          <div className="dp-rise" style={{ marginBottom: "2.5rem" }}>
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.6rem",
                fontWeight: 500,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--dp-ember)",
                marginBottom: "0.5rem",
              }}
            >
              D&apos;FOOTPRINT
            </p>
            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(2rem,5vw,3.5rem)",
                letterSpacing: "0.08em",
                color: "var(--dp-cream)",
                lineHeight: 1,
              }}
            >
              Checkout
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{ display: "grid", gap: "2rem", alignItems: "start" }}
              className="lg:grid-cols-[1fr_380px]"
            >
              {/* ── LEFT: Forms ─────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {/* Contact */}
                <SectionCard label="Contact Information">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <FieldLabel required>Email</FieldLabel>
                      <DPInput
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Phone Number</FieldLabel>
                      <div style={{ display: "flex" }}>
                        <span style={PHONE_PREFIX_STYLE}>
                          <span style={{ fontSize: "1rem" }}>🇳🇬</span>
                          <span>+234</span>
                        </span>
                        <DPInput
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange(
                              "phone",
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
                          placeholder="801 2345 678"
                          maxLength={10}
                          style={{
                            ...INPUT_STYLE,
                            flex: 1,
                            borderLeft: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Shipping address */}
                <SectionCard label="Shipping Address">
                  <AddressFields
                    type="shippingAddress"
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleLocationChange={handleLocationChange}
                  />
                </SectionCard>

                {/* Billing toggle */}
                <div
                  style={{
                    background: "var(--dp-charcoal)",
                    border: "1px solid var(--dp-border)",
                    padding: "1.1rem 1.5rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.useSameAddress}
                      onChange={(e) =>
                        handleInputChange("useSameAddress", e.target.checked)
                      }
                      className="dp-checkbox"
                    />
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.78rem",
                        color: "var(--dp-sand)",
                      }}
                    >
                      Billing address same as shipping
                    </span>
                  </label>
                </div>

                {!formData.useSameAddress && (
                  <SectionCard label="Billing Address">
                    <AddressFields
                      type="billingAddress"
                      formData={formData}
                      handleInputChange={handleInputChange}
                      handleLocationChange={handleLocationChange}
                    />
                  </SectionCard>
                )}

                {/* Save address */}
                {session && (
                  <div
                    style={{
                      background: "var(--dp-charcoal)",
                      border: "1px solid var(--dp-border)",
                      padding: "1.1rem 1.5rem",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.saveAddress}
                        onChange={(e) =>
                          handleInputChange("saveAddress", e.target.checked)
                        }
                        className="dp-checkbox"
                      />
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "0.78rem",
                          color: "var(--dp-sand)",
                        }}
                      >
                        Save this address to my account for future orders
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* ── RIGHT: Order summary ─────────────────── */}
              <div style={{ position: "sticky", top: "5.5rem" }}>
                <div
                  style={{
                    background: "var(--dp-charcoal)",
                    border: "1px solid var(--dp-border)",
                  }}
                >
                  {/* Top ember line */}
                  <div
                    style={{
                      height: 2,
                      background:
                        "linear-gradient(90deg, var(--dp-ember), transparent 80%)",
                    }}
                  />

                  <div style={{ padding: "1.5rem" }}>
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.6rem",
                        fontWeight: 500,
                        letterSpacing: "0.26em",
                        textTransform: "uppercase",
                        color: "var(--dp-ember)",
                        marginBottom: "1.1rem",
                      }}
                    >
                      Order Summary
                    </p>

                    {/* Cart items */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.875rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      {cart.lines.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: "0.75rem",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: 56,
                              height: 56,
                              flexShrink: 0,
                              background: "var(--dp-card)",
                              overflow: "hidden",
                            }}
                          >
                            <Image
                              src={item.merchandise.product.featuredImage.url}
                              alt={item.merchandise.product.title}
                              fill
                              className="object-cover"
                            />
                            {/* Qty badge */}
                            <span
                              style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                background: "var(--dp-ember)",
                                color: "var(--dp-cream)",
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: "0.55rem",
                                fontWeight: 600,
                                padding: "1px 5px",
                                lineHeight: 1.5,
                              }}
                            >
                              {item.quantity}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              className="line-clamp-1"
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: "0.75rem",
                                color: "var(--dp-sand)",
                                lineHeight: 1.35,
                              }}
                            >
                              {item.merchandise.product.title}
                            </p>
                            {item.merchandise.title &&
                              item.merchandise.title !== "Default Title" && (
                                <p
                                  style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    fontSize: "0.65rem",
                                    color: "var(--dp-muted)",
                                    marginTop: "0.15rem",
                                  }}
                                >
                                  {item.merchandise.title}
                                </p>
                              )}
                          </div>
                          <Price
                            amount={item.cost.totalAmount.amount}
                            currencyCode={item.cost.totalAmount.currencyCode}
                            currencyCodeClassName="hidden"
                            className="dp-wordmark"
                            style={
                              {
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "0.9rem",
                                color: "var(--dp-cream)",
                                flexShrink: 0,
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div
                      style={{
                        borderTop: "1px solid var(--dp-border)",
                        paddingTop: "0.875rem",
                      }}
                    >
                      <div className="dp-sum-row">
                        <span>Subtotal</span>
                        <Price
                          amount={cart.cost.subtotalAmount.amount}
                          currencyCode={cart.cost.subtotalAmount.currencyCode}
                          currencyCodeClassName="hidden"
                          style={
                            { color: "var(--dp-sand)" } as React.CSSProperties
                          }
                        />
                      </div>
                      {couponData && (
                        <div className="dp-sum-row">
                          <span style={{ color: "var(--dp-green)" }}>
                            Discount ({couponData.code})
                          </span>
                          <span
                            style={{
                              fontFamily: "Bebas Neue, sans-serif",
                              fontSize: "0.85rem",
                              color: "var(--dp-green)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            -₦{discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="dp-sum-row">
                        <span>Shipping</span>
                        {hasShippingState ? (
                          <div style={{ textAlign: "right" }}>
                            <Price
                              amount={netShippingCost.toString()}
                              currencyCode={cart.cost.totalAmount.currencyCode}
                              currencyCodeClassName="hidden"
                              style={
                                {
                                  color: "var(--dp-sand)",
                                } as React.CSSProperties
                              }
                            />
                            {shippingDiscountAmount > 0 && (
                              <p
                                style={{
                                  fontFamily: "DM Sans, sans-serif",
                                  fontSize: "0.62rem",
                                  color: "var(--dp-green)",
                                  marginTop: 2,
                                }}
                              >
                                Saved ₦{shippingDiscountAmount.toFixed(2)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{ fontSize: "0.68rem", fontStyle: "italic" }}
                          >
                            Select state
                          </span>
                        )}
                      </div>
                      <div
                        className="dp-sum-row"
                        style={{
                          borderTop: "1px solid var(--dp-border)",
                          marginTop: "0.25rem",
                          paddingTop: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            color: "var(--dp-cream)",
                          }}
                        >
                          Total
                        </span>
                        <span
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "1.2rem",
                            color: "var(--dp-cream)",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: cart.cost.totalAmount.currencyCode,
                            currencyDisplay: "narrowSymbol",
                          }).format(totalDue)}
                        </span>
                      </div>
                      {isFreeCheckout && (
                        <p
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "0.65rem",
                            color: "var(--dp-green)",
                            marginTop: "0.4rem",
                            lineHeight: 1.5,
                          }}
                        >
                          Your coupon fully covers this order. No payment
                          required.
                        </p>
                      )}
                    </div>

                    {/* Shipping note */}
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.65rem",
                        color: "var(--dp-muted)",
                        lineHeight: 1.65,
                        marginTop: "0.875rem",
                        borderTop: "1px solid var(--dp-border)",
                        paddingTop: "0.75rem",
                      }}
                    >
                      Shipping is calculated from your location and item count.
                    </p>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "1.25rem",
                        background: submitting
                          ? "var(--dp-muted)"
                          : "var(--dp-cream)",
                        color: "var(--dp-ink)",
                        border: "none",
                        cursor: submitting ? "not-allowed" : "pointer",
                        padding: "0.9rem",
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: 500,
                        fontSize: "0.72rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        transition: "background 0.2s, color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!submitting) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--dp-ember)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--dp-cream)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!submitting) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--dp-cream)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--dp-ink)";
                        }
                      }}
                    >
                      {submitting ? (
                        <LoadingDots className="bg-neutral-600" />
                      ) : isFreeCheckout ? (
                        "Place Order →"
                      ) : (
                        "Proceed to Payment →"
                      )}
                    </button>

                    {/* Paystack badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        marginTop: "0.875rem",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--dp-muted)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "0.62rem",
                          color: "var(--dp-muted)",
                          letterSpacing: "0.08em",
                        }}
                      >
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
