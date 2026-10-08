"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import clsx from "clsx";
import LoadingDots from "components/loading-dots";
import { formatNaira } from "components/product/product-card";
import { useMounted } from "hooks/useMounted";
import { useUserSession } from "hooks/useUserSession";
import { trackInitiateCheckout } from "lib/analytics";
import { DEFAULT_OPTION } from "lib/constants";
import {
  COUPON_STORAGE_KEY,
  getCouponCustomerKey,
  getStoredCoupon,
} from "lib/coupon-storage";
import { calculateShippingAmount } from "lib/shipping";
import type { CartItem, Product } from "lib/shopify/types";
import { createUrl } from "lib/utils";
import {
  ChevronDown,
  Minus,
  PencilLine,
  Plus,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { redirectToCheckout } from "./actions";
import { useCart } from "./cart-context";
import CouponInput from "./coupon-input";
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

/** Window event any part of the UI can dispatch to open the bag. */
export const OPEN_CART_EVENT = "dfp:open-cart";

export function openCartDrawer() {
  window.dispatchEvent(new Event(OPEN_CART_EVENT));
}

export default function CartModal({
  trigger,
}: {
  /** Custom trigger; defaults to the bag icon button. Pass null for none. */
  trigger?: ((open: () => void, quantity: number) => ReactNode) | null;
} = {}) {
  const { cart, updateCartItem, addCartItem, setCartItemQuantity } = useCart();
  const { data: session, status } = useUserSession();
  const mounted = useMounted();
  const [isOpen, setIsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<
    "coupon" | "note" | "shipping" | null
  >(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingDiscountAmount, setShippingDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [shippingAddress, setShippingAddress] = useState<{
    state?: string;
    lga?: string;
    ward?: string;
  } | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const quantityRef = useRef(cart?.totalQuantity);
  const hasHandledViewCartParamRef = useRef(false);
  const openCart = () => setIsOpen(true);
  const closeCart = () => {
    setIsOpen(false);
    setActiveSheet(null);
  };

  const baseSummaryTotal = cart
    ? Math.max(parseFloat(cart.cost.totalAmount.amount) - discountAmount, 0)
    : 0;

  const shippingPreview = useMemo(() => {
    if (!cart || !shippingAddress?.state) return null;
    const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
    const totalQuantity = cart.lines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    return calculateShippingAmount({
      address: shippingAddress,
      subtotalAmount: subtotal,
      totalQuantity,
    });
  }, [cart, shippingAddress]);

  const effectiveShippingDiscount =
    shippingPreview !== null
      ? Math.min(
          Math.max(shippingDiscountAmount, 0),
          Math.max(shippingPreview, 0),
        )
      : 0;
  const netShippingPreview =
    shippingPreview !== null
      ? Math.max(shippingPreview - effectiveShippingDiscount, 0)
      : null;
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
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
  };

  useEffect(() => {
    if (status !== "authenticated") {
      setShippingAddress(null);
      return;
    }
    let isMounted = true;
    const fetchAddress = async () => {
      setShippingLoading(true);
      try {
        const response = await fetch("/api/user-auth/addresses");
        if (!response.ok) {
          if (isMounted) setShippingAddress(null);
          return;
        }
        const data = await response.json();
        if (isMounted)
          setShippingAddress(data?.addresses?.shippingAddress || null);
      } catch {
        if (isMounted) setShippingAddress(null);
      } finally {
        if (isMounted) setShippingLoading(false);
      }
    };
    void fetchAddress();
    return () => {
      isMounted = false;
    };
  }, [status]);

  useEffect(() => {
    let isMounted = true;
    const hydrateStoredCoupon = async () => {
      if (!cart?.id) {
        if (isMounted) {
          setDiscountAmount(0);
          setCouponCode("");
        }
        return;
      }
      try {
        const customerKey = getCouponCustomerKey(
          status === "authenticated" ? session?.id : undefined,
        );
        const storedCoupon = getStoredCoupon(cart.id, customerKey);
        if (!storedCoupon) {
          if (isMounted) {
            setDiscountAmount(0);
            setShippingDiscountAmount(0);
            setCouponCode("");
          }
          return;
        }
        const payload: {
          code: string;
          cartTotal: number;
          shippingAmount: number;
          sessionId?: string;
        } = {
          code: storedCoupon.code,
          cartTotal: parseFloat(cart.cost.subtotalAmount.amount),
          shippingAmount: shippingPreview ?? 0,
        };
        if (status !== "authenticated")
          payload.sessionId = customerKey.replace("guest:", "");
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          logCouponDebug("Hydrate revalidation failed", {
            cartId: cart.id,
            customerKey,
            status: response.status,
            payload,
          });
          if (isMounted) {
            setDiscountAmount(0);
            setShippingDiscountAmount(0);
            setCouponCode("");
          }
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
        if (isMounted) {
          setDiscountAmount(0);
          setShippingDiscountAmount(0);
          setCouponCode("");
        }
      }
    };
    void hydrateStoredCoupon();
    return () => {
      isMounted = false;
    };
  }, [
    cart?.id,
    cart?.cost.subtotalAmount.amount,
    session?.id,
    shippingPreview,
    status,
  ]);

  useEffect(() => {
    if (
      cart?.totalQuantity &&
      cart?.totalQuantity !== quantityRef.current &&
      cart?.totalQuantity > 0
    ) {
      if (!isOpen) setIsOpen(true);
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isOpen, cart?.totalQuantity, quantityRef]);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_CART_EVENT, open);
    return () => window.removeEventListener(OPEN_CART_EVENT, open);
  }, []);

  useEffect(() => {
    const shouldOpen = searchParams.get("view-cart") === "1";
    if (!shouldOpen || hasHandledViewCartParamRef.current) return;
    hasHandledViewCartParamRef.current = true;
    const timer = setTimeout(() => {
      setIsOpen(true);
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("view-cart");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    try {
      const storedNote = localStorage.getItem(ORDER_NOTE_STORAGE_KEY);
      if (storedNote) setOrderNote(storedNote);
    } catch {}
  }, []);

  const openNoteSheet = () => {
    setNoteDraft(orderNote);
    setActiveSheet("note");
  };
  const handleSaveNote = () => {
    const trimmedNote = noteDraft.trim();
    setOrderNote(trimmedNote);
    try {
      if (trimmedNote)
        localStorage.setItem(ORDER_NOTE_STORAGE_KEY, trimmedNote);
      else localStorage.removeItem(ORDER_NOTE_STORAGE_KEY);
    } catch {}
    setActiveSheet(null);
  };

  const lines = cart?.lines ?? [];
  const money = (amount: number, currencyCode = summaryCurrency) =>
    formatNaira({ amount: String(amount), currencyCode });

  const removeLine = (line: CartItem) => {
    const unit = Number(line.cost.totalAmount.amount) / line.quantity;
    const quantity = line.quantity;
    updateCartItem(line.merchandise.id, "delete");
    toast(`${line.merchandise.product.title} removed`, {
      action: {
        label: "Undo",
        onClick: () => {
          addCartItem(
            {
              id: line.merchandise.id,
              title: line.merchandise.title,
              availableForSale: true,
              selectedOptions: line.merchandise.selectedOptions,
              price: {
                amount: String(unit),
                currencyCode: line.cost.totalAmount.currencyCode,
              },
            },
            line.merchandise.product as unknown as Product,
          );
          if (quantity > 1) setCartItemQuantity(line.merchandise.id, quantity);
        },
      },
    });
  };

  return (
    <>
      {trigger === undefined ? (
        <button aria-label="Open cart" onClick={openCart}>
          <OpenCart quantity={mounted ? cart?.totalQuantity : 0} />
        </button>
      ) : trigger ? (
        trigger(openCart, mounted ? (cart?.totalQuantity ?? 0) : 0)
      ) : null}

      <Dialog open={isOpen} onClose={closeCart} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/50 transition-opacity duration-300 data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex items-end md:items-stretch md:justify-end">
          <DialogPanel
            transition
            className="relative flex h-[92svh] w-full flex-col overflow-hidden bg-canvas text-fg transition-transform duration-500 ease-atelier data-[closed]:translate-y-full md:h-full md:w-[440px] md:data-[closed]:translate-x-full md:data-[closed]:translate-y-0"
          >
            <div className="flex justify-center pt-3 md:hidden">
              <span className="h-1 w-10 rounded-full bg-fg/20" />
            </div>

            {/* Header */}
            <div className="flex items-end justify-between border-b border-line px-5 pb-4 pt-3 md:pt-6">
              <DialogTitle className="display text-5xl">
                Bag{" "}
                <span className="font-mono text-base font-normal tracking-normal text-fg-3">
                  ({cart?.totalQuantity ?? 0})
                </span>
              </DialogTitle>
              <button
                type="button"
                aria-label="Close bag"
                onClick={closeCart}
                className="label flex h-9 items-center gap-1.5"
              >
                Close <X className="size-4" />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <ShoppingBag className="size-10 text-fg-3" strokeWidth={1.2} />
                <p className="display text-4xl">Your bag is empty.</p>
                <p className="text-fg-2">
                  Every pair is made by hand in Lagos. Find yours.
                </p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="mt-2 inline-flex h-12 items-center bg-fg px-6 text-sm font-semibold uppercase tracking-wide text-canvas"
                >
                  Shop all designs
                </Link>
              </div>
            ) : (
              <>
                {/* Lines */}
                <ul className="flex-1 overflow-y-auto overscroll-contain px-5">
                  {lines.map((item) => {
                    const params = {} as MerchandiseSearchParams;
                    item.merchandise.selectedOptions.forEach(
                      ({ name, value }) => {
                        if (value !== DEFAULT_OPTION)
                          params[name.toLowerCase()] = value;
                      },
                    );
                    const href = createUrl(
                      `/product/${item.merchandise.product.handle}`,
                      new URLSearchParams(params),
                    );
                    const image = item.merchandise.product.featuredImage;

                    return (
                      <li
                        key={item.id ?? item.merchandise.id}
                        className="animate-fade-in flex gap-4 border-b border-line py-5"
                      >
                        <Link
                          href={href}
                          onClick={closeCart}
                          className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-plate"
                        >
                          {image?.url ? (
                            <Image
                              fill
                              sizes="80px"
                              className="object-cover"
                              alt={
                                image.altText || item.merchandise.product.title
                              }
                              src={image.url}
                            />
                          ) : null}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <Link
                              href={href}
                              onClick={closeCart}
                              className="line-clamp-2 font-medium"
                            >
                              {item.merchandise.product.title}
                            </Link>
                            <span className="shrink-0 font-mono text-sm">
                              {formatNaira(item.cost.totalAmount)}
                            </span>
                          </div>
                          {item.merchandise.title !== DEFAULT_OPTION ? (
                            <p className="label mt-1 text-fg-3">
                              {item.merchandise.selectedOptions
                                .map((o) => `${o.name} ${o.value}`)
                                .join(" · ") || item.merchandise.title}
                            </p>
                          ) : null}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex h-9 items-center border border-line">
                              <button
                                type="button"
                                aria-label="Reduce quantity"
                                onClick={() =>
                                  item.quantity <= 1
                                    ? removeLine(item)
                                    : updateCartItem(
                                        item.merchandise.id,
                                        "minus",
                                      )
                                }
                                className="grid h-full w-9 place-items-center active:bg-plate"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-7 text-center font-mono text-sm">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateCartItem(item.merchandise.id, "plus")
                                }
                                className="grid h-full w-9 place-items-center active:bg-plate"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLine(item)}
                              className="label link-underline text-fg-3"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                  <div className="label mb-4 grid grid-cols-3 gap-2">
                    <ActionChip
                      icon={<PencilLine className="size-3.5" />}
                      title="Note"
                      sub={orderNote ? "Added ✓" : "Optional"}
                      active={Boolean(orderNote)}
                      onClick={openNoteSheet}
                    />
                    <ActionChip
                      icon={<Truck className="size-3.5" />}
                      title="Delivery"
                      sub={
                        shippingLoading
                          ? "Checking…"
                          : shippingPreview !== null
                            ? money(netShippingPreview ?? 0)
                            : "At checkout"
                      }
                      onClick={() => setActiveSheet("shipping")}
                    />
                    <ActionChip
                      icon={<Tag className="size-3.5" />}
                      title={couponCode ? "Applied" : "Coupon"}
                      sub={couponCode ? `Remove ${couponCode}` : "Add code"}
                      active={Boolean(couponCode)}
                      onClick={() =>
                        couponCode
                          ? handleRemoveCoupon()
                          : setActiveSheet("coupon")
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSummaryOpen((p) => !p)}
                    aria-expanded={isSummaryOpen}
                    className="flex w-full items-center justify-between py-1"
                  >
                    <span className="label text-fg-3">
                      Total{" "}
                      {shippingPreview === null ? "· delivery at checkout" : ""}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-lg">
                      <span suppressHydrationWarning>
                        {money(summaryTotal)}
                      </span>
                      <ChevronDown
                        className={clsx(
                          "size-4 transition-transform",
                          isSummaryOpen && "rotate-180",
                        )}
                      />
                    </span>
                  </button>

                  {isSummaryOpen && cart ? (
                    <dl className="animate-fade-in mt-2 space-y-2 border-t border-line pt-3 text-sm">
                      <Row label="Subtotal">
                        {formatNaira(cart.cost.subtotalAmount)}
                      </Row>
                      {discountAmount > 0 ? (
                        <Row label={`Discount (${couponCode})`}>
                          −{money(discountAmount)}
                        </Row>
                      ) : null}
                      {Number(cart.cost.totalTaxAmount.amount) > 0 ? (
                        <Row label="Taxes">
                          {formatNaira(cart.cost.totalTaxAmount)}
                        </Row>
                      ) : null}
                      <Row label="Delivery">
                        {shippingPreview !== null ? (
                          <>
                            {money(netShippingPreview ?? 0)}
                            {effectiveShippingDiscount > 0 ? (
                              <span className="ml-2 text-fg-3">
                                (saved {money(effectiveShippingDiscount)})
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-fg-3">At checkout</span>
                        )}
                      </Row>
                    </dl>
                  ) : null}

                  {status === "unauthenticated" ? (
                    <p className="mt-3 text-sm text-fg-2">
                      <Link
                        href="/auth/register?callbackUrl=/checkout"
                        onClick={closeCart}
                        className="underline"
                      >
                        Create an account
                      </Link>{" "}
                      to save your bag and track orders — or check out as a
                      guest.
                    </p>
                  ) : null}

                  <form
                    className="mt-4"
                    action={redirectToCheckout}
                    onSubmit={() => {
                      const total = parseFloat(cart!.cost.totalAmount.amount);
                      const trackedTotal = Number.isFinite(total)
                        ? Math.max(
                            total - discountAmount + (netShippingPreview ?? 0),
                            0,
                          )
                        : 0;
                      trackInitiateCheckout(
                        trackedTotal,
                        lines.map((line) => ({
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
              </>
            )}

            {/* Inner sheet: note / delivery / coupon */}
            <InnerSheet
              open={activeSheet !== null}
              title={
                activeSheet === "note"
                  ? "Order note"
                  : activeSheet === "shipping"
                    ? "Delivery"
                    : "Discount code"
              }
              onClose={() => setActiveSheet(null)}
            >
              {activeSheet === "coupon" ? (
                <CouponInput
                  onApply={handleCouponApply}
                  cartTotal={
                    cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0
                  }
                  shippingAmount={shippingPreview ?? 0}
                  cartId={cart?.id || ""}
                />
              ) : null}
              {activeSheet === "note" ? (
                <div className="space-y-3">
                  <label htmlFor="order-note" className="label text-fg-3">
                    Special instructions
                  </label>
                  <textarea
                    id="order-note"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Delivery instructions, size notes, or any special request."
                    className="w-full resize-none border border-line bg-transparent p-3 text-base outline-none focus:border-fg"
                  />
                  <p className="text-xs text-fg-3">
                    Up to 500 characters. Saved with your order.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="h-12 w-full bg-fg text-sm font-semibold uppercase tracking-wide text-canvas"
                  >
                    Save note
                  </button>
                </div>
              ) : null}
              {activeSheet === "shipping" ? (
                <div className="space-y-2 text-fg-2">
                  <p className="font-medium text-fg">
                    {shippingPreview !== null
                      ? "Estimated from your saved address."
                      : "Delivery is calculated at checkout."}
                  </p>
                  <p>
                    {shippingPreview !== null
                      ? `Estimated delivery: ${money(shippingPreview)}. Confirmed at checkout before you pay.`
                      : "Enter your delivery address at checkout to see the fee for your state."}
                  </p>
                </div>
              ) : null}
            </InnerSheet>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

function ActionChip({
  icon,
  title,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex flex-col items-start gap-1 border p-2.5 text-left transition-colors",
        active ? "border-fg" : "border-line hover:border-fg",
      )}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      <span className="truncate font-sans text-xs normal-case tracking-normal text-fg-3">
        {sub}
      </span>
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-fg-2">{label}</dt>
      <dd className="font-mono">{children}</dd>
    </div>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center bg-fg text-sm font-semibold uppercase tracking-wide text-canvas transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? <LoadingDots className="bg-canvas" /> : "Checkout"}
    </button>
  );
}

function InnerSheet({
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
    <div
      className={clsx(
        "absolute inset-0 z-10 transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className={clsx(
          "absolute inset-x-0 bottom-0 border-t border-line bg-canvas p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] transition-transform duration-500 ease-atelier",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="label">{title}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 place-items-center"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
