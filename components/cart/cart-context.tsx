"use client";

import { lineKey, setUnitPrice } from "lib/pairing";
import type {
    Cart,
    CartItem,
    Product,
    ProductVariant,
} from "lib/types/commerce";
import React, {
    createContext,
    use,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type UpdateType = "plus" | "minus" | "delete";

/** Identifies a bag line: its variant, plus the second pair for a couple set. */
export const cartLineKey = (line: CartItem) =>
  lineKey(line.merchandise.id, line.pair?.id);

type CartContextType = {
  cart: Cart | undefined;
  /**
   * Adds one. For a couple set, `product` is the couple listing, `variant`
   * the first pair and `pair` the second.
   */
  addCartItem: (
    variant: ProductVariant,
    product: Product,
    pair?: ProductVariant,
  ) => void;
  /** Puts a removed line back as it was (undo). */
  restoreCartItem: (line: CartItem) => void;
  updateCartItem: (key: string, updateType: UpdateType) => void;
  setCartItemQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (nextCart: Cart | undefined) => void;
  syncPendingCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

type PendingSync = {
  merchandiseId: string;
  pairMerchandiseId: string | null;
  quantity: number;
};

const LOCAL_CART_STORAGE_KEY = "local-first-cart";
const DEFAULT_CURRENCY_CODE = "NGN";

function createEmptyCart(currencyCode: string = DEFAULT_CURRENCY_CODE): Cart {
  return {
    id: undefined,
    checkoutUrl: "/checkout",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode },
      totalAmount: { amount: "0", currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
  };
}

function calculateItemCost(quantity: number, unitPrice: string): string {
  return (Number(unitPrice) * quantity).toString();
}

function computeCartTotals(
  lines: CartItem[],
  currencyCode: string,
): Pick<Cart, "totalQuantity" | "cost"> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0,
  );

  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: String(subtotal), currencyCode },
      totalAmount: { amount: String(subtotal), currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
  };
}

function normalizeCart(cart: Cart | undefined): Cart {
  if (!cart) return createEmptyCart();
  const currencyCode =
    cart.cost?.totalAmount?.currencyCode || DEFAULT_CURRENCY_CODE;
  return {
    ...cart,
    lines: cart.lines || [],
    ...computeCartTotals(cart.lines || [], currencyCode),
  };
}

function safeReadLocalCart(): Cart | undefined {
  try {
    const raw = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Cart;
    return normalizeCart(parsed);
  } catch {
    return undefined;
  }
}

function safeWriteLocalCart(cart: Cart | undefined): void {
  try {
    if (!cart) {
      localStorage.removeItem(LOCAL_CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Ignore storage errors.
  }
}

/** The line with its quantity changed (0 removes it), totals recomputed. */
function withQuantity(cart: Cart, key: string, quantity: number): Cart {
  const currencyCode =
    cart.cost.totalAmount.currencyCode || DEFAULT_CURRENCY_CODE;
  const nextLines =
    quantity <= 0
      ? cart.lines.filter((line) => cartLineKey(line) !== key)
      : cart.lines.map((line) => {
          if (cartLineKey(line) !== key) return line;
          const unitPrice = String(
            Number(line.cost.totalAmount.amount) / line.quantity,
          );
          return {
            ...line,
            quantity,
            cost: {
              ...line.cost,
              totalAmount: {
                ...line.cost.totalAmount,
                amount: calculateItemCost(quantity, unitPrice),
              },
            },
          };
        });
  return {
    ...cart,
    lines: nextLines,
    ...computeCartTotals(nextLines, currencyCode),
  };
}

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  const serverCart = use(cartPromise);
  const [cart, setCart] = useState<Cart | undefined>(() =>
    normalizeCart(serverCart),
  );
  const cartRef = useRef<Cart | undefined>(normalizeCart(serverCart));
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const pendingQuantitiesRef = useRef<Map<string, PendingSync>>(new Map());
  const isSyncingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Bag edits read and write the ref synchronously, so quick taps build on
  // each other instead of on a render that hasn't happened yet.
  const commit = useCallback((next: Cart | undefined) => {
    cartRef.current = next;
    setCart(next);
    safeWriteLocalCart(next);
  }, []);

  const flushSyncQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (pendingQuantitiesRef.current.size === 0) return;

    isSyncingRef.current = true;

    const payload = Array.from(pendingQuantitiesRef.current.values());
    pendingQuantitiesRef.current.clear();
    setSyncPendingCount(0);

    try {
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: payload }),
      });

      if (!response.ok) {
        throw new Error(`Cart sync failed with status ${response.status}`);
      }

      const result = (await response.json()) as { cart?: Cart | null };
      if (result.cart) {
        const normalized = normalizeCart(result.cart);
        cartRef.current = normalized;
        setCart(normalized);
        safeWriteLocalCart(normalized);
      }
    } catch (error) {
      for (const item of payload) {
        pendingQuantitiesRef.current.set(
          lineKey(item.merchandiseId, item.pairMerchandiseId),
          item,
        );
      }
      setSyncPendingCount(pendingQuantitiesRef.current.size);
    } finally {
      isSyncingRef.current = false;
      if (pendingQuantitiesRef.current.size > 0) {
        syncTimerRef.current = setTimeout(() => {
          void flushSyncQueue();
        }, 500);
      }
    }
  }, []);

  const queueQuantitySync = useCallback(
    (line: CartItem, quantity: number) => {
      const merchandiseId = line.merchandise.id;
      const pairMerchandiseId = line.pair?.id ?? null;
      pendingQuantitiesRef.current.set(
        lineKey(merchandiseId, pairMerchandiseId),
        { merchandiseId, pairMerchandiseId, quantity: Math.max(0, quantity) },
      );
      setSyncPendingCount(pendingQuantitiesRef.current.size);

      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(() => {
        void flushSyncQueue();
      }, 120);
    },
    [flushSyncQueue],
  );

  const setCartItemQuantity = useCallback(
    (key: string, quantity: number) => {
      const target = normalizeCart(cartRef.current).lines.find(
        (line) => cartLineKey(line) === key,
      );
      if (!target) return;
      const nextQuantity = Math.max(0, quantity);

      commit(withQuantity(normalizeCart(cartRef.current), key, nextQuantity));
      queueQuantitySync(target, nextQuantity);
    },
    [commit, queueQuantitySync],
  );

  const updateCartItem = useCallback(
    (key: string, updateType: UpdateType) => {
      const target = normalizeCart(cartRef.current).lines.find(
        (line) => cartLineKey(line) === key,
      );
      if (!target) return;
      const nextQuantity = Math.max(
        0,
        updateType === "plus"
          ? target.quantity + 1
          : updateType === "minus"
            ? target.quantity - 1
            : 0,
      );

      commit(withQuantity(normalizeCart(cartRef.current), key, nextQuantity));
      queueQuantitySync(target, nextQuantity);
    },
    [commit, queueQuantitySync],
  );

  const addCartItem = useCallback(
    (variant: ProductVariant, product: Product, pair?: ProductVariant) => {
      const set = pair && product.pairing ? pair : undefined;
      const key = lineKey(variant.id, set?.id);
      const unitPrice = set
        ? String(
            setUnitPrice(
              Number(variant.price.amount),
              Number(set.price.amount),
              product.pairing!,
            ),
          )
        : variant.price.amount;

      const current = normalizeCart(cartRef.current);
      const currencyCode =
        variant.price.currencyCode ||
        current.cost.totalAmount.currencyCode ||
        DEFAULT_CURRENCY_CODE;
      const existing = current.lines.find((line) => cartLineKey(line) === key);
      const nextQuantity = (existing?.quantity ?? 0) + 1;

      const updatedLine: CartItem = {
        id: existing?.id,
        quantity: nextQuantity,
        cost: {
          totalAmount: {
            amount: calculateItemCost(nextQuantity, unitPrice),
            currencyCode,
          },
        },
        merchandise: {
          id: variant.id,
          title: variant.title,
          selectedOptions: variant.selectedOptions,
          product: {
            id: product.id,
            handle: product.handle,
            title: product.title,
            featuredImage: product.featuredImage,
          },
        },
        ...(set
          ? {
              pair: {
                id: set.id,
                title: set.title,
                selectedOptions: set.selectedOptions,
                labels: product.pairing!.labels,
              },
            }
          : {}),
      };

      const nextLines = existing
        ? current.lines.map((line) =>
            cartLineKey(line) === key ? updatedLine : line,
          )
        : [...current.lines, updatedLine];
      commit({
        ...current,
        lines: nextLines,
        ...computeCartTotals(nextLines, currencyCode),
      });
      queueQuantitySync(updatedLine, nextQuantity);
    },
    [commit, queueQuantitySync],
  );

  const restoreCartItem = useCallback(
    (line: CartItem) => {
      const key = cartLineKey(line);
      const current = normalizeCart(cartRef.current);
      const currencyCode =
        current.cost.totalAmount.currencyCode || DEFAULT_CURRENCY_CODE;
      const nextLines = [
        ...current.lines.filter((l) => cartLineKey(l) !== key),
        line,
      ];
      commit({
        ...current,
        lines: nextLines,
        ...computeCartTotals(nextLines, currencyCode),
      });
      queueQuantitySync(line, line.quantity);
    },
    [commit, queueQuantitySync],
  );

  const clearCart = useCallback(() => {
    const linesToClear = cartRef.current?.lines || [];

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    pendingQuantitiesRef.current.clear();
    setSyncPendingCount(0);

    for (const line of linesToClear) {
      queueQuantitySync(line, 0);
    }

    const currencyCode =
      normalizeCart(cartRef.current).cost?.totalAmount?.currencyCode ||
      DEFAULT_CURRENCY_CODE;
    cartRef.current = createEmptyCart(currencyCode);
    setCart(cartRef.current);
    safeWriteLocalCart(undefined);
  }, [queueQuantitySync]);

  const replaceCart = useCallback((nextCart: Cart | undefined) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    pendingQuantitiesRef.current.clear();
    setSyncPendingCount(0);

    commit(normalizeCart(nextCart));
  }, [commit]);

  useEffect(() => {
    const localCart = safeReadLocalCart();
    if (localCart) {
      cartRef.current = localCart;
      setCart(localCart);
      for (const line of localCart.lines) {
        queueQuantitySync(line, line.quantity);
      }
      return;
    }

    if (serverCart) {
      safeWriteLocalCart(normalizeCart(serverCart));
    }
  }, [queueQuantitySync, serverCart]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addCartItem,
        restoreCartItem,
        updateCartItem,
        setCartItemQuantity,
        clearCart,
        replaceCart,
        syncPendingCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return useMemo(() => context, [context]);
}
