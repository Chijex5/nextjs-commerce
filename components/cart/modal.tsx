"use client";

import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  PencilSquareIcon,
  ShoppingCartIcon,
  TagIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import { createUrl } from "lib/utils";
import { trackInitiateCheckout } from "lib/analytics";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { createCartAndSetCookie, redirectToCheckout } from "./actions";
import { useCart } from "./cart-context";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";
import CouponInput from "./coupon-input";
import { useUserSession } from "hooks/useUserSession";

type MerchandiseSearchParams = {
  [key: string]: string;
};

const ORDER_NOTE_STORAGE_KEY = "orderNote";

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const { status } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<
    "coupon" | "note" | "shipping" | null
  >(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [orderNote, setOrderNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const quantityRef = useRef(cart?.totalQuantity);
  const openCart = () => setIsOpen(true);
  const closeCart = () => {
    setIsOpen(false);
    setActiveSheet(null);
  };
  const summaryTotal = cart
    ? Math.max(parseFloat(cart.cost.totalAmount.amount) - discountAmount, 0)
    : 0;
  const summaryCurrency = cart?.cost.totalAmount.currencyCode ?? "USD";
  const formattedSummaryTotal = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: summaryCurrency,
    currencyDisplay: "narrowSymbol",
  }).format(summaryTotal);

  const handleCouponApply = (amount: number, code: string) => {
    setDiscountAmount(amount);
    setCouponCode(code);
    if (activeSheet === "coupon" && amount > 0) {
      setActiveSheet(null);
    }
  };

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    if (
      cart?.totalQuantity &&
      cart?.totalQuantity !== quantityRef.current &&
      cart?.totalQuantity > 0
    ) {
      if (!isOpen) {
        setIsOpen(true);
      }
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isOpen, cart?.totalQuantity, quantityRef]);

  useEffect(() => {
    try {
      const storedNote = localStorage.getItem(ORDER_NOTE_STORAGE_KEY);
      if (storedNote) {
        setOrderNote(storedNote);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const openNoteSheet = () => {
    setNoteDraft(orderNote);
    setActiveSheet("note");
  };

  const handleSaveNote = () => {
    const trimmedNote = noteDraft.trim();
    setOrderNote(trimmedNote);
    try {
      if (trimmedNote) {
        localStorage.setItem(ORDER_NOTE_STORAGE_KEY, trimmedNote);
      } else {
        localStorage.removeItem(ORDER_NOTE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors.
    }
    setActiveSheet(null);
  };

  return (
    <>
      <button aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={cart?.totalQuantity} />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/80 p-6 text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-700 dark:bg-black/80 dark:text-white">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">My Cart</p>
                <button aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>

              {!cart || cart.lines.length === 0 ? (
                <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
                  <ShoppingCartIcon className="h-16" />
                  <p className="mt-6 text-center text-2xl font-bold">
                    Your cart is empty.
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden p-1">
                  <ul className="grow overflow-auto py-4">
                    {cart.lines
                      .sort((a, b) =>
                        a.merchandise.product.title.localeCompare(
                          b.merchandise.product.title,
                        ),
                      )
                      .map((item, i) => {
                        const merchandiseSearchParams =
                          {} as MerchandiseSearchParams;

                        item.merchandise.selectedOptions.forEach(
                          ({ name, value }) => {
                            if (value !== DEFAULT_OPTION) {
                              merchandiseSearchParams[name.toLowerCase()] =
                                value;
                            }
                          },
                        );

                        const merchandiseUrl = createUrl(
                          `/product/${item.merchandise.product.handle}`,
                          new URLSearchParams(merchandiseSearchParams),
                        );

                        return (
                          <li
                            key={i}
                            className="flex w-full flex-col border-b border-neutral-300 dark:border-neutral-700"
                          >
                            <div className="relative flex w-full flex-row justify-between px-1 py-4">
                              <div className="absolute z-40 -ml-1 -mt-2">
                                <DeleteItemButton
                                  item={item}
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>
                              <div className="flex flex-row">
                                <div className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                                  <Image
                                    className="h-full w-full object-cover"
                                    width={64}
                                    height={64}
                                    alt={
                                      item.merchandise.product.featuredImage
                                        .altText ||
                                      item.merchandise.product.title
                                    }
                                    src={
                                      item.merchandise.product.featuredImage.url
                                    }
                                  />
                                </div>
                                <Link
                                  href={merchandiseUrl}
                                  onClick={closeCart}
                                  className="z-30 ml-2 flex flex-row space-x-4"
                                >
                                  <div className="flex flex-1 flex-col text-base">
                                    <span className="leading-tight">
                                      {item.merchandise.product.title}
                                    </span>
                                    {item.merchandise.title !==
                                    DEFAULT_OPTION ? (
                                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {item.merchandise.title}
                                      </p>
                                    ) : null}
                                  </div>
                                </Link>
                              </div>
                              <div className="flex h-16 flex-col justify-between">
                                <Price
                                  className="flex justify-end space-y-2 text-right text-sm"
                                  amount={item.cost.totalAmount.amount}
                                  currencyCode={
                                    item.cost.totalAmount.currencyCode
                                  }
                                />
                                <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                                  <EditItemQuantityButton
                                    item={item}
                                    type="minus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                  <p className="w-6 text-center">
                                    <span className="w-full text-sm">
                                      {item.quantity}
                                    </span>
                                  </p>
                                  <EditItemQuantityButton
                                    item={item}
                                    type="plus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                  <div className="border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={openNoteSheet}
                        className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-left text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <PencilSquareIcon className="h-4 w-4" />
                          <span>Order note</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {orderNote ? "Added" : "Optional"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSheet("shipping")}
                        className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-left text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-4 w-4" />
                          <span>Shipping</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Quoted later
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSheet("coupon")}
                        className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-left text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <TagIcon className="h-4 w-4" />
                          <span>Discount</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {couponCode ? couponCode : "Add code"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4 pb-3 pt-2">
                    <div className="overflow-hidden rounded-xl border border-neutral-200/70 bg-white/70 text-sm text-neutral-600 shadow-sm shadow-neutral-200/30 backdrop-blur dark:border-neutral-700/70 dark:bg-neutral-900/70 dark:text-neutral-300 dark:shadow-none">
                      <button
                        type="button"
                        onClick={() => setIsSummaryOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                        aria-expanded={isSummaryOpen}
                      >
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                            Order summary
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                            <span>Total</span>
                            <span
                              suppressHydrationWarning={true}
                              className="text-sm font-semibold text-neutral-900 dark:text-white"
                            >
                              {formattedSummaryTotal}
                            </span>
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                              {summaryCurrency}
                            </span>
                          </div>
                        </div>
                        <ChevronDownIcon
                          className={clsx(
                            "h-5 w-5 text-neutral-500 transition-transform dark:text-neutral-400",
                            isSummaryOpen && "rotate-180",
                          )}
                        />
                      </button>
                      {isSummaryOpen ? (
                        <>
                          <div className="divide-y divide-neutral-200/70 border-t border-neutral-200/70 dark:divide-neutral-700/70 dark:border-neutral-700/70">
                            <div className="flex items-center justify-between px-4 py-2.5">
                              <p>Subtotal</p>
                              <Price
                                className="text-right text-sm font-medium text-neutral-900 dark:text-white"
                                amount={cart.cost.subtotalAmount.amount}
                                currencyCode={cart.cost.subtotalAmount.currencyCode}
                              />
                            </div>
                            {discountAmount > 0 && (
                              <div className="flex items-center justify-between px-4 py-2.5">
                                <p className="text-emerald-700 dark:text-emerald-400">
                                  Discount ({couponCode})
                                </p>
                                <p className="text-right text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                  -₦{discountAmount.toFixed(2)}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between px-4 py-2.5">
                              <p>Taxes</p>
                              <Price
                                className="text-right text-sm font-medium text-neutral-900 dark:text-white"
                                amount={cart.cost.totalTaxAmount.amount}
                                currencyCode={cart.cost.totalTaxAmount.currencyCode}
                              />
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5">
                              <p>Shipping</p>
                              <p className="text-right text-xs text-neutral-500 dark:text-neutral-400">
                                Quoted after your order is ready
                              </p>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 text-base font-semibold text-neutral-900 dark:text-white">
                              <p>Total</p>
                              <Price
                                className="text-right text-base font-semibold text-neutral-900 dark:text-white"
                                amount={Math.max(
                                  parseFloat(cart.cost.totalAmount.amount) -
                                    discountAmount,
                                  0,
                                ).toString()}
                                currencyCode={cart.cost.totalAmount.currencyCode}
                              />
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {status === "unauthenticated" && (
                    <div className="mb-4 rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                      <p className="font-medium">Save your cart and track orders</p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Create an account for faster checkout next time.
                      </p>
                      <Link
                        href="/auth/register?callbackUrl=/checkout"
                        className="mt-2 inline-flex text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        onClick={closeCart}
                      >
                        Create account
                      </Link>
                    </div>
                  )}
                  <form
                    action={redirectToCheckout}
                    onSubmit={() => {
                      const total = parseFloat(cart.cost.totalAmount.amount);
                      const trackedTotal = Number.isFinite(total)
                        ? Math.max(total - discountAmount, 0)
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
              )}
              <CartSheet
                open={activeSheet !== null}
                title={
                  activeSheet === "note"
                    ? "Order note"
                    : activeSheet === "shipping"
                      ? "Shipping"
                      : "Discount code"
                }
                onClose={() => setActiveSheet(null)}
              >
                {activeSheet === "coupon" && (
                  <CouponInput
                    onApply={handleCouponApply}
                    cartTotal={
                      cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0
                    }
                  />
                )}
                {activeSheet === "note" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="order-note"
                        className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                      >
                        Order special instructions
                      </label>
                      <textarea
                        id="order-note"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                        placeholder="Share delivery instructions, size notes, or any special request."
                      />
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Up to 500 characters. Saved with your order.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      Save note
                    </button>
                  </div>
                )}
                {activeSheet === "shipping" && (
                  <div className="space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      Shipping is confirmed after your order is ready.
                    </p>
                    <p>
                      We&apos;ll contact you with available delivery options and
                      pricing. You can request a preferred courier or method,
                      and we&apos;ll confirm what&apos;s possible.
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

function CloseCart({ className }: { className?: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white">
      <XMarkIcon
        className={clsx(
          "h-6 transition-all ease-in-out hover:scale-110",
          className,
        )}
      />
    </div>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100"
      type="submit"
      disabled={pending}
    >
      {pending ? <LoadingDots className="bg-white" /> : "Proceed to Checkout"}
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
      <div className="absolute inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/40"
          aria-hidden="true"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-full border border-neutral-200 p-1 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </Transition>
  );
}
