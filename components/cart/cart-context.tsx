"use client";

import type {
    Cart,
    CartItem,
    Product,
    ProductVariant,
} from "lib/shopify/types";
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

type CartContextType = {
  cart: Cart | undefined;
  addCartItem: (variant: ProductVariant, product: Product) => void;
  updateCartItem: (merchandiseId: string, updateType: UpdateType) => void;
  setCartItemQuantity: (merchandiseId: string, quantity: number) => void;
  syncPendingCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_STORAGE_KEY = "local-first-cart";

function createEmptyCart(currencyCode: string = "NGN"): Cart {
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
  const currencyCode = cart.cost?.totalAmount?.currencyCode || "NGN";
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
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const pendingQuantitiesRef = useRef<Map<string, number>>(new Map());
  const isSyncingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSyncQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (pendingQuantitiesRef.current.size === 0) return;

    isSyncingRef.current = true;

    const payload = Array.from(pendingQuantitiesRef.current.entries()).map(
      ([merchandiseId, quantity]) => ({ merchandiseId, quantity }),
    );
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
        setCart(normalized);
        safeWriteLocalCart(normalized);
      }
    } catch (error) {
      for (const item of payload) {
        pendingQuantitiesRef.current.set(item.merchandiseId, item.quantity);
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
    (merchandiseId: string, quantity: number) => {
      pendingQuantitiesRef.current.set(merchandiseId, Math.max(0, quantity));
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
    (merchandiseId: string, quantity: number) => {
      const nextQuantityForQueue = Math.max(0, quantity);
      setCart((prev) => {
        const current = normalizeCart(prev);
        const currencyCode = current.cost.totalAmount.currencyCode || "NGN";
        const existing = current.lines.find(
          (line) => line.merchandise.id === merchandiseId,
        );

        if (!existing) return current;

        const nextQuantity = Math.max(0, quantity);
        const unitPrice = String(
          Number(existing.cost.totalAmount.amount) / existing.quantity,
        );

        const nextLines =
          nextQuantity === 0
            ? current.lines.filter(
                (line) => line.merchandise.id !== merchandiseId,
              )
            : current.lines.map((line) =>
                line.merchandise.id === merchandiseId
                  ? {
                      ...line,
                      quantity: nextQuantity,
                      cost: {
                        ...line.cost,
                        totalAmount: {
                          ...line.cost.totalAmount,
                          amount: calculateItemCost(nextQuantity, unitPrice),
                        },
                      },
                    }
                  : line,
              );

        const nextCart = {
          ...current,
          lines: nextLines,
          ...computeCartTotals(nextLines, currencyCode),
        };

        safeWriteLocalCart(nextCart);
        return nextCart;
      });

      queueQuantitySync(merchandiseId, nextQuantityForQueue);
    },
    [queueQuantitySync],
  );

  const updateCartItem = useCallback(
    (merchandiseId: string, updateType: UpdateType) => {
      let queuedQuantity = 0;

      setCart((prev) => {
        const current = normalizeCart(prev);
        const target = current.lines.find(
          (line) => line.merchandise.id === merchandiseId,
        );
        if (!target) return current;

        const nextQuantity =
          updateType === "plus"
            ? target.quantity + 1
            : updateType === "minus"
              ? target.quantity - 1
              : 0;

        const currencyCode = current.cost.totalAmount.currencyCode || "NGN";
        const unitPrice = String(
          Number(target.cost.totalAmount.amount) / target.quantity,
        );

        const nextLines =
          nextQuantity <= 0
            ? current.lines.filter(
                (line) => line.merchandise.id !== merchandiseId,
              )
            : current.lines.map((line) =>
                line.merchandise.id === merchandiseId
                  ? {
                      ...line,
                      quantity: nextQuantity,
                      cost: {
                        ...line.cost,
                        totalAmount: {
                          ...line.cost.totalAmount,
                          amount: calculateItemCost(nextQuantity, unitPrice),
                        },
                      },
                    }
                  : line,
              );

        const nextCart = {
          ...current,
          lines: nextLines,
          ...computeCartTotals(nextLines, currencyCode),
        };

        queuedQuantity = Math.max(0, nextQuantity);

        safeWriteLocalCart(nextCart);
        return nextCart;
      });

      queueQuantitySync(merchandiseId, queuedQuantity);
    },
    [queueQuantitySync],
  );

  const addCartItem = useCallback(
    (variant: ProductVariant, product: Product) => {
      let queuedQuantity = 1;

      setCart((prev) => {
        const current = normalizeCart(prev);
        const currencyCode =
          variant.price.currencyCode ||
          current.cost.totalAmount.currencyCode ||
          "NGN";
        const existing = current.lines.find(
          (line) => line.merchandise.id === variant.id,
        );
        const nextQuantity = (existing?.quantity ?? 0) + 1;

        const updatedLine: CartItem = {
          id: existing?.id,
          quantity: nextQuantity,
          cost: {
            totalAmount: {
              amount: calculateItemCost(nextQuantity, variant.price.amount),
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
        };

        const nextLines = existing
          ? current.lines.map((line) =>
              line.merchandise.id === variant.id ? updatedLine : line,
            )
          : [...current.lines, updatedLine];

        const nextCart = {
          ...current,
          lines: nextLines,
          ...computeCartTotals(nextLines, currencyCode),
        };

        queuedQuantity = nextQuantity;

        safeWriteLocalCart(nextCart);
        return nextCart;
      });

      queueQuantitySync(variant.id, queuedQuantity);
    },
    [queueQuantitySync],
  );

  useEffect(() => {
    const localCart = safeReadLocalCart();
    if (localCart) {
      setCart(localCart);
      for (const line of localCart.lines) {
        queueQuantitySync(line.merchandise.id, line.quantity);
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
        updateCartItem,
        setCartItemQuantity,
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
