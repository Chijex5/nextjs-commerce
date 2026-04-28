"use client";

import { useUserSession } from "hooks/useUserSession";
import { useCart } from "components/cart/cart-context";
import { trackPurchase } from "lib/analytics";
import { COUPON_STORAGE_KEY } from "lib/coupon-storage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { status } = useUserSession();
  const { clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const trackedOrderRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderNumber || trackedOrderRef.current === orderNumber) return;
    const trackOrder = async () => {
      try {
        const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}`);
        if (!response.ok) return;
        const data = await response.json();
        const order = data?.order;
        if (!order) return;
        trackedOrderRef.current = orderNumber;
        trackPurchase({
          orderId: order.orderNumber,
          value: parseFloat(order.totalAmount),
          items: order.items.map((item: any) => ({ id: item.productId, name: item.productTitle, quantity: item.quantity })),
        });
      } catch (error) { console.error("Failed to track purchase:", error); }
    };
    trackOrder();
  }, [orderNumber]);

  if (!mounted) return null;

  const NEXT_STEPS = [
    { icon: "◈", text: "Email confirmation sent with your order details." },
    { icon: "⟡", text: "We'll notify you when your order is shipped." },
    { icon: "⊛", text: "Track anytime from your account or with your order number." },
  ];

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

        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dp-check-in {
          0%   { stroke-dashoffset: 60; opacity: 0; }
          40%  { opacity: 1; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes dp-ring-pulse {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .dp-rise-1 { animation: dp-rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .dp-rise-2 { animation: dp-rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .dp-rise-3 { animation: dp-rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .dp-rise-4 { animation: dp-rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.48s both; }
        .dp-rise-5 { animation: dp-rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.60s both; }

        .dp-check-ring { animation: dp-ring-pulse 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .dp-check-path { stroke-dasharray: 60; animation: dp-check-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both; }

        .dp-step-item {
          display: flex; align-items: flex-start; gap: 0.875rem;
          padding: 0.875rem 0;
          border-bottom: 1px solid var(--dp-border);
        }
        .dp-step-item:last-child { border-bottom: none; }

        .dp-btn-primary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 0.85rem 1.75rem; text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }
        .dp-btn-primary:hover { background: var(--dp-ember); color: var(--dp-cream); }

        .dp-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.4rem;
          border: 1px solid var(--dp-border); color: var(--dp-muted);
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 0.85rem 1.75rem; text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .dp-btn-ghost:hover { border-color: rgba(242,232,213,0.3); color: var(--dp-cream); }
      `}</style>

      <div
        style={{
          background: "var(--dp-ink)", color: "var(--dp-cream)",
          minHeight: "100vh", fontFamily: "DM Sans, sans-serif",
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 2, background: "linear-gradient(90deg, var(--dp-ember), var(--dp-gold) 50%, transparent 100%)" }} />

        <div
          style={{
            maxWidth: 700, margin: "0 auto",
            padding: "4rem clamp(1.25rem,4vw,2.5rem) 6rem",
          }}
        >
          {/* ── Animated check ── */}
          <div className="dp-rise-1" style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
            <div className="dp-check-ring" style={{ position: "relative", width: 80, height: 80 }}>
              {/* Outer ring */}
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "1px solid rgba(74,140,92,0.3)",
                  background: "rgba(74,140,92,0.06)",
                }}
              />
              {/* SVG checkmark */}
              <svg
                viewBox="0 0 80 80"
                fill="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              >
                <path
                  className="dp-check-path"
                  d="M24 40 l12 12 l20 -22"
                  stroke="var(--dp-green)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* ── Headline ── */}
          <div className="dp-rise-2" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--dp-ember)", marginBottom: "0.6rem" }}>
              Order Confirmed
            </p>
            <h1
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(1.8rem, 5vw, 3rem)",
                fontWeight: 600, lineHeight: 1.2,
                color: "var(--dp-cream)",
                marginBottom: "0.75rem",
              }}
            >
              Your pair is on its way.
            </h1>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.82rem", color: "var(--dp-muted)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
              Thank you for your purchase. Your order has been confirmed and is being prepared with care.
            </p>
          </div>

          {/* ── Order number ── */}
          {orderNumber && (
            <div
              className="dp-rise-3"
              style={{
                background: "var(--dp-charcoal)",
                border: "1px solid var(--dp-border)",
                padding: "1.25rem 1.5rem",
                marginBottom: "1.25rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--dp-muted)", marginBottom: "0.3rem" }}>
                  Order Number
                </p>
                <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.4rem", letterSpacing: "0.12em", color: "var(--dp-cream)" }}>
                  {orderNumber}
                </p>
              </div>
              <div style={{ width: 2, height: 40, background: "var(--dp-border)" }} />
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--dp-muted)", marginBottom: "0.3rem" }}>
                  Status
                </p>
                <span
                  style={{
                    fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", fontWeight: 500,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "var(--dp-green)",
                    border: "1px solid rgba(74,140,92,0.35)",
                    padding: "2px 8px",
                  }}
                >
                  Processing
                </span>
              </div>
            </div>
          )}

          {/* ── Email note ── */}
          <p
            className="dp-rise-3"
            style={{
              fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem",
              color: "var(--dp-muted)", lineHeight: 1.65,
              borderLeft: "2px solid var(--dp-ember)", paddingLeft: "0.875rem",
              marginBottom: "1.75rem",
            }}
          >
            A confirmation email with your order details has been sent to your address.
          </p>

          {/* ── Auth nudge ── */}
          {status === "unauthenticated" && (
            <div
              className="dp-rise-4"
              style={{
                background: "var(--dp-card)",
                border: "1px solid var(--dp-border)",
                padding: "1.25rem 1.5rem",
                marginBottom: "1.75rem",
              }}
            >
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.78rem", fontWeight: 500, color: "var(--dp-sand)", marginBottom: "0.3rem" }}>
                Create an account to track this order
              </p>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.7rem", color: "var(--dp-muted)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                Save your details for faster checkout and see updates in one place.
              </p>
              <Link
                href={`/auth/register?callbackUrl=${encodeURIComponent(`/orders?orderNumber=${orderNumber || ""}`)}`}
                style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--dp-ember)", textDecoration: "none",
                  borderBottom: "1px solid var(--dp-ember)", paddingBottom: 2,
                  transition: "color 0.2s",
                }}
              >
                Create account →
              </Link>
            </div>
          )}

          {/* ── CTAs ── */}
          <div className="dp-rise-4" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <Link href="/orders" className="dp-btn-primary">
              View Order Status
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/" className="dp-btn-ghost">
              Continue Shopping
            </Link>
          </div>

          {/* ── What's next ── */}
          <div className="dp-rise-5" style={{ background: "var(--dp-charcoal)", border: "1px solid var(--dp-border)" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, var(--dp-ember), transparent 70%)" }} />
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--dp-ember)", marginBottom: "1rem" }}>
                What&apos;s Next
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {NEXT_STEPS.map(({ icon, text }) => (
                  <li key={text} className="dp-step-item">
                    <span style={{ fontSize: "0.9rem", color: "var(--dp-ember)", flexShrink: 0, lineHeight: 1.6 }}>{icon}</span>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.78rem", color: "var(--dp-muted)", lineHeight: 1.65 }}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Ghost wordmark ── */}
          <div style={{ textAlign: "center", marginTop: "3rem", overflow: "hidden" }}>
            <span
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(3rem,10vw,7rem)",
                letterSpacing: "0.12em",
                color: "rgba(242,232,213,0.04)",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              D&apos;FOOTPRINT
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
