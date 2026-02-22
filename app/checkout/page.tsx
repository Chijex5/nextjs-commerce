"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import Price from "components/price";
import LoadingDots from "components/loading-dots";
import PageLoader from "components/page-loader";
import { TrustBadges } from "components/trust-badges";
import { useUserSession } from "hooks/useUserSession";
import { identifyUser } from "lib/analytics/tiktok-pixel";

const ORDER_NOTE_STORAGE_KEY = "orderNote";

// Nigerian States
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

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

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useUserSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponData, setCouponData] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const tiktokIdentifyKeyRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    phone: "",
    shippingAddress: {
      firstName: "",
      lastName: "",
      streetAddress: "",
      nearestBusStop: "",
      landmark: "",
      lga: "",
      state: "",
      phone1: "",
      phone2: "",
      country: "Nigeria",
    },
    billingAddress: {
      firstName: "",
      lastName: "",
      streetAddress: "",
      nearestBusStop: "",
      landmark: "",
      lga: "",
      state: "",
      phone1: "",
      phone2: "",
      country: "Nigeria",
    },
    saveAddress: false,
    useSameAddress: true,
  });

  useEffect(() => {
    fetchCart();
    loadCouponData();
    if (session) {
      fetchUserAddresses();
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

  const loadCouponData = () => {
    try {
      const stored = localStorage.getItem("appliedCoupon");
      if (stored) {
        const coupon = JSON.parse(stored);
        setCouponData({ code: coupon.code, amount: coupon.discountAmount });
      }
    } catch (err) {
      console.error("Failed to load coupon data:", err);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch("/api/user-auth/addresses");
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          email: session?.email || "",
          phone: session?.phone || prev.phone,
          shippingAddress:
            data.addresses.shippingAddress || prev.shippingAddress,
          billingAddress: data.addresses.billingAddress || prev.billingAddress,
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
        discountAmount: couponData?.amount,
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

  if (loading) {
    return <PageLoader size="lg" message="Loading checkout..." />;
  }

  if (!cart || cart.lines.length === 0) {
    return null;
  }

  const shippingCost = 0; // Shipping quoted after order is ready
  const subtotal = parseFloat(cart.cost.totalAmount.amount);
  const discountAmount = couponData?.amount || 0;
  const totalDue = subtotal - discountAmount + shippingCost;

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
                      LGA (Local Government Area) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shippingAddress.lga}
                      onChange={(e) =>
                        handleInputChange(
                          "lga",
                          e.target.value,
                          "shippingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      placeholder="e.g., Ikeja, Ikorodu"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      State *
                    </label>
                    <select
                      title="state"
                      required
                      value={formData.shippingAddress.state}
                      onChange={(e) =>
                        handleInputChange(
                          "state",
                          e.target.value,
                          "shippingAddress",
                        )
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    >
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
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
                        LGA (Local Government Area) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billingAddress.lga}
                        onChange={(e) =>
                          handleInputChange(
                            "lga",
                            e.target.value,
                            "billingAddress",
                          )
                        }
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        placeholder="e.g., Ikeja, Ikorodu"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        State *
                      </label>
                      <select
                        title="state"
                        required
                        value={formData.billingAddress.state}
                        onChange={(e) =>
                          handleInputChange(
                            "state",
                            e.target.value,
                            "billingAddress",
                          )
                        }
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
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
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Quoted after your order is ready
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-bold dark:border-neutral-700">
                  <span>Total</span>
                  <Price
                    amount={totalDue.toString()}
                    currencyCode={cart.cost.totalAmount.currencyCode}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                Shipping fees and delivery method are confirmed after your order
                is ready. You can request a preferred courier; we&apos;ll
                confirm availability and pricing.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <LoadingDots className="bg-white" />
                ) : (
                  "Proceed to Payment"
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

              {/* Trust Badges */}
              <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                <TrustBadges variant="inline" showIcons={false} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
