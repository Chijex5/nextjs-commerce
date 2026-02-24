export const COUPON_STORAGE_KEY = "appliedCoupon";
export const GUEST_SESSION_STORAGE_KEY = "guestSessionId";

export interface StoredCoupon {
  code: string;
  discountAmount: number;
  cartId: string;
  customerKey: string;
  description?: string;
}

export const getGuestSessionId = () => {
  let sessionId = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(GUEST_SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
};

export const getCouponCustomerKey = (userId?: string | null) => {
  if (userId) {
    return `user:${userId}`;
  }

  return `guest:${getGuestSessionId()}`;
};

export const getStoredCoupon = (
  cartId: string,
  customerKey: string,
): StoredCoupon | null => {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY);
    if (!raw) return null;

    const coupon = JSON.parse(raw) as Partial<StoredCoupon>;
    if (
      !coupon ||
      typeof coupon.code !== "string" ||
      typeof coupon.discountAmount !== "number" ||
      coupon.cartId !== cartId ||
      coupon.customerKey !== customerKey
    ) {
      localStorage.removeItem(COUPON_STORAGE_KEY);
      return null;
    }

    return coupon as StoredCoupon;
  } catch {
    localStorage.removeItem(COUPON_STORAGE_KEY);
    return null;
  }
};
