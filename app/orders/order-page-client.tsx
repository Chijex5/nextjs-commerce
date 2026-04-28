"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import PageLoader from "components/page-loader";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import {
  getDeliveryStatusLabel,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";

type OrderItem = {
  id?: string;
  productId?: string;
  productVariantId?: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: string;
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

type CustomRequest = {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  status: string;
  customerName: string;
  email: string;
  quotedAmount?: string | null;
  currencyCode?: string;
  quoteExpiresAt?: string | null;
  createdAt: string;
  latestQuote?: {
    id: string;
    version: number;
    amount: string;
    currencyCode?: string;
    status: string;
    expiresAt?: string | null;
  } | null;
};

export default function OrdersPageClient() {
  const { data: session, status } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [trackingInput, setTrackingInput] = useState("");
  const [customTrackRequestNumber, setCustomTrackRequestNumber] = useState("");
  const [customTrackEmail, setCustomTrackEmail] = useState("");
  const [trackedCustomRequest, setTrackedCustomRequest] = useState<CustomRequest | null>(null);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [isCustomRequestsLoading, setIsCustomRequestsLoading] = useState(false);
  const [isCustomTrackingLoading, setIsCustomTrackingLoading] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"order" | "custom">("order");

  const autoTrackedOrderRef = useRef<string | null>(null);
  const autoTrackedCustomRef = useRef<string | null>(null);
  const orderNumberParam = searchParams.get("orderNumber")?.trim() || "";
  const customRequestParam = searchParams.get("customRequest")?.trim() || "";
  const emailParam = searchParams.get("email")?.trim() || "";

  useEffect(() => {
    if (session) {
      void fetchOrders();
      void fetchCustomRequests();
    }
  }, [session]);

  useEffect(() => {
    if (emailParam) setCustomTrackEmail(emailParam);
    else if (session?.email) setCustomTrackEmail(session.email);
  }, [emailParam, session?.email]);

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch { toast.error("Failed to load orders"); }
    finally { setIsOrdersLoading(false); }
  };

  const fetchCustomRequests = async () => {
    setIsCustomRequestsLoading(true);
    try {
      const response = await fetch("/api/custom-order-requests");
      if (response.ok) {
        const data = await response.json();
        setCustomRequests(data.requests || []);
      } else if (response.status !== 404) {
        toast.error("Failed to load custom requests");
      }
    } catch { toast.error("Failed to load custom requests"); }
    finally { setIsCustomRequestsLoading(false); }
  };

  const trackOrderByNumber = useCallback(async (orderNumber: string) => {
    const trimmed = orderNumber.trim();
    if (!trimmed) { toast.error("Please enter an order number"); return; }
    setIsTrackingLoading(true);
    try {
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(trimmed)}`);
      if (!response.ok) { toast.error("Order not found"); return; }
      const data = await response.json();
      const order = data.order as Order;
      router.push(`/order/${order.id}?orderNumber=${encodeURIComponent(order.orderNumber)}`);
      setIsTrackingModalOpen(false);
    } catch { toast.error("Failed to track order"); }
    finally { setIsTrackingLoading(false); }
  }, [router]);

  const trackCustomRequest = useCallback(async (requestNumber: string, email: string) => {
    const trimmedRequestNumber = requestNumber.trim();
    const trimmedEmail = email.trim();
    if (!trimmedRequestNumber || !trimmedEmail) {
      toast.error("Request number and email are required");
      return;
    }
    setIsCustomTrackingLoading(true);
    try {
      const response = await fetch(
        `/api/custom-order-requests/track?requestNumber=${encodeURIComponent(trimmedRequestNumber)}&email=${encodeURIComponent(trimmedEmail)}`,
      );
      if (!response.ok) { setTrackedCustomRequest(null); toast.error("Custom request not found"); return; }
      const data = await response.json();
      setTrackedCustomRequest(data.request || null);
    } catch { setTrackedCustomRequest(null); toast.error("Failed to track custom request"); }
    finally { setIsCustomTrackingLoading(false); }
  }, []);

  useEffect(() => {
    if (!orderNumberParam) return;
    if (autoTrackedOrderRef.current === orderNumberParam) return;
    autoTrackedOrderRef.current = orderNumberParam;
    setTrackingInput(orderNumberParam);
    setTrackingMode("order");
    setIsTrackingModalOpen(true);
    void trackOrderByNumber(orderNumberParam);
  }, [orderNumberParam, trackOrderByNumber]);

  useEffect(() => {
    if (!customRequestParam) return;
    if (autoTrackedCustomRef.current === customRequestParam) return;
    if (!customTrackEmail && !emailParam) return;
    autoTrackedCustomRef.current = customRequestParam;
    setCustomTrackRequestNumber(customRequestParam);
    setTrackingMode("custom");
    setIsTrackingModalOpen(true);
    void trackCustomRequest(customRequestParam, customTrackEmail || emailParam || "");
  }, [customRequestParam, customTrackEmail, emailParam, trackCustomRequest]);

  if (status === "loading") return <PageLoader size="lg" message="Loading orders..." />;

  const hasTrackingResults = Boolean(
    trackedCustomRequest || (customRequestParam && (customTrackEmail || emailParam)),
  );
  const openTrackingModal = (mode: "order" | "custom") => {
    setTrackingMode(mode);
    setIsTrackingModalOpen(true);
  };

  return (
    <>
      <style>{`

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

        .op-root {
          font-family: var(--font-dm-sans), sans-serif;
          color: var(--cream);
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 80px;
        }

        /* ── PAGE HERO ── */
        .op-hero {
          background: rgba(16,12,6,0.95);
          border: 1px solid var(--border);
          padding: 48px;
          position: relative;
          overflow: hidden;
        }
        .op-hero::before {
          content: '';
          position: absolute;
          right: -50px; top: -50px;
          width: 240px; height: 240px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .op-hero::after {
          content: '';
          position: absolute;
          right: 40px; top: 40px;
          width: 110px; height: 110px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .op-hero-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--terra);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        .op-hero-eyebrow::before {
          content: '';
          display: block;
          width: 28px; height: 1px;
          background: var(--terra);
        }
        .op-hero-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 300;
          line-height: 1.0;
          color: var(--cream);
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        .op-hero-title em { font-style: italic; color: var(--terra); }
        .op-hero-sub {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 28px;
          max-width: 520px;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }
        .op-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          position: relative;
          z-index: 1;
        }
        .op-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--terra);
          border: none;
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 22px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .op-btn-primary:hover { background: #a34d22; }
        .op-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid var(--border-mid);
          color: var(--muted);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 22px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .op-btn-secondary:hover {
          border-color: rgba(242,232,213,0.35);
          color: var(--cream);
          background: rgba(242,232,213,0.03);
        }

        /* ── PANEL ── */
        .op-panel {
          border: 1px solid var(--border);
          border-top: none;
          background: rgba(16,12,6,0.7);
          padding: 36px 48px;
        }
        .op-panel-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .op-panel-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 26px;
          font-weight: 300;
          color: var(--cream);
        }
        .op-panel-count {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .op-accent {
          height: 1px;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 50%, transparent 100%);
          margin-bottom: 28px;
        }

        /* ── ORDER GRID ── */
        .op-order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2px;
        }

        /* ── ORDER CARD ── */
        .op-order-card {
          border: 1px solid var(--border);
          background: rgba(242,232,213,0.02);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: background 0.25s, border-color 0.25s;
        }
        .op-order-card:hover {
          background: rgba(242,232,213,0.04);
          border-color: var(--border-mid);
        }
        .op-card-eyebrow {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 8px;
        }
        .op-card-number {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 22px;
          font-weight: 400;
          color: var(--cream);
          overflow-wrap: anywhere;
          margin-bottom: 6px;
          line-height: 1.1;
        }
        .op-card-date {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 20px;
          letter-spacing: 0.03em;
        }
        .op-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .op-status-badge {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 5px 12px;
          border: 1px solid rgba(191,90,40,0.35);
          background: rgba(191,90,40,0.08);
          color: var(--terra);
          flex-shrink: 0;
        }
        .op-view-link {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .op-view-link:hover { color: var(--cream); }
        .op-view-link::after { content: '→'; }

        /* ── CUSTOM REQUEST CARD ── */
        .op-cr-card {
          border: 1px solid var(--border);
          background: rgba(242,232,213,0.02);
          padding: 28px;
          transition: background 0.25s, border-color 0.25s;
        }
        .op-cr-card:hover {
          background: rgba(242,232,213,0.04);
          border-color: var(--border-mid);
        }
        .op-cr-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: start;
          margin-bottom: 16px;
        }
        .op-cr-number {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 22px;
          font-weight: 400;
          color: var(--cream);
          overflow-wrap: anywhere;
          margin-bottom: 4px;
          line-height: 1.1;
        }
        .op-cr-subtitle {
          font-size: 12px;
          color: var(--muted);
          letter-spacing: 0.03em;
        }
        .op-cr-right { text-align: right; }
        .op-cr-status {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 5px 12px;
          border: 1px solid var(--border-mid);
          color: var(--sand);
          display: inline-block;
          margin-bottom: 8px;
        }
        .op-cr-price p,
        .op-cr-price span {
          color: var(--gold) !important;
          font-family: var(--font-cormorant-garamond), serif !important;
          font-size: 20px !important;
          font-weight: 400 !important;
        }
        .op-cr-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.7;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 12px;
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }
        .op-cr-expiry {
          font-size: 11px;
          color: rgba(192,137,42,0.7);
          letter-spacing: 0.06em;
        }

        /* ── SKELETON ── */
        @keyframes op-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.55; }
        }
        .op-skeleton {
          height: 140px;
          background: rgba(242,232,213,0.04);
          border: 1px solid var(--border);
          animation: op-pulse 1.8s ease-in-out infinite;
        }
        .op-skeleton + .op-skeleton { animation-delay: 0.2s; border-top: none; }

        /* ── EMPTY / AUTH STATES ── */
        .op-empty {
          border: 1px dashed rgba(242,232,213,0.1);
          padding: 56px 40px;
          text-align: center;
        }
        .op-empty-text {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 20px;
          font-weight: 300;
          font-style: italic;
          color: var(--muted);
          margin-bottom: 16px;
        }
        .op-empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--terra);
          border: none;
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 11px 22px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .op-empty-cta:hover { background: #a34d22; }
        .op-empty-cta-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border-mid);
          color: var(--muted);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 11px 22px;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .op-empty-cta-ghost:hover { border-color: rgba(242,232,213,0.35); color: var(--cream); }

        /* ── TRACKING RESULT ── */
        .op-track-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .op-track-another {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--terra);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .op-track-another:hover { color: #d96a30; }

        /* ── MODAL ── */
        .op-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(10,7,4,0.85);
          backdrop-filter: blur(4px);
        }
        .op-modal {
          width: 100%;
          max-width: 500px;
          background: #100C06;
          border: 1px solid var(--border-mid);
          padding: 36px;
        }
        .op-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .op-modal-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 28px;
          font-weight: 300;
          color: var(--cream);
          margin-bottom: 4px;
          line-height: 1.05;
        }
        .op-modal-sub {
          font-size: 13px;
          color: var(--muted);
        }
        .op-modal-close {
          background: transparent;
          border: 1px solid var(--border-mid);
          color: var(--muted);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 7px 14px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .op-modal-close:hover { color: var(--cream); border-color: rgba(242,232,213,0.35); }

        /* Mode toggle */
        .op-mode-toggle {
          display: inline-flex;
          background: rgba(242,232,213,0.04);
          border: 1px solid var(--border);
          padding: 3px;
          gap: 2px;
          margin-bottom: 24px;
        }
        .op-mode-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 9px 16px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .op-mode-btn-active {
          background: var(--terra);
          color: var(--cream);
        }

        /* Form inputs */
        .op-form { display: flex; flex-direction: column; gap: 10px; }
        .op-input {
          width: 100%;
          background: rgba(10,7,4,0.7);
          border: 1px solid rgba(242,232,213,0.09);
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .op-input::placeholder { color: var(--muted); }
        .op-input:focus { border-color: rgba(191,90,40,0.5); }
        .op-form-submit {
          width: 100%;
          background: var(--terra);
          border: none;
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 14px;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 4px;
        }
        .op-form-submit:hover { background: #a34d22; }
        .op-form-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        @media (max-width: 768px) {
          .op-hero { padding: 28px 24px; }
          .op-panel { padding: 24px; }
          .op-modal { padding: 24px; }
          .op-order-grid { grid-template-columns: 1fr; }
          .op-cr-grid { grid-template-columns: 1fr; }
          .op-cr-right { text-align: left; }
        }
      `}</style>

      <div className="op-root">
        {/* ── HERO ── */}
        <header className="op-hero">
          <div className="op-hero-eyebrow">Account</div>
          <h1 className="op-hero-title">
            Your <em>Orders</em>
          </h1>
          <p className="op-hero-sub">
            Catalog purchases and custom requests in dedicated sections. Open tracking only when you need it.
          </p>
          <div className="op-hero-actions">
            <button type="button" onClick={() => openTrackingModal("order")} className="op-btn-primary">
              Track order →
            </button>
            <button type="button" onClick={() => openTrackingModal("custom")} className="op-btn-secondary">
              Track custom request
            </button>
          </div>
        </header>

        {/* ── TRACKING RESULT ── */}
        {hasTrackingResults && (
          <div className="op-panel">
            <div className="op-accent" />
            <div className="op-track-result-header">
              <h2 style={{ fontFamily: "var(--font-cormorant-garamond), serif", fontSize: "26px", fontWeight: 300, color: "var(--cream)" }}>
                Tracking result
              </h2>
              <button type="button" onClick={() => setIsTrackingModalOpen(true)} className="op-track-another">
                Track another →
              </button>
            </div>
            {trackedCustomRequest ? <CustomRequestCard request={trackedCustomRequest} /> : null}
            {customRequestParam && !trackedCustomRequest && !isCustomTrackingLoading ? (
              <div className="op-empty">
                <p className="op-empty-text">No matching request found.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── CATALOG ORDERS ── */}
        {session && (
          <div className="op-panel">
            <div className="op-accent" />
            <div className="op-panel-head">
              <h2 className="op-panel-title">Catalog orders</h2>
              <span className="op-panel-count">{orders.length} total</span>
            </div>

            {isOrdersLoading ? (
              <div>
                <div className="op-skeleton" />
                <div className="op-skeleton" />
              </div>
            ) : orders.length > 0 ? (
              <div className="op-order-grid">
                {orders.map((order) => <OrderCard key={order.id} order={order} />)}
              </div>
            ) : (
              <div className="op-empty">
                <p className="op-empty-text">No orders placed yet.</p>
                <Link href="/products" className="op-empty-cta">Start shopping →</Link>
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOM REQUESTS ── */}
        {session && (
          <div className="op-panel">
            <div className="op-accent" />
            <div className="op-panel-head">
              <h2 className="op-panel-title">Custom requests</h2>
              <span className="op-panel-count">{customRequests.length} total</span>
            </div>

            {isCustomRequestsLoading ? (
              <div>
                <div className="op-skeleton" />
                <div className="op-skeleton" />
              </div>
            ) : customRequests.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {customRequests.map((request) => <CustomRequestCard key={request.id} request={request} />)}
              </div>
            ) : (
              <div className="op-empty">
                <p className="op-empty-text">No custom requests yet.</p>
                <Link href="/custom-orders" className="op-empty-cta-ghost">Start a custom order →</Link>
              </div>
            )}
          </div>
        )}

        {/* ── UNAUTHENTICATED ── */}
        {!session && (
          <div className="op-panel">
            <div className="op-empty">
              <p className="op-empty-text">Sign in to see your orders.</p>
              <Link href="/auth/login?callbackUrl=/orders" className="op-empty-cta">
                Login to account →
              </Link>
            </div>
          </div>
        )}

        {/* ── TRACKING MODAL ── */}
        {isTrackingModalOpen && (
          <TrackingModal
            trackingMode={trackingMode}
            setTrackingMode={setTrackingMode}
            trackingInput={trackingInput}
            setTrackingInput={setTrackingInput}
            isTrackingLoading={isTrackingLoading}
            onTrackOrder={trackOrderByNumber}
            customTrackRequestNumber={customTrackRequestNumber}
            setCustomTrackRequestNumber={setCustomTrackRequestNumber}
            customTrackEmail={customTrackEmail}
            setCustomTrackEmail={setCustomTrackEmail}
            isCustomTrackingLoading={isCustomTrackingLoading}
            onTrackCustomRequest={trackCustomRequest}
            onClose={() => setIsTrackingModalOpen(false)}
          />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────── TRACKING MODAL ─────────────────────────── */

type TrackingModalProps = {
  trackingMode: "order" | "custom";
  setTrackingMode: (mode: "order" | "custom") => void;
  trackingInput: string;
  setTrackingInput: (value: string) => void;
  isTrackingLoading: boolean;
  onTrackOrder: (orderNumber: string) => Promise<void>;
  customTrackRequestNumber: string;
  setCustomTrackRequestNumber: (value: string) => void;
  customTrackEmail: string;
  setCustomTrackEmail: (value: string) => void;
  isCustomTrackingLoading: boolean;
  onTrackCustomRequest: (requestNumber: string, email: string) => Promise<void>;
  onClose: () => void;
};

function TrackingModal({
  trackingMode, setTrackingMode,
  trackingInput, setTrackingInput,
  isTrackingLoading, onTrackOrder,
  customTrackRequestNumber, setCustomTrackRequestNumber,
  customTrackEmail, setCustomTrackEmail,
  isCustomTrackingLoading, onTrackCustomRequest,
  onClose,
}: TrackingModalProps) {
  return (
    <div className="op-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="op-modal">
        <div className="op-modal-head">
          <div>
            <h2 className="op-modal-title">Track shipment</h2>
            <p className="op-modal-sub">Choose what to track and submit your details.</p>
          </div>
          <button type="button" onClick={onClose} className="op-modal-close">Close ✕</button>
        </div>

        <div className="op-mode-toggle">
          <button
            type="button"
            onClick={() => setTrackingMode("order")}
            className={`op-mode-btn${trackingMode === "order" ? " op-mode-btn-active" : ""}`}
          >
            Order
          </button>
          <button
            type="button"
            onClick={() => setTrackingMode("custom")}
            className={`op-mode-btn${trackingMode === "custom" ? " op-mode-btn-active" : ""}`}
          >
            Custom request
          </button>
        </div>

        {trackingMode === "order" ? (
          <form
            className="op-form"
            onSubmit={(e) => { e.preventDefault(); void onTrackOrder(trackingInput); }}
          >
            <input
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Order number (e.g. ORD-123456)"
              className="op-input"
            />
            <button type="submit" disabled={isTrackingLoading} className="op-form-submit">
              {isTrackingLoading ? "Checking..." : "Track order →"}
            </button>
          </form>
        ) : (
          <form
            className="op-form"
            onSubmit={(e) => { e.preventDefault(); void onTrackCustomRequest(customTrackRequestNumber, customTrackEmail); }}
          >
            <input
              value={customTrackRequestNumber}
              onChange={(e) => setCustomTrackRequestNumber(e.target.value)}
              placeholder="Request number (e.g. COR-123456)"
              className="op-input"
            />
            <input
              type="email"
              value={customTrackEmail}
              onChange={(e) => setCustomTrackEmail(e.target.value)}
              placeholder="Email address"
              className="op-input"
            />
            <button type="submit" disabled={isCustomTrackingLoading} className="op-form-submit">
              {isCustomTrackingLoading ? "Checking..." : "Track custom request →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── ORDER CARD ─────────────────────────── */

function OrderCard({ order }: { order: Order }) {
  const createdDate = new Date(order.createdAt).toLocaleDateString();
  return (
    <article className="op-order-card">
      <div className="op-card-eyebrow">Catalog order</div>
      <h3 className="op-card-number">{order.orderNumber}</h3>
      <p className="op-card-date">Placed on {createdDate}</p>
      <div className="op-card-footer">
        <span className="op-status-badge">
          {order.deliveryStatus
            ? getDeliveryStatusLabel(order.deliveryStatus)
            : order.status}
        </span>
        <Link href={`/order/${order.id}`} className="op-view-link">
          View details
        </Link>
      </div>
    </article>
  );
}

/* ─────────────────────────── CUSTOM REQUEST CARD ─────────────────────────── */

function CustomRequestCard({ request }: { request: CustomRequest }) {
  const createdDate = new Date(request.createdAt).toLocaleDateString();
  const quoteAmount = request.latestQuote?.amount || request.quotedAmount;
  const currencyCode = request.latestQuote?.currencyCode || request.currencyCode || "NGN";

  return (
    <article className="op-cr-card">
      <div className="op-cr-grid">
        <div>
          <div className="op-card-eyebrow">Custom request</div>
          <h3 className="op-cr-number">{request.requestNumber}</h3>
          <p className="op-cr-subtitle">{request.title} · {createdDate}</p>
        </div>
        <div className="op-cr-right">
          <span className="op-cr-status">{request.status}</span>
          {quoteAmount && (
            <div className="op-cr-price">
              <Price
                amount={quoteAmount}
                currencyCode={currencyCode}
                currencyCodeClassName="hidden"
                className="inline"
              />
            </div>
          )}
        </div>
      </div>

      <p className="op-cr-desc">{request.description}</p>

      {request.quoteExpiresAt && (
        <p className="op-cr-expiry">
          Quote expires: {new Date(request.quoteExpiresAt).toLocaleString()}
        </p>
      )}
    </article>
  );
}