"use client";

import LoadingDots from "components/loading-dots";
import {
    LocationSelectGroup,
    type LocationChangeSource,
} from "components/locations/location-select-group";
import PageLoader from "components/page-loader";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import { identifyUser } from "lib/analytics/tiktok-pixel";
import {
    getCouponCustomerKey,
    getStoredCoupon,
    migrateGuestCouponToUser,
} from "lib/coupon-storage";
import { normalizeLocationName } from "lib/locations";
import { calculateShippingAmount } from "lib/shipping";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ORDER_NOTE_STORAGE_KEY = "orderNote";
const DEV_COUPON_DEBUG = process.env.NODE_ENV !== "production";

function logCouponDebug(message: string, payload?: unknown) {
  if (!DEV_COUPON_DEBUG) return;
  console.debug(`[coupon][checkout] ${message}`, payload);
}

interface CartItem {
  id?: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    selectedOptions: Array<{ name: string; value: string }>;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: {
        url: string;
        altText: string;
      };
    };
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface Cart {
  id?: string;
  lines: CartItem[];
  cost: {
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalTaxAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface Address {
  firstName: string;
  lastName: string;
  streetAddress: string;
  nearestBusStop: string;
  landmark: string;
  ward: string;
  lga: string;
  state: string;
  phone1: string;
  phone2: string;
  country: string;
}

interface CheckoutFormData {
  email: string;
  phone: string;
  shippingAddress: Address;
  billingAddress: Address;
  saveAddress: boolean;
  useSameAddress: boolean;
}

const emptyAddress: Address = {
  firstName: "",
  lastName: "",
  streetAddress: "",
  nearestBusStop: "",
  landmark: "",
  ward: "",
  lga: "",
  state: "",
  phone1: "",
  phone2: "",
  country: "Nigeria",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useUserSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponData, setCouponData] = useState<{
    code: string;
    amount: number;
    productDiscountAmount: number;
    shippingDiscountAmount: number;
    includeShippingInDiscount: boolean;
    grantsFreeShipping: boolean;
  } | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const tiktokIdentifyKeyRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    phone: "",
    shippingAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    saveAddress: false,
    useSameAddress: true,
  });

  useEffect(() => {
    void fetchCart();
    if (session) {
      void fetchUserAddresses();
    }
  }, [session]);

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

  useEffect(() => {
    const email = formData.email?.trim();
    const phone = formData.phone?.trim();
    if (!email && !phone) return;

    const key = `${email || ""}|${phone || ""}`;
    if (key === tiktokIdentifyKeyRef.current) return;

    tiktokIdentifyKeyRef.current = key;
    identifyUser({
      email: email || undefined,
      phoneNumber: phone || undefined,
    });
  }, [formData.email, formData.phone]);

  const loadCouponData = async (cartId: string, cartTotal: number) => {
    if (!cartId) {
      setCouponData(null);
      return;
    }

    try {
      const customerKey = getCouponCustomerKey(session?.id);
      let coupon = getStoredCoupon(cartId, customerKey);

      if (!coupon && session?.id) {
        coupon = migrateGuestCouponToUser(cartId, session.id);
      }

      if (coupon) {
        const payload = {
          code: coupon.code,
          cartTotal,
        };
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          setCouponData({
            code: data.coupon.code,
            amount: data.coupon.discountAmount,
            productDiscountAmount: data.coupon.productDiscountAmount || 0,
            shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
            includeShippingInDiscount: Boolean(
              data.coupon.includeShippingInDiscount,
            ),
            grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
          });
        } else {
          logCouponDebug("Initial load validation failed", {
            cartId,
            customerKey,
            status: response.status,
            payload,
          });
          setCouponData(null);
        }
      } else {
        setCouponData(null);
      }
    } catch (err) {
      logCouponDebug("Initial load validation error", {
        cartId,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error("Failed to load coupon data:", err);
      setCouponData(null);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch("/api/user-auth/addresses");
      if (response.ok) {
        const data = await response.json();
        const normalizeAddress = (input?: Partial<Address>): Address => ({
          ...emptyAddress,
          ...(input || {}),
        });

        setFormData((prev) => ({
          ...prev,
          email: session?.email || "",
          phone: session?.phone || prev.phone,
          shippingAddress: normalizeAddress(
            data.addresses.shippingAddress || prev.shippingAddress,
          ),
          billingAddress: normalizeAddress(
            data.addresses.billingAddress || prev.billingAddress,
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        if (!data.cart || data.cart.lines.length === 0) {
          toast.error("Your cart is empty");
          router.push("/");
          return;
        }
        setCart(data.cart);
        if (data.cart?.id) {
          await loadCouponData(
            data.cart.id,
            parseFloat(data.cart.cost.subtotalAmount.amount),
          );
        } else {
          setCouponData(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean,
    addressType?: "shippingAddress" | "billingAddress",
  ) => {
    if (addressType) {
      setFormData((prev) => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleLocationChange = (
    addressType: "shippingAddress" | "billingAddress",
    field: "state" | "lga" | "ward",
    value: string,
    source: LocationChangeSource,
  ) => {
    const currentValue = formData[addressType][field] || "";
    const changed =
      normalizeLocationName(currentValue) !== normalizeLocationName(value);

    handleInputChange(field, value, addressType);

    if (source !== "select" || !changed) return;

    if (field === "state") {
      handleInputChange("lga", "", addressType);
      handleInputChange("ward", "", addressType);
    }

    if (field === "lga") {
      handleInputChange("ward", "", addressType);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare checkout data
      const checkoutData = {
        email: formData.email,
        phone: formData.phone,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useSameAddress
          ? formData.shippingAddress
          : formData.billingAddress,
        saveAddress: formData.saveAddress,
        couponCode: couponData?.code,
        notes: orderNote.trim() || undefined,
      };

      // Initialize payment with Paystack
      const response = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (response.ok && data.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.authorizationUrl;
      } else if (response.ok && data.freeCheckout && data.orderNumber) {
        toast.success("Order placed successfully");
        router.push(
          `/checkout/success?order=${encodeURIComponent(data.orderNumber)}`,
        );
      } else {
        toast.error(data.error || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = parseFloat(cart?.cost.subtotalAmount.amount ?? "0");
  const discountAmount = couponData?.amount || 0;
  const totalQuantity =
    cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  const hasShippingState = Boolean(formData.shippingAddress.state?.trim());
  const shippingCost = hasShippingState
    ? calculateShippingAmount({
        address: formData.shippingAddress,
        subtotalAmount: subtotal,
        totalQuantity,
      })
    : 0;
  const shippingDiscountAmount = couponData?.shippingDiscountAmount || 0;
  const netShippingCost = Math.max(shippingCost - shippingDiscountAmount, 0);
  const totalDue = subtotal - discountAmount + shippingCost;
  const isFreeCheckout = totalDue <= 0;

  useEffect(() => {
    if (loading || !cart || !couponData?.code) return;

    const revalidateCoupon = async () => {
      const payload: {
        code: string;
        cartTotal: number;
        shippingAmount: number;
        sessionId?: string;
      } = {
        code: couponData.code,
        cartTotal: subtotal,
        shippingAmount: shippingCost,
      };

      const customerKey = getCouponCustomerKey(session?.id);
      if (!session?.id) {
        payload.sessionId = customerKey.replace("guest:", "");
      }

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logCouponDebug("Shipping revalidation failed", {
          cartId: cart.id,
          customerKey,
          status: response.status,
          payload,
        });
        setCouponData(null);
        return;
      }

      const data = await response.json();
      setCouponData({
        code: data.coupon.code,
        amount: data.coupon.discountAmount,
        productDiscountAmount: data.coupon.productDiscountAmount || 0,
        shippingDiscountAmount: data.coupon.shippingDiscountAmount || 0,
        includeShippingInDiscount: Boolean(
          data.coupon.includeShippingInDiscount,
        ),
        grantsFreeShipping: Boolean(data.coupon.grantsFreeShipping),
      });
    };

    void revalidateCoupon();
  }, [loading, cart, couponData?.code, shippingCost, subtotal, session?.id]);

  if (loading) {
    return <PageLoader size="lg" message="Loading checkout..." />;
  }

  if (!cart || cart.lines.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-20 max-w-7xl px-4 pb-20">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact Information */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
              <h2 className="mb-4 text-xl font-semibold">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                      <span className="text-xl">🇳🇬</span>
                      <span className="text-sm font-medium">+234</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, "");
                        handleInputChange("phone", value);
                      }}
                      className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      placeholder="801 2345 678"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
              <h2 className="mb-4 text-xl font-semibold">Shipping Address</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      First Name *
                    </label>
                    <input
                      title="first-name"
                      type="text"
                      required
                      value={formData.shippingAddress.firstName}
                      onChange={(e) =>
                        handleInputChange(
                          "firstName",
                          e.target.value,
                          "shippingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Last Name *
                    </label>
                    <input
                      title="last-name"
                      type="text"
                      required
                      value={formData.shippingAddress.lastName}
                      onChange={(e) =>
                        handleInputChange(
                          "lastName",
                          e.target.value,
                          "shippingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <LocationSelectGroup
                  stateValue={formData.shippingAddress.state}
                  lgaValue={formData.shippingAddress.lga}
                  wardValue={formData.shippingAddress.ward}
                  onStateChange={(value, source) =>
                    handleLocationChange(
                      "shippingAddress",
                      "state",
                      value,
                      source,
                    )
                  }
                  onLgaChange={(value, source) =>
                    handleLocationChange(
                      "shippingAddress",
                      "lga",
                      value,
                      source,
                    )
                  }
                  onWardChange={(value, source) =>
                    handleLocationChange(
                      "shippingAddress",
                      "ward",
                      value,
                      source,
                    )
                  }
                  inputClassName="rounded-md border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  menuClassName="rounded-lg"
                  stateRequired
                  lgaRequired
                />

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shippingAddress.streetAddress}
                    onChange={(e) =>
                      handleInputChange(
                        "streetAddress",
                        e.target.value,
                        "shippingAddress",
                      )
                    }
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="House number and street name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nearest Bus Stop / Junction *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shippingAddress.nearestBusStop}
                    onChange={(e) =>
                      handleInputChange(
                        "nearestBusStop",
                        e.target.value,
                        "shippingAddress",
                      )
                    }
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="e.g., Obalende Bus Stop"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Closest Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shippingAddress.landmark}
                    onChange={(e) =>
                      handleInputChange(
                        "landmark",
                        e.target.value,
                        "shippingAddress",
                      )
                    }
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="e.g., Opposite First Bank, Beside Redeemed Church, Black Gate"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Phone Number 1 *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                        <span className="text-xl">🇳🇬</span>
                        <span className="text-sm font-medium">+234</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={formData.shippingAddress.phone1}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          handleInputChange("phone1", value, "shippingAddress");
                        }}
                        className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        placeholder="801 2345 678"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Phone Number 2 *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                        <span className="text-xl">🇳🇬</span>
                        <span className="text-sm font-medium">+234</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={formData.shippingAddress.phone2}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          handleInputChange("phone2", value, "shippingAddress");
                        }}
                        className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        placeholder="802 3456 789"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address Option */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.useSameAddress}
                  onChange={(e) =>
                    handleInputChange("useSameAddress", e.target.checked)
                  }
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm">
                  Billing address same as shipping address
                </span>
              </label>

              {!formData.useSameAddress && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Billing Address</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        First Name *
                      </label>
                      <input
                        title="first-name"
                        type="text"
                        required
                        value={formData.billingAddress.firstName}
                        onChange={(e) =>
                          handleInputChange(
                            "firstName",
                            e.target.value,
                            "billingAddress",
                          )
                        }
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Last Name *
                      </label>
                      <input
                        title="last-name"
                        type="text"
                        required
                        value={formData.billingAddress.lastName}
                        onChange={(e) =>
                          handleInputChange(
                            "lastName",
                            e.target.value,
                            "billingAddress",
                          )
                        }
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <LocationSelectGroup
                    stateValue={formData.billingAddress.state}
                    lgaValue={formData.billingAddress.lga}
                    wardValue={formData.billingAddress.ward}
                    onStateChange={(value, source) =>
                      handleLocationChange(
                        "billingAddress",
                        "state",
                        value,
                        source,
                      )
                    }
                    onLgaChange={(value, source) =>
                      handleLocationChange(
                        "billingAddress",
                        "lga",
                        value,
                        source,
                      )
                    }
                    onWardChange={(value, source) =>
                      handleLocationChange(
                        "billingAddress",
                        "ward",
                        value,
                        source,
                      )
                    }
                    inputClassName="rounded-md border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    menuClassName="rounded-lg"
                    stateRequired
                    lgaRequired
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.billingAddress.streetAddress}
                      onChange={(e) =>
                        handleInputChange(
                          "streetAddress",
                          e.target.value,
                          "billingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      placeholder="House number and street name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Nearest Bus Stop / Junction *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.billingAddress.nearestBusStop}
                      onChange={(e) =>
                        handleInputChange(
                          "nearestBusStop",
                          e.target.value,
                          "billingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      placeholder="e.g., Obalende Bus Stop"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Closest Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.billingAddress.landmark}
                      onChange={(e) =>
                        handleInputChange(
                          "landmark",
                          e.target.value,
                          "billingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      placeholder="e.g., Opposite First Bank, Beside Redeemed Church, Black Gate"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Phone Number 1 *
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                          <span className="text-xl">🇳🇬</span>
                          <span className="text-sm font-medium">+234</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={formData.billingAddress.phone1}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            handleInputChange(
                              "phone1",
                              value,
                              "billingAddress",
                            );
                          }}
                          className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          placeholder="801 2345 678"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Phone Number 2 *
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                          <span className="text-xl">🇳🇬</span>
                          <span className="text-sm font-medium">+234</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={formData.billingAddress.phone2}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            handleInputChange(
                              "phone2",
                              value,
                              "billingAddress",
                            );
                          }}
                          className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          placeholder="802 3456 789"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Address Option (only for logged in users) */}
            {session && (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.saveAddress}
                    onChange={(e) =>
                      handleInputChange("saveAddress", e.target.checked)
                    }
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">
                    Save this address to my account for future orders
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>

              <div className="mb-4 space-y-3">
                {cart.lines.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
                      <Image
                        src={item.merchandise.product.featuredImage.url}
                        alt={item.merchandise.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.merchandise.product.title}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {item.merchandise.title}
                      </p>
                      <p className="text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div>
                      <Price
                        amount={item.cost.totalAmount.amount}
                        currencyCode={item.cost.totalAmount.currencyCode}
                        className="text-sm font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <Price
                    amount={cart.cost.subtotalAmount.amount}
                    currencyCode={cart.cost.subtotalAmount.currencyCode}
                  />
                </div>
                {couponData && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount ({couponData.code})</span>
                    <span>-₦{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  {hasShippingState ? (
                    <div className="text-right">
                      <Price
                        amount={netShippingCost.toString()}
                        currencyCode={cart.cost.totalAmount.currencyCode}
                      />
                      {shippingDiscountAmount > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          You saved ₦{shippingDiscountAmount.toFixed(2)} on
                          shipping
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Select state to see shipping
                    </span>
                  )}
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-bold dark:border-neutral-700">
                  <span>Total</span>
                  <Price
                    amount={totalDue.toString()}
                    currencyCode={cart.cost.totalAmount.currencyCode}
                  />
                </div>
                {isFreeCheckout ? (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    This coupon fully covers your order. No payment is required.
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                Shipping is calculated from your location and item count. You
                can still request a preferred courier; we&apos;ll confirm
                availability after payment.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <LoadingDots className="bg-white" />
                ) : (
                  isFreeCheckout ? "Place Order" : "Proceed to Payment"
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  Secure payment powered by Paystack
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
