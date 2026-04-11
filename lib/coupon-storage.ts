export const COUPON_STORAGE_KEY = "appliedCoupon";
export const GUEST_SESSION_STORAGE_KEY = "guestSessionId";

export interface StoredCoupon {
  code: string;
  discountAmount?: number;
  includeShippingInDiscount?: boolean;
  grantsFreeShipping?: boolean;
  shippingDiscountAmount?: number;
  productDiscountAmount?: number;
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
      typeof coupon.customerKey !== "string"
    ) {
      localStorage.removeItem(COUPON_STORAGE_KEY);
      return null;
    }

    if (coupon.customerKey !== customerKey) {
      return null;
    }

    if (typeof coupon.cartId !== "string") {
      return null;
    }

    if (coupon.cartId !== cartId) {
      return coupon as StoredCoupon;
    }

    return coupon as StoredCoupon;
  } catch {
    localStorage.removeItem(COUPON_STORAGE_KEY);
    return null;
  }
};

export const saveStoredCoupon = (coupon: StoredCoupon): void => {
  try {
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
  } catch {
    // Ignore storage errors.
  }
};

export const migrateGuestCouponToUser = (
  cartId: string,
  userId: string,
): StoredCoupon | null => {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY);
    if (!raw) return null;

    const coupon = JSON.parse(raw) as Partial<StoredCoupon>;
    if (
      !coupon ||
      typeof coupon.code !== "string" ||
      typeof coupon.customerKey !== "string" ||
      !coupon.customerKey.startsWith("guest:")
    ) {
      return null;
    }

    const migrated: StoredCoupon = {
      ...(coupon as StoredCoupon),
      cartId,
      customerKey: `user:${userId}`,
    };

    saveStoredCoupon(migrated);
    return migrated;
  } catch {
    return null;
  }
};
