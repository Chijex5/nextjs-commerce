"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  PencilSquareIcon,
  ShoppingCartIcon,
  TagIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import { trackInitiateCheckout } from "lib/analytics";
import { DEFAULT_OPTION } from "lib/constants";
import {
  COUPON_STORAGE_KEY,
  getCouponCustomerKey,
  getStoredCoupon,
} from "lib/coupon-storage";
import { calculateShippingAmount } from "lib/shipping";
import { createUrl } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { redirectToCheckout } from "./actions";
import { useCart } from "./cart-context";
import CouponInput from "./coupon-input";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";

type MerchandiseSearchParams = {
  [key: string]: string;
};

const ORDER_NOTE_STORAGE_KEY = "orderNote";
const DEV_COUPON_DEBUG = process.env.NODE_ENV !== "production";

function logCouponDebug(message: string, payload?: unknown) {
  if (!DEV_COUPON_DEBUG) return;
  console.debug(`[coupon][cart-modal] ${message}`, payload);
}

export default function CartModal() {
  const { cart } = useCart();
  const { data: session, status } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<"coupon" | "note" | "shipping" | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingDiscountAmount, setShippingDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [shippingAddress, setShippingAddress] = useState<{ state?: string; lga?: string; ward?: string } | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity);
  const openCart = () => setIsOpen(true);
  const closeCart = () => { setIsOpen(false); setActiveSheet(null); };

  const baseSummaryTotal = cart
    ? Math.max(parseFloat(cart.cost.totalAmount.amount) - discountAmount, 0)
    : 0;

  const shippingPreview = useMemo(() => {
    if (!cart || !shippingAddress?.state) return null;
    const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
    const totalQuantity = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
    return calculateShippingAmount({ address: shippingAddress, subtotalAmount: subtotal, totalQuantity });
  }, [cart, shippingAddress]);

  const effectiveShippingDiscount =
    shippingPreview !== null
      ? Math.min(Math.max(shippingDiscountAmount, 0), Math.max(shippingPreview, 0))
      : 0;
  const netShippingPreview =
    shippingPreview !== null ? Math.max(shippingPreview - effectiveShippingDiscount, 0) : null;
  const summaryTotal =
    netShippingPreview !== null
      ? Math.max(baseSummaryTotal + (netShippingPreview ?? 0), 0)
      : baseSummaryTotal;
  const summaryCurrency = cart?.cost.totalAmount.currencyCode ?? "USD";
  const formattedSummaryTotal = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: summaryCurrency,
    currencyDisplay: "narrowSymbol",
  }).format(summaryTotal);

  const handleCouponApply = (
    amount: number,
    code: string,
    couponMeta?: {
      shippingDiscountAmount?: number;
      productDiscountAmount?: number;
      grantsFreeShipping?: boolean;
      includeShippingInDiscount?: boolean;
    },
  ) => {
    setDiscountAmount(amount);
    setShippingDiscountAmount(couponMeta?.shippingDiscountAmount || 0);
    setCouponCode(code);
    if (activeSheet === "coupon" && amount > 0) setActiveSheet(null);
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setShippingDiscountAmount(0);
    setCouponCode("");
    try { localStorage.removeItem(COUPON_STORAGE_KEY); } catch { }
  };

  useEffect(() => {
    if (status !== "authenticated") { setShippingAddress(null); return; }
    let isMounted = true;
    const fetchAddress = async () => {
      setShippingLoading(true);
      try {
        const response = await fetch("/api/user-auth/addresses");
        if (!response.ok) { if (isMounted) setShippingAddress(null); return; }
        const data = await response.json();
        if (isMounted) setShippingAddress(data?.addresses?.shippingAddress || null);
      } catch { if (isMounted) setShippingAddress(null); }
      finally { if (isMounted) setShippingLoading(false); }
    };
    void fetchAddress();
    return () => { isMounted = false; };
  }, [status]);

  useEffect(() => {
    let isMounted = true;
    const hydrateStoredCoupon = async () => {
      if (!cart?.id) {
        if (isMounted) { setDiscountAmount(0); setCouponCode(""); }
        return;
      }
      try {
        const customerKey = getCouponCustomerKey(status === "authenticated" ? session?.id : undefined);
        const storedCoupon = getStoredCoupon(cart.id, customerKey);
        if (!storedCoupon) {
          if (isMounted) { setDiscountAmount(0); setShippingDiscountAmount(0); setCouponCode(""); }
          return;
        }
        const payload: { code: string; cartTotal: number; shippingAmount: number; sessionId?: string } = {
          code: storedCoupon.code,
          cartTotal: parseFloat(cart.cost.subtotalAmount.amount),
          shippingAmount: shippingPreview ?? 0,
        };
        if (status !== "authenticated") payload.sessionId = customerKey.replace("guest:", "");
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          logCouponDebug("Hydrate revalidation failed", { cartId: cart.id, customerKey, status: response.status, payload });
          if (isMounted) { setDiscountAmount(0); setShippingDiscountAmount(0); setCouponCode(""); }
          return;
        }
        const data = await response.json();
        if (isMounted) {
          setDiscountAmount(data.coupon.discountAmount || 0);
          setShippingDiscountAmount(data.coupon.shippingDiscountAmount || 0);
          setCouponCode(data.coupon.code || "");
        }
      } catch {
        logCouponDebug("Hydrate revalidation error", { cartId: cart.id });
        if (isMounted) { setDiscountAmount(0); setShippingDiscountAmount(0); setCouponCode(""); }
      }
    };
    void hydrateStoredCoupon();
    return () => { isMounted = false; };
  }, [cart?.id, cart?.cost.subtotalAmount.amount, session?.id, shippingPreview, status]);

  useEffect(() => {
    if (cart?.totalQuantity && cart?.totalQuantity !== quantityRef.current && cart?.totalQuantity > 0) {
      if (!isOpen) setIsOpen(true);
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isOpen, cart?.totalQuantity, quantityRef]);

  useEffect(() => {
    try {
      const storedNote = localStorage.getItem(ORDER_NOTE_STORAGE_KEY);
      if (storedNote) setOrderNote(storedNote);
    } catch { }
  }, []);

  const openNoteSheet = () => { setNoteDraft(orderNote); setActiveSheet("note"); };
  const handleSaveNote = () => {
    const trimmedNote = noteDraft.trim();
    setOrderNote(trimmedNote);
    try {
      if (trimmedNote) localStorage.setItem(ORDER_NOTE_STORAGE_KEY, trimmedNote);
      else localStorage.removeItem(ORDER_NOTE_STORAGE_KEY);
    } catch { }
    setActiveSheet(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
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
        .dp-cart-wordmark { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.1em; }
        .dp-cart-sans     { font-family: 'DM Sans', sans-serif; }

        .dp-cart-action-btn {
          display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
          flex: 1;
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 0.6rem 0.65rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          text-align: left;
        }
        .dp-cart-action-btn:hover {
          border-color: rgba(242,232,213,0.2);
          background: rgba(242,232,213,0.04);
        }
        .dp-cart-action-btn.active {
          border-color: var(--dp-ember);
        }

        .dp-summary-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.55rem 1rem;
          border-bottom: 1px solid var(--dp-border);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          color: var(--dp-muted);
        }
        .dp-summary-row:last-child { border-bottom: none; }

        .dp-cart-item {
          display: flex; width: 100%; flex-direction: row; justify-content: space-between;
          padding: 0.875rem 0.25rem;
          border-bottom: 1px solid var(--dp-border);
          position: relative;
        }

        @keyframes dp-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes dp-slide-out {
          from { transform: translateX(0); }
          to   { transform: translateX(100%); }
        }
        @keyframes dp-sheet-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        /* Qty button */
        .dp-qty-btn {
          display: flex; align-items: center; justify-content: center;
          width: 1.75rem; height: 1.75rem;
          border: 1px solid var(--dp-border);
          background: transparent; color: var(--dp-muted); cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .dp-qty-btn:hover { border-color: rgba(242,232,213,0.3); color: var(--dp-cream); }

        /* Scrollbar */
        .dp-cart-scroll::-webkit-scrollbar { width: 3px; }
        .dp-cart-scroll::-webkit-scrollbar-track { background: transparent; }
        .dp-cart-scroll::-webkit-scrollbar-thumb { background: var(--dp-border); }
      `}</style>

      <button aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={cart?.totalQuantity} />
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0" style={{ background: "rgba(6,4,2,0.7)", backdropFilter: "blur(2px)" }} aria-hidden="true" />
          </Transition.Child>

          {/* Panel */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel
              className="dp-cart-sans fixed bottom-0 right-0 top-0 flex h-full w-full flex-col md:w-[400px]"
              style={{
                background: "var(--dp-ink)",
                borderLeft: "1px solid var(--dp-border)",
              }}
            >
              {/* Top ember accent */}
              <div style={{ height: 2, background: "linear-gradient(90deg, var(--dp-ember), var(--dp-gold) 60%, transparent 100%)", flexShrink: 0 }} />

              {/* Header */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1.1rem 1.25rem 1rem",
                  borderBottom: "1px solid var(--dp-border)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    className="dp-cart-wordmark"
                    style={{ fontSize: "1.1rem", color: "var(--dp-cream)", letterSpacing: "0.12em" }}
                  >
                    Your Cart
                  </span>
                  {cart && cart.lines.length > 0 && (
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500,
                        letterSpacing: "0.1em", color: "var(--dp-ember)",
                        border: "1px solid var(--dp-ember)", padding: "1px 7px",
                      }}
                    >
                      {cart.totalQuantity} {cart.totalQuantity === 1 ? "ITEM" : "ITEMS"}
                    </span>
                  )}
                </div>
                <button
                  aria-label="Close cart"
                  onClick={closeCart}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "2rem", height: "2rem",
                    border: "1px solid var(--dp-border)",
                    background: "transparent", color: "var(--dp-muted)", cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(242,232,213,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-cream)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--dp-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-muted)"; }}
                >
                  <XMarkIcon style={{ width: "1rem", height: "1rem" }} />
                </button>
              </div>

              {/* Empty state */}
              {!cart || cart.lines.length === 0 ? (
                <div
                  style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "1rem",
                    padding: "2rem",
                  }}
                >
                  <ShoppingCartIcon style={{ width: "3rem", height: "3rem", color: "var(--dp-muted)" }} />
                  <p
                    className="dp-cart-wordmark"
                    style={{ fontSize: "1.5rem", color: "var(--dp-sand)", letterSpacing: "0.1em", textAlign: "center" }}
                  >
                    Your cart is empty
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--dp-muted)", textAlign: "center", lineHeight: 1.6 }}>
                    Discover our handcrafted footwear collection
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    style={{
                      marginTop: "0.5rem",
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                      background: "var(--dp-ember)", color: "var(--dp-cream)",
                      fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                      fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                      padding: "0.75rem 1.75rem", textDecoration: "none",
                      transition: "opacity 0.2s",
                    }}
                  >
                    Shop Collection
                  </Link>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                  {/* Cart items */}
                  <ul
                    className="dp-cart-scroll"
                    style={{ flex: 1, overflowY: "auto", padding: "0 1.25rem" }}
                  >
                    {cart.lines
                      .sort((a, b) => a.merchandise.product.title.localeCompare(b.merchandise.product.title))
                      .map((item) => {
                        const merchandiseSearchParams = {} as MerchandiseSearchParams;
                        item.merchandise.selectedOptions.forEach(({ name, value }) => {
                          if (value !== DEFAULT_OPTION) merchandiseSearchParams[name.toLowerCase()] = value;
                        });
                        const merchandiseUrl = createUrl(
                          `/product/${item.merchandise.product.handle}`,
                          new URLSearchParams(merchandiseSearchParams),
                        );

                        return (
                          <li key={item.id ?? item.merchandise.id} className="dp-cart-item">
                            {/* Delete */}
                            <div style={{ position: "absolute", top: "0.6rem", left: "-0.25rem", zIndex: 10 }}>
                              <DeleteItemButton item={item} />
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                              {/* Image */}
                              <div
                                style={{
                                  position: "relative", width: 68, height: 68, flexShrink: 0,
                                  background: "var(--dp-charcoal)", overflow: "hidden",
                                }}
                              >
                                <Image
                                  fill
                                  sizes="68px"
                                  className="object-cover"
                                  alt={item.merchandise.product.featuredImage?.altText || item.merchandise.product.title}
                                  src={item.merchandise.product.featuredImage.url}
                                />
                              </div>

                              {/* Info */}
                              <Link
                                href={merchandiseUrl}
                                onClick={closeCart}
                                style={{ flex: 1, minWidth: 0, textDecoration: "none" }}
                              >
                                <p
                                  className="line-clamp-2"
                                  style={{ fontSize: "0.78rem", color: "var(--dp-sand)", lineHeight: 1.4, fontFamily: "DM Sans, sans-serif" }}
                                >
                                  {item.merchandise.product.title}
                                </p>
                                {item.merchandise.title !== DEFAULT_OPTION && (
                                  <p style={{ fontSize: "0.68rem", color: "var(--dp-muted)", marginTop: "0.2rem", fontFamily: "DM Sans, sans-serif" }}>
                                    {item.merchandise.title}
                                  </p>
                                )}
                              </Link>
                            </div>

                            {/* Price + Qty */}
                            <div
                              style={{
                                display: "flex", flexDirection: "column", alignItems: "flex-end",
                                justifyContent: "space-between", height: 68, flexShrink: 0, paddingLeft: "0.5rem",
                              }}
                            >
                              <Price
                                amount={item.cost.totalAmount.amount}
                                currencyCode={item.cost.totalAmount.currencyCode}
                                currencyCodeClassName="hidden"
                                className="dp-cart-wordmark"
                                style={{ fontSize: "0.9rem", color: "var(--dp-cream)" } as React.CSSProperties}
                              />
                              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--dp-border)" }}>
                                <EditItemQuantityButton item={item} type="minus" />
                                <span
                                  style={{
                                    width: "1.6rem", textAlign: "center",
                                    fontSize: "0.72rem", fontFamily: "DM Sans, sans-serif", color: "var(--dp-sand)",
                                  }}
                                >
                                  {item.quantity}
                                </span>
                                <EditItemQuantityButton item={item} type="plus" />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>

                  {/* Bottom area */}
                  <div style={{ flexShrink: 0, padding: "0.875rem 1.25rem 1.25rem", borderTop: "1px solid var(--dp-border)" }}>

                    {/* Action buttons: note / shipping / coupon */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem" }}>
                      <button
                        type="button"
                        onClick={openNoteSheet}
                        className={clsx("dp-cart-action-btn", activeSheet === "note" && "active")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--dp-sand)" }}>
                          <PencilSquareIcon style={{ width: "0.85rem", height: "0.85rem" }} />
                          <span style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Note</span>
                        </div>
                        <span style={{ fontSize: "0.6rem", color: orderNote ? "var(--dp-ember)" : "var(--dp-muted)" }}>
                          {orderNote ? "Added ✓" : "Optional"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSheet("shipping")}
                        className={clsx("dp-cart-action-btn", activeSheet === "shipping" && "active")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--dp-sand)" }}>
                          <TruckIcon style={{ width: "0.85rem", height: "0.85rem" }} />
                          <span style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Shipping</span>
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "var(--dp-muted)" }}>
                          {shippingLoading ? "Loading…" : shippingPreview !== null ? `₦${shippingPreview.toLocaleString()}` : "At checkout"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { if (couponCode) { handleRemoveCoupon(); return; } setActiveSheet("coupon"); }}
                        className={clsx("dp-cart-action-btn", activeSheet === "coupon" && "active", couponCode && "active")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: couponCode ? "var(--dp-ember)" : "var(--dp-sand)" }}>
                          <TagIcon style={{ width: "0.85rem", height: "0.85rem" }} />
                          <span style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {couponCode ? "Applied" : "Coupon"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.6rem", color: couponCode ? "var(--dp-ember)" : "var(--dp-muted)" }}>
                          {couponCode ? `Remove ${couponCode}` : "Add code"}
                        </span>
                      </button>
                    </div>

                    {/* Order summary */}
                    <div
                      style={{
                        border: "1px solid var(--dp-border)",
                        marginBottom: "0.875rem",
                        background: "var(--dp-charcoal)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setIsSummaryOpen((p) => !p)}
                        style={{
                          display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                          padding: "0.75rem 1rem",
                          background: "transparent", border: "none", cursor: "pointer",
                        }}
                        aria-expanded={isSummaryOpen}
                      >
                        <div>
                          <p
                            style={{
                              fontFamily: "DM Sans, sans-serif", fontSize: "0.58rem", fontWeight: 500,
                              letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--dp-ember)",
                              marginBottom: "0.2rem",
                            }}
                          >
                            Order Summary
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                              className="dp-cart-wordmark"
                              style={{ fontSize: "1.15rem", color: "var(--dp-cream)" }}
                              suppressHydrationWarning
                            >
                              {formattedSummaryTotal}
                            </span>
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", color: "var(--dp-muted)", letterSpacing: "0.08em" }}>
                              {summaryCurrency}
                            </span>
                          </div>
                        </div>
                        <ChevronDownIcon
                          style={{
                            width: "1rem", height: "1rem", color: "var(--dp-muted)",
                            transition: "transform 0.2s",
                            transform: isSummaryOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>

                      {isSummaryOpen && (
                        <div style={{ borderTop: "1px solid var(--dp-border)" }}>
                          <div className="dp-summary-row">
                            <span>Subtotal</span>
                            <Price
                              amount={cart.cost.subtotalAmount.amount}
                              currencyCode={cart.cost.subtotalAmount.currencyCode}
                              currencyCodeClassName="hidden"
                              style={{ color: "var(--dp-sand)", fontSize: "0.75rem" } as React.CSSProperties}
                            />
                          </div>
                          {discountAmount > 0 && (
                            <div className="dp-summary-row">
                              <span style={{ color: "var(--dp-green)" }}>Discount ({couponCode})</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ color: "var(--dp-green)", fontFamily: "DM Sans, sans-serif" }}>-₦{discountAmount.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={handleRemoveCoupon}
                                  style={{
                                    fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500,
                                    color: "var(--dp-ember)", background: "none", border: "none", cursor: "pointer",
                                    textDecoration: "underline", letterSpacing: "0.06em",
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="dp-summary-row">
                            <span>Taxes</span>
                            <Price
                              amount={cart.cost.totalTaxAmount.amount}
                              currencyCode={cart.cost.totalTaxAmount.currencyCode}
                              currencyCodeClassName="hidden"
                              style={{ color: "var(--dp-sand)", fontSize: "0.75rem" } as React.CSSProperties}
                            />
                          </div>
                          <div className="dp-summary-row">
                            <span>Shipping</span>
                            {shippingPreview !== null ? (
                              <div style={{ textAlign: "right" }}>
                                <p style={{ color: "var(--dp-sand)", fontFamily: "DM Sans, sans-serif" }}>₦{(netShippingPreview ?? 0).toLocaleString()}</p>
                                {effectiveShippingDiscount > 0 && (
                                  <p style={{ fontSize: "0.65rem", color: "var(--dp-green)", fontFamily: "DM Sans, sans-serif" }}>
                                    Saved ₦{effectiveShippingDiscount.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.68rem", color: "var(--dp-muted)", fontFamily: "DM Sans, sans-serif" }}>At checkout</span>
                            )}
                          </div>
                          <div className="dp-summary-row" style={{ borderTop: "1px solid var(--dp-border)" }}>
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500, color: "var(--dp-cream)", fontSize: "0.8rem" }}>Total</span>
                            <Price
                              amount={Math.max(
                                parseFloat(cart.cost.totalAmount.amount) - discountAmount + (netShippingPreview ?? 0),
                                0,
                              ).toString()}
                              currencyCode={cart.cost.totalAmount.currencyCode}
                              currencyCodeClassName="hidden"
                              className="dp-cart-wordmark"
                              style={{ fontSize: "1rem", color: "var(--dp-cream)" } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Auth nudge */}
                    {status === "unauthenticated" && (
                      <div
                        style={{
                          marginBottom: "0.875rem", padding: "0.75rem",
                          border: "1px solid var(--dp-border)", background: "var(--dp-card)",
                        }}
                      >
                        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "var(--dp-sand)" }}>
                          Save your cart &amp; track orders
                        </p>
                        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.65rem", color: "var(--dp-muted)", marginTop: "0.2rem", lineHeight: 1.5 }}>
                          Create an account for faster checkout.
                        </p>
                        <Link
                          href="/auth/register?callbackUrl=/checkout"
                          onClick={closeCart}
                          style={{
                            display: "inline-block", marginTop: "0.5rem",
                            fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", fontWeight: 500,
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            color: "var(--dp-ember)", textDecoration: "none",
                            borderBottom: "1px solid var(--dp-ember)", paddingBottom: 1,
                          }}
                        >
                          Create account →
                        </Link>
                      </div>
                    )}

                    {/* Checkout */}
                    <form
                      action={redirectToCheckout}
                      onSubmit={() => {
                        const total = parseFloat(cart.cost.totalAmount.amount);
                        const trackedTotal = Number.isFinite(total)
                          ? Math.max(total - discountAmount + (netShippingPreview ?? 0), 0)
                          : 0;
                        trackInitiateCheckout(
                          trackedTotal,
                          cart.lines.map((line) => ({
                            id: line.merchandise.product.id,
                            name: line.merchandise.product.title,
                            quantity: line.quantity,
                          })),
                        );
                      }}
                    >
                      <CheckoutButton />
                    </form>
                  </div>
                </div>
              )}

              {/* Sheet overlays */}
              <CartSheet
                open={activeSheet !== null}
                title={
                  activeSheet === "note" ? "Order Note"
                  : activeSheet === "shipping" ? "Shipping"
                  : "Discount Code"
                }
                onClose={() => setActiveSheet(null)}
              >
                {activeSheet === "coupon" && (
                  <CouponInput
                    onApply={handleCouponApply}
                    cartTotal={cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0}
                    shippingAmount={shippingPreview ?? 0}
                    cartId={cart?.id || ""}
                  />
                )}
                {activeSheet === "note" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <label
                      htmlFor="order-note"
                      style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "var(--dp-sand)", letterSpacing: "0.06em" }}
                    >
                      Special instructions
                    </label>
                    <textarea
                      id="order-note"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="Delivery instructions, size notes, or any special request."
                      style={{
                        background: "rgba(242,232,213,0.04)",
                        border: "1px solid var(--dp-border)",
                        color: "var(--dp-cream)",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.78rem",
                        padding: "0.75rem",
                        resize: "none",
                        outline: "none",
                        lineHeight: 1.6,
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--dp-ember)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--dp-border)")}
                    />
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.62rem", color: "var(--dp-muted)" }}>
                      Up to 500 characters. Saved with your order.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      style={{
                        background: "var(--dp-ember)", color: "var(--dp-cream)",
                        border: "none", cursor: "pointer", padding: "0.75rem",
                        fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                        fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                    >
                      Save Note
                    </button>
                  </div>
                )}
                {activeSheet === "shipping" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.78rem", fontWeight: 500, color: "var(--dp-sand)" }}>
                      {shippingPreview !== null
                        ? "Shipping preview from your saved address."
                        : "Shipping is calculated at checkout."}
                    </p>
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", color: "var(--dp-muted)", lineHeight: 1.65 }}>
                      {shippingPreview !== null
                        ? `Estimated shipping: ₦${shippingPreview.toLocaleString()}. Final pricing confirmed after payment.`
                        : "Select your delivery address during checkout to see your shipping fee."}
                    </p>
                  </div>
                )}
              </CartSheet>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        display: "block", width: "100%",
        background: pending ? "var(--dp-muted)" : "var(--dp-cream)",
        color: "var(--dp-ink)",
        border: "none", cursor: pending ? "not-allowed" : "pointer",
        padding: "0.9rem",
        fontFamily: "DM Sans, sans-serif", fontWeight: 500,
        fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase",
        transition: "background 0.2s, opacity 0.2s",
      }}
      onMouseEnter={(e) => { if (!pending) (e.currentTarget as HTMLButtonElement).style.background = "var(--dp-ember)"; if (!pending) (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-cream)"; }}
      onMouseLeave={(e) => { if (!pending) (e.currentTarget as HTMLButtonElement).style.background = "var(--dp-cream)"; if (!pending) (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-ink)"; }}
    >
      {pending ? <LoadingDots className="bg-neutral-600" /> : "Proceed to Checkout →"}
    </button>
  );
}

function CartSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Transition show={open} as={Fragment}>
      <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
        {/* Sheet backdrop */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(6,4,2,0.6)" }}
            aria-hidden="true"
            onClick={onClose}
          />
        </Transition.Child>

        {/* Sheet panel */}
        <Transition.Child
          as={Fragment}
          enter="transition-all duration-250 ease-out"
          enterFrom="translate-y-full opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="transition-all duration-200 ease-in"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="translate-y-full opacity-0"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "var(--dp-charcoal)",
              borderTop: "1px solid var(--dp-border)",
              padding: "1.25rem",
            }}
          >
            {/* Top ember line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--dp-ember), transparent 70%)" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.6rem", fontWeight: 500,
                  letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--dp-ember)",
                }}
              >
                {title}
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "1.75rem", height: "1.75rem",
                  border: "1px solid var(--dp-border)",
                  background: "transparent", color: "var(--dp-muted)", cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(242,232,213,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-cream)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--dp-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--dp-muted)"; }}
              >
                <XMarkIcon style={{ width: "0.875rem", height: "0.875rem" }} />
              </button>
            </div>
            <div>{children}</div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
}