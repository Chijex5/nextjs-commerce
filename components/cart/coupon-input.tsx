"use client";

import { useUserSession } from "hooks/useUserSession";
import { getErrorMessage, parseApiError } from "lib/client-error";
import {
  COUPON_STORAGE_KEY,
  getCouponCustomerKey,
  getStoredCoupon,
  migrateGuestCouponToUser,
  saveStoredCoupon,
} from "lib/coupon-storage";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DEV_COUPON_DEBUG = process.env.NODE_ENV !== "production";

function logCouponDebug(message: string, payload?: unknown) {
  if (!DEV_COUPON_DEBUG) return;
  console.debug(`[coupon][cart-input] ${message}`, payload);
}

interface CouponInputProps {
  onApply: (
    discountAmount: number,
    couponCode: string,
    couponMeta?: {
      shippingDiscountAmount?: number;
      productDiscountAmount?: number;
      grantsFreeShipping?: boolean;
      includeShippingInDiscount?: boolean;
    },
  ) => void;
  cartTotal: number;
  shippingAmount?: number;
  cartId: string;
  variant?: "card" | "compact";
}

export default function CouponInput({
  onApply,
  cartTotal,
  shippingAmount = 0,
  cartId,
  variant = "card",
}: CouponInputProps) {
  const isCompact = variant === "compact";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const { data: session } = useUserSession();

  useEffect(() => {
    const loadStoredCoupon = async () => {
      if (!cartId) { setAppliedCoupon(null); onApply(0, ""); return; }
      try {
        const customerKey = getCouponCustomerKey(session?.id);
        let couponData = getStoredCoupon(cartId, customerKey);
        if (!couponData && session?.id) couponData = migrateGuestCouponToUser(cartId, session.id);
        if (couponData) {
          const payload: { code: string; cartTotal: number; shippingAmount: number; sessionId?: string } = {
            code: couponData.code, cartTotal, shippingAmount,
          };
          if (!session?.id) payload.sessionId = customerKey.replace("guest:", "");
          const response = await fetch("/api/coupons/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            const data = await response.json();
            setAppliedCoupon(data.coupon);
            onApply(data.coupon.discountAmount, data.coupon.code, data.coupon);
            saveStoredCoupon({
              code: data.coupon.code,
              discountAmount: data.coupon.discountAmount,
              shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
              productDiscountAmount: data.coupon.productDiscountAmount || 0,
              grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
              includeShippingInDiscount: Boolean(data.coupon.includeShippingInDiscount),
              description: data.coupon.description,
              cartId, customerKey,
            });
          } else {
            setAppliedCoupon(null); onApply(0, "");
            logCouponDebug("Revalidation failed", { cartId, customerKey, status: response.status, payload });
          }
        }
      } catch (err) {
        logCouponDebug("Revalidation error", { cartId, error: err instanceof Error ? err.message : String(err) });
      }
    };
    loadStoredCoupon();
  }, [cartId, cartTotal, onApply, session?.id, shippingAmount]);

  const handleApply = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!cartId) { toast.error("Unable to apply coupon right now. Please refresh and try again."); return; }
    if (!trimmedCode) { toast.error("Please enter a coupon code"); return; }
    setLoading(true);
    try {
      const customerKey = getCouponCustomerKey(session?.id);
      const payload: { code: string; cartTotal: number; shippingAmount: number; sessionId?: string } = {
        code: trimmedCode, cartTotal, shippingAmount,
      };
      if (!session?.id) payload.sessionId = customerKey.replace("guest:", "");
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        logCouponDebug("Apply failed", { cartId, customerKey, status: response.status, payload, response: data });
        toast.error(parseApiError(response, data));
        return;
      }
      setAppliedCoupon(data.coupon);
      setCode("");
      toast.success(`Coupon applied! You saved ₦${data.coupon.discountAmount.toFixed(2)}`);
      onApply(data.coupon.discountAmount, data.coupon.code, data.coupon);
      try {
        saveStoredCoupon({
          code: data.coupon.code,
          discountAmount: data.coupon.discountAmount,
          shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
          productDiscountAmount: data.coupon.productDiscountAmount || 0,
          grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
          includeShippingInDiscount: Boolean(data.coupon.includeShippingInDiscount),
          description: data.coupon.description,
          cartId, customerKey,
        });
      } catch (err) { console.error("Failed to save coupon to storage:", err); }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null); setCode(""); onApply(0, "");
    toast.success("Coupon removed");
    try { localStorage.removeItem(COUPON_STORAGE_KEY); }
    catch (err) { console.error("Failed to remove coupon from storage:", err); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
  };

  /* ─── APPLIED STATE ──────────────────────────────────────── */
  if (appliedCoupon) {
    if (isCompact) {
      return (
        <div
          style={{
            display: "flex", flexDirection: "column", gap: "0.5rem",
            padding: "0.6rem 0.75rem",
            background: "rgba(74,140,92,0.08)",
            border: "1px solid rgba(74,140,92,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Check icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dp-green, #4A8C5C)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.68rem", fontWeight: 500, color: "var(--dp-sand, #C9B99A)", letterSpacing: "0.06em" }}>
                Coupon
              </span>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.58rem", fontWeight: 600,
                  letterSpacing: "0.16em", textTransform: "uppercase",
                  color: "var(--dp-ember, #BF5A28)",
                  border: "1px solid var(--dp-ember, #BF5A28)",
                  padding: "1px 6px",
                }}
              >
                {appliedCoupon.code}
              </span>
            </div>
            <button
              onClick={handleRemove}
              style={{
                fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--dp-muted, #6A5A48)", background: "none", border: "none",
                cursor: "pointer", textDecoration: "underline", padding: 0,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--dp-cream, #F2E8D5)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--dp-muted, #6A5A48)")}
            >
              Remove
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.68rem", color: "var(--dp-muted, #6A5A48)" }}>Savings</span>
            <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "0.9rem", color: "var(--dp-green, #4A8C5C)", letterSpacing: "0.06em" }}>
              -₦{appliedCoupon.discountAmount.toFixed(2)}
            </span>
          </div>
          {appliedCoupon.description && (
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", color: "var(--dp-muted, #6A5A48)", lineHeight: 1.5 }}>
              {appliedCoupon.description}
            </p>
          )}
        </div>
      );
    }

    /* card applied */
    return (
      <div
        style={{
          padding: "1rem",
          background: "rgba(74,140,92,0.07)",
          border: "1px solid rgba(74,140,92,0.22)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dp-green, #4A8C5C)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "var(--dp-sand, #C9B99A)" }}>
                Applied:
              </span>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.58rem", fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--dp-ember, #BF5A28)",
                  border: "1px solid var(--dp-ember, #BF5A28)",
                  padding: "1px 7px",
                }}
              >
                {appliedCoupon.code}
              </span>
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.72rem", color: "var(--dp-muted, #6A5A48)" }}>
              Discount:{" "}
              <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "0.95rem", color: "var(--dp-green, #4A8C5C)", letterSpacing: "0.04em" }}>
                -₦{appliedCoupon.discountAmount.toFixed(2)}
              </span>
            </p>
            {appliedCoupon.description && (
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.65rem", color: "var(--dp-muted, #6A5A48)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {appliedCoupon.description}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            style={{
              fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", fontWeight: 500,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--dp-muted, #6A5A48)", background: "none", border: "none",
              cursor: "pointer", padding: 0,
              borderBottom: "1px solid transparent",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-cream, #F2E8D5)";
              (e.currentTarget as HTMLButtonElement).style.borderBottomColor = "var(--dp-ember, #BF5A28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-muted, #6A5A48)";
              (e.currentTarget as HTMLButtonElement).style.borderBottomColor = "transparent";
            }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  /* ─── COMPACT INPUT ──────────────────────────────────────── */
  if (isCompact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif", fontSize: "0.58rem", fontWeight: 500,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "var(--dp-ember, #BF5A28)",
            }}
          >
            Discount code
          </span>
          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", color: "var(--dp-muted, #6A5A48)" }}>
            Optional
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <input
            type="text"
            id="coupon-compact"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="e.g. SAVE20"
            disabled={loading}
            maxLength={50}
            style={{
              flex: 1, minWidth: 0,
              background: "rgba(242,232,213,0.04)",
              border: "1px solid var(--dp-border, rgba(242,232,213,0.09))",
              borderRight: "none",
              color: "var(--dp-cream, #F2E8D5)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "0.5rem 0.6rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--dp-ember, #BF5A28)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--dp-border, rgba(242,232,213,0.09))")}
          />
          <button
            onClick={handleApply}
            disabled={loading || !code.trim()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0.5rem 0.9rem", flexShrink: 0,
              background: loading || !code.trim() ? "var(--dp-charcoal, #191209)" : "var(--dp-ember, #BF5A28)",
              border: "1px solid",
              borderColor: loading || !code.trim() ? "var(--dp-border, rgba(242,232,213,0.09))" : "var(--dp-ember, #BF5A28)",
              color: loading || !code.trim() ? "var(--dp-muted, #6A5A48)" : "var(--dp-cream, #F2E8D5)",
              fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", fontWeight: 500,
              letterSpacing: "0.14em", textTransform: "uppercase",
              cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s, color 0.2s, border-color 0.2s",
              minWidth: 60,
            }}
          >
            {loading ? <Spinner /> : "Apply"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── CARD INPUT (default) ───────────────────────────────── */
  return (
    <div
      style={{
        background: "var(--dp-charcoal, #191209)",
        border: "1px solid var(--dp-border, rgba(242,232,213,0.09))",
        padding: "1rem",
      }}
    >
      <label
        htmlFor="coupon-card"
        style={{
          display: "block", marginBottom: "0.75rem",
          fontFamily: "DM Sans, sans-serif", fontSize: "0.58rem", fontWeight: 500,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "var(--dp-ember, #BF5A28)",
        }}
      >
        Have a discount code?
      </label>

      <div style={{ display: "flex", alignItems: "stretch" }}>
        <input
          type="text"
          id="coupon-card"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Enter code (e.g. SAVE20)"
          disabled={loading}
          maxLength={50}
          style={{
            flex: 1, minWidth: 0,
            background: "rgba(242,232,213,0.04)",
            border: "1px solid var(--dp-border, rgba(242,232,213,0.09))",
            borderRight: "none",
            color: "var(--dp-cream, #F2E8D5)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "0.65rem 0.75rem",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--dp-ember, #BF5A28)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--dp-border, rgba(242,232,213,0.09))")}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0.65rem 1.25rem", flexShrink: 0,
            background: loading || !code.trim() ? "rgba(242,232,213,0.04)" : "var(--dp-ember, #BF5A28)",
            border: "1px solid",
            borderColor: loading || !code.trim() ? "var(--dp-border, rgba(242,232,213,0.09))" : "var(--dp-ember, #BF5A28)",
            color: loading || !code.trim() ? "var(--dp-muted, #6A5A48)" : "var(--dp-cream, #F2E8D5)",
            fontFamily: "DM Sans, sans-serif", fontSize: "0.68rem", fontWeight: 500,
            letterSpacing: "0.14em", textTransform: "uppercase",
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s, border-color 0.2s",
            minWidth: 80,
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            if (!btn.disabled) { btn.style.opacity = "0.85"; }
          }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          {loading ? <Spinner /> : "Apply"}
        </button>
      </div>

      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", color: "var(--dp-muted, #6A5A48)", marginTop: "0.5rem", lineHeight: 1.5 }}>
        Enter your coupon code to receive a discount on your order.
      </p>
    </div>
  );
}

/* ─── SPINNER ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      style={{ animation: "spin 0.75s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}