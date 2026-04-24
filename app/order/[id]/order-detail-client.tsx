"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import PageLoader from "components/page-loader";
import Price from "components/price";
import {
  formatEstimatedArrival,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";
import OrderActions from "./order-actions";
import OrderFinancialSummary from "./order-financial-summary";
import OrderStatusStepper from "./order-status-stepper";

type OrderItem = {
  id?: string;
  productId?: string;
  productVariantId?: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: string;
  totalAmount?: string;
  productImage?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  orderType?: "catalog" | "custom" | string;
  customRequestNumber?: string | null;
  status: string;
  deliveryStatus?: DeliveryStatus;
  estimatedArrival?: string | null;
  subtotalAmount?: string;
  shippingAmount?: string;
  discountAmount?: string;
  couponCode?: string | null;
  totalAmount: string;
  currencyCode: string;
  createdAt: string;
  trackingNumber?: string | null;
  notes?: string | null;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    streetAddress?: string;
    nearestBusStop?: string;
    landmark?: string;
    ward?: string;
    lga?: string;
    state?: string;
    phone1?: string;
    phone2?: string;
  } | null;
  items: OrderItem[];
};

const deliverySteps = [
  { id: "placed", label: "Order placed" },
  { id: "production", label: "In production" },
  { id: "sorting", label: "Packed" },
  { id: "dispatch", label: "Dispatched" },
  { id: "completed", label: "Delivered" },
];

const stepByDeliveryStatus: Record<DeliveryStatus, number> = {
  production: 1,
  sorting: 2,
  dispatch: 3,
  completed: 4,
  paused: 1,
  cancelled: 1,
};

function parseMoney(value?: string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDeliveryWindow(estimatedArrival?: string | null) {
  if (!estimatedArrival) return "Delivery in 3–5 days";
  return `Expected by ${formatEstimatedArrival(new Date(estimatedArrival))}`;
}

function getCurrentStatusLine(status?: DeliveryStatus) {
  const statusLine: Record<DeliveryStatus, string> = {
    production: "We're currently crafting your pair by hand.",
    sorting: "Your order has been finished and is now packed with care.",
    dispatch: "Your order is on the way to you.",
    completed: "Delivered. We hope you love your pair.",
    paused: "Your order is on hold while we resolve a delivery issue.",
    cancelled: "This order was cancelled.",
  };
  return status ? statusLine[status] : "We're currently crafting your pair by hand.";
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber")?.trim() || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingCopiedState, setTrackingCopiedState] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      const query = orderNumber
        ? `?orderNumber=${encodeURIComponent(orderNumber)}`
        : "";
      const response = await fetch(`/api/orders/${orderId}${query}`);
      if (!response.ok) { setOrder(null); setIsLoading(false); return; }
      const data = await response.json();
      setOrder(data.order || null);
      setIsLoading(false);
    };
    void fetchOrder();
  }, [orderId, orderNumber]);

  useEffect(() => {
    if (trackingCopiedState === "idle") return;
    const resetTimer = window.setTimeout(() => {
      setTrackingCopiedState("idle");
    }, 2200);

    return () => window.clearTimeout(resetTimer);
  }, [trackingCopiedState]);

  if (isLoading) return <PageLoader size="lg" message="Loading order..." />;

  if (!order) {
    return (
      <>
        <style>{`
          .od-not-found {
            border: 1px solid rgba(242,232,213,0.09);
            background: rgba(242,232,213,0.02);
            padding: 64px 40px;
            text-align: center;
            font-family: 'DM Sans', sans-serif;
          }
          .od-not-found-text {
            font-family: 'Cormorant Garamond', serif;
            font-size: 24px;
            font-weight: 300;
            font-style: italic;
            color: var(--muted, #6A5A48);
            margin-bottom: 20px;
          }
          .od-back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--terra, #BF5A28);
            color: var(--cream, #F2E8D5);
            font-family: 'DM Sans', sans-serif;
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            padding: 12px 24px;
            text-decoration: none;
            transition: background 0.2s;
          }
          .od-back-btn:hover { background: #a34d22; }
        `}</style>
        <div className="od-not-found">
          <p className="od-not-found-text">Order not found.</p>
          <Link href="/orders" className="od-back-btn">← Back to orders</Link>
        </div>
      </>
    );
  }

  const parsedSubtotal = parseMoney(order.subtotalAmount);
  const parsedShipping = parseMoney(order.shippingAmount);
  const parsedDiscount = parseMoney(order.discountAmount);
  const parsedTotal = parseMoney(order.totalAmount);
  const itemBasedSubtotal = order.items.reduce((sum, item) => {
    const lineTotal = item.totalAmount
      ? parseMoney(item.totalAmount)
      : parseMoney(item.price) * item.quantity;
    return sum + lineTotal;
  }, 0);
  const summarySubtotal = parsedSubtotal > 0 ? parsedSubtotal : itemBasedSubtotal;
  const computedTotal = Math.max(summarySubtotal + parsedShipping - parsedDiscount, 0);
  const finalTotal = parsedTotal > 0 ? parsedTotal : computedTotal;
  const currentStep = order.deliveryStatus ? stepByDeliveryStatus[order.deliveryStatus] : 1;
  const deliveryState = order.shippingAddress?.state || order.shippingAddress?.lga || "Nigeria";
  const normalizedTrackingNumber = order.trackingNumber?.trim() || "";
  const showDispatchTracking =
    order.deliveryStatus === "dispatch" && normalizedTrackingNumber.length > 0;

  const handleCopyTrackingNumber = async () => {
    if (!normalizedTrackingNumber) return;

    try {
      await navigator.clipboard.writeText(normalizedTrackingNumber);
      setTrackingCopiedState("success");
    } catch {
      setTrackingCopiedState("error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        :root {
          --espresso:   #0A0704;
          --charcoal:   #100C06;
          --cream:      #F2E8D5;
          --sand:       #C9B99A;
          --muted:      #6A5A48;
          --terra:      #BF5A28;
          --gold:       #C0892A;
          --border:     rgba(242,232,213,0.09);
          --border-mid: rgba(242,232,213,0.18);
        }

        .od-root {
          font-family: 'DM Sans', sans-serif;
          color: var(--cream);
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 80px;
        }

        /* ── HERO HEADER ── */
        .od-hero {
          background: rgba(16,12,6,0.95);
          border: 1px solid var(--border);
          padding: 48px;
          position: relative;
          overflow: hidden;
        }
        .od-hero::before {
          content: '';
          position: absolute;
          right: -40px; top: -40px;
          width: 220px; height: 220px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .od-hero::after {
          content: '';
          position: absolute;
          right: 30px; top: 30px;
          width: 100px; height: 100px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .od-hero-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--terra);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .od-hero-eyebrow::before {
          content: '';
          display: block;
          width: 28px; height: 1px;
          background: var(--terra);
        }
        .od-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 300;
          line-height: 1.05;
          color: var(--cream);
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        .od-hero-title em { font-style: italic; color: var(--terra); }
        .od-hero-status-line {
          font-size: 14px;
          color: var(--sand);
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .od-delivery-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(192,137,42,0.35);
          background: rgba(192,137,42,0.08);
          padding: 8px 18px;
          font-size: 12px;
          font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.06em;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
        }
        .od-delivery-badge::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }
        .od-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          border: 1px solid var(--border);
          position: relative;
          z-index: 1;
        }
        .od-meta-cell {
          background: rgba(242,232,213,0.02);
          padding: 18px 20px;
        }
        .od-meta-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .od-meta-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--cream);
          overflow-wrap: anywhere;
        }
        .od-meta-value-gold {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          color: var(--gold);
        }
        .od-meta-value-gold p,
        .od-meta-value-gold span {
          color: var(--gold) !important;
          font-family: 'Cormorant Garamond', serif !important;
          font-size: 20px !important;
          font-weight: 400 !important;
        }

        /* ── PANEL ── */
        .od-panel {
          border: 1px solid var(--border);
          border-top: none;
          background: rgba(16,12,6,0.7);
          padding: 36px 48px;
        }
        .od-panel-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 300;
          color: var(--cream);
          margin-bottom: 6px;
        }
        .od-panel-sub {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 28px;
        }
        .od-accent-line {
          height: 1px;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 50%, transparent 100%);
          margin-bottom: 28px;
        }

        /* ── DELIVERY INFO GRID ── */
        .od-delivery-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
        }
        .od-delivery-cell {
          background: rgba(242,232,213,0.02);
          border: 1px solid var(--border);
          padding: 20px 24px;
        }
        .od-delivery-cell-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 8px;
        }
        .od-delivery-cell-value {
          font-size: 15px;
          font-weight: 400;
          color: var(--cream);
        }

        /* ── TRACKING CALLOUT ── */
        .od-tracking-wrap {
          border: 1px solid rgba(191,90,40,0.35);
          background:
            radial-gradient(circle at 0% 0%, rgba(192,137,42,0.18) 0%, rgba(192,137,42,0) 45%),
            rgba(242,232,213,0.04);
          padding: 24px;
        }
        .od-tracking-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 10px;
        }
        .od-tracking-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 14px;
          line-height: 1;
        }
        .od-tracking-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border: 1px solid var(--border-mid);
          background: rgba(10,7,4,0.46);
        }
        .od-tracking-number {
          margin: 0;
          color: var(--gold);
          font-size: clamp(18px, 2.1vw, 24px);
          font-weight: 600;
          letter-spacing: 0.12em;
          line-height: 1.15;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          overflow-wrap: anywhere;
        }
        .od-tracking-copy {
          border: 1px solid rgba(192,137,42,0.7);
          background: rgba(192,137,42,0.12);
          color: var(--cream);
          padding: 10px 14px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          cursor: pointer;
        }
        .od-tracking-copy:hover {
          background: rgba(192,137,42,0.24);
          border-color: rgba(192,137,42,0.95);
        }
        .od-tracking-copy:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        .od-tracking-help {
          margin: 14px 0 0;
          font-size: 13px;
          color: var(--sand);
          line-height: 1.55;
        }
        .od-tracking-feedback {
          margin: 8px 0 0;
          min-height: 20px;
          font-size: 12px;
          letter-spacing: 0.03em;
          color: var(--gold);
        }
        .od-tracking-feedback-error {
          color: #f4b9a2;
        }

        /* ── ITEMS ── */
        .od-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
        }
        .od-item:first-child { padding-top: 0; }
        .od-item:last-child { border-bottom: none; padding-bottom: 0; }
        .od-item-img {
          position: relative;
          width: 72px;
          height: 88px;
          flex-shrink: 0;
          overflow: hidden;
          background: rgba(242,232,213,0.04);
          border: 1px solid var(--border);
        }
        .od-item-img img { object-fit: cover; }
        .od-item-img-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          opacity: 0.08;
        }
        .od-item-body { flex: 1; min-width: 0; }
        .od-item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 5px;
          line-height: 1.2;
        }
        .od-item-meta {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .od-item-price p,
        .od-item-price span {
          color: var(--gold) !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          letter-spacing: 0.03em;
        }
        .od-item-note {
          font-size: 12px;
          color: var(--muted);
          margin-top: 20px;
          letter-spacing: 0.04em;
        }

        /* ── BACK LINK ── */
        .od-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
          margin-top: 8px;
          padding: 0 48px;
        }
        .od-back-link:hover { color: var(--cream); }
        .od-back-link::before { content: '←'; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .od-hero { padding: 28px 24px; }
          .od-panel { padding: 24px; }
          .od-meta-grid { grid-template-columns: 1fr; }
          .od-delivery-grid { grid-template-columns: 1fr; }
          .od-tracking-wrap { padding: 18px; }
          .od-tracking-row {
            flex-direction: column;
            align-items: stretch;
          }
          .od-tracking-copy {
            width: 100%;
            text-align: center;
          }
          .od-back-link { padding: 0 24px; }
        }
        @media (max-width: 480px) {
          .od-item-img { width: 56px; height: 68px; }
        }
      `}</style>

      <div className="od-root">
        {/* ── HERO ── */}
        <header className="od-hero">
          <div className="od-hero-eyebrow">Order confirmed</div>
          <h1 className="od-hero-title">
            Thank you — your<br />
            payment was <em>successful</em>
          </h1>
          <p className="od-hero-status-line">{getCurrentStatusLine(order.deliveryStatus)}</p>
          <div className="od-delivery-badge">{formatDeliveryWindow(order.estimatedArrival)}</div>

          <div className="od-meta-grid">
            <div className="od-meta-cell">
              <div className="od-meta-label">Order ID</div>
              <div className="od-meta-value">{order.orderNumber}</div>
            </div>
            <div className="od-meta-cell">
              <div className="od-meta-label">Placed</div>
              <div className="od-meta-value">
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="od-meta-cell">
              <div className="od-meta-label">Total paid</div>
              <div className="od-meta-value-gold">
                <Price
                  amount={finalTotal.toFixed(2)}
                  currencyCode={order.currencyCode}
                  currencyCodeClassName="hidden"
                  className="inline"
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── STATUS ── */}
        <section id="status" className="od-panel">
          <div className="od-accent-line" />
          <h2 className="od-panel-title">Order status</h2>
          <p className="od-panel-sub">{getCurrentStatusLine(order.deliveryStatus)}</p>
          <OrderStatusStepper steps={deliverySteps} currentStep={currentStep} />
        </section>

        {/* ── DELIVERY INFO ── */}
        <section className="od-panel">
          <div className="od-accent-line" />
          <h2 className="od-panel-title">Delivery information</h2>
          <div className="od-delivery-grid">
            <div className="od-delivery-cell">
              <div className="od-delivery-cell-label">Estimated delivery</div>
              <div className="od-delivery-cell-value">
                {formatDeliveryWindow(order.estimatedArrival)}
              </div>
            </div>
            <div className="od-delivery-cell">
              <div className="od-delivery-cell-label">Delivery location</div>
              <div className="od-delivery-cell-value">{deliveryState}</div>
            </div>
          </div>
        </section>

        {showDispatchTracking ? (
          <section className="od-panel" aria-label="Delivery tracking number">
            <div className="od-accent-line" />
            <h2 className="od-panel-title">Track delivery</h2>
            <div className="od-tracking-wrap">
              <p className="od-tracking-eyebrow">Tracking number</p>
              <p className="od-tracking-title">Use this for courier tracking</p>
              <div className="od-tracking-row">
                <p className="od-tracking-number">{normalizedTrackingNumber}</p>
                <button
                  type="button"
                  className="od-tracking-copy"
                  onClick={() => void handleCopyTrackingNumber()}
                >
                  {trackingCopiedState === "success" ? "Copied" : "Copy tracking number"}
                </button>
              </div>
              <p className="od-tracking-help">
                Share this tracking number with our 3rd-party delivery service to monitor
                your package in transit.
              </p>
              <p
                className={`od-tracking-feedback${trackingCopiedState === "error" ? " od-tracking-feedback-error" : ""}`}
                aria-live="polite"
              >
                {trackingCopiedState === "success"
                  ? "Tracking number copied."
                  : trackingCopiedState === "error"
                    ? "Copy failed. Please select and copy the tracking number manually."
                    : " "}
              </p>
            </div>
          </section>
        ) : null}

        {/* ── FINANCIAL SUMMARY ── */}
        <OrderFinancialSummary
          items={order.items.map((item) => ({
            id: item.id || `${item.productId || order.id}-${item.productVariantId || item.productTitle}`,
            name: `${item.productTitle} × ${item.quantity}`,
            amount: item.totalAmount || (parseMoney(item.price) * item.quantity).toFixed(2),
          }))}
          currencyCode={order.currencyCode}
          shippingAmount={parsedShipping.toFixed(2)}
          discountAmount={parsedDiscount.toFixed(2)}
          couponCode={order.couponCode}
          totalPaid={finalTotal.toFixed(2)}
        />

        {/* ── ACTIONS ── */}
        <OrderActions orderNumber={order.orderNumber} />

        {/* ── ITEMS ── */}
        <section className="od-panel">
          <div className="od-accent-line" />
          <h2 className="od-panel-title">Purchased items</h2>
          <p className="od-panel-sub" style={{ marginBottom: "24px" }}>
            {order.items.length} {order.items.length === 1 ? "item" : "items"} in this order
          </p>

          <div>
            {order.items.map((item) => (
              <article
                key={item.id || `${order.id}-${item.productVariantId || item.productTitle}`}
                className="od-item"
              >
                <div className="od-item-img">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      fill
                      sizes="72px"
                    />
                  ) : (
                    <div className="od-item-img-empty">
                      <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
                        <path d="M8 30 Q6 36 14 37 L34 37 Q42 37 40 30 L38 22 Q36 16 30 16 L10 16 Q4 18 8 30Z" fill="#F2E8D5" />
                        <path d="M10 16 Q8 6 18 2 Q26 -1 34 3 Q40 7 40 16Z" fill="#F2E8D5" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="od-item-body">
                  <p className="od-item-title">{item.productTitle}</p>
                  <p className="od-item-meta">
                    {item.variantTitle} · Qty {item.quantity}
                  </p>
                </div>

                <div className="od-item-price">
                  <Price
                    amount={item.totalAmount || (parseMoney(item.price) * item.quantity).toFixed(2)}
                    currencyCode={order.currencyCode}
                    currencyCodeClassName="hidden"
                    className="inline"
                  />
                </div>
              </article>
            ))}
          </div>

          <p className="od-item-note">
            Need to make a change? Contact support with your order ID above.
          </p>
        </section>

        <Link href="/orders" className="od-back-link">
          Back to all orders
        </Link>
      </div>
    </>
  );
}