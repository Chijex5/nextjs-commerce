"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";
import PageLoader from "components/page-loader";
import { useUserSession } from "hooks/useUserSession";

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

interface UserAddresses {
  shippingAddress?: Address;
  billingAddress?: Address;
}

export default function AddressesPage() {
  const { data: session, status } = useUserSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<UserAddresses>({});
  const [editMode, setEditMode] = useState<"shipping" | "billing" | null>(null);
  const [formData, setFormData] = useState<Address>({
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
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account/addresses");
    } else if (status === "authenticated") {
      fetchAddresses();
    }
  }, [status, router]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/user-auth/addresses");
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || {});
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: "shipping" | "billing") => {
    const address =
      type === "shipping"
        ? addresses.shippingAddress
        : addresses.billingAddress;
    if (address) {
      setFormData(address);
    } else {
      setFormData({
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
      });
    }
    setEditMode(type);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user-auth/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editMode,
          address: formData,
        }),
      });

      if (response.ok) {
        toast.success("Address saved successfully");
        await fetchAddresses();
        setEditMode(null);
      } else {
        toast.error("Failed to save address");
      }
    } catch (error) {
      console.error("Failed to save address:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (status === "loading" || loading) {
    return <PageLoader size="lg" message="Loading addresses..." />;
  }

  if (!session) {
    return null;
  }

  const AddressCard = ({
    title,
    address,
    type,
  }: {
    title: string;
    address?: Address;
    type: "shipping" | "billing";
  }) => (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={() => handleEdit(type)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {address ? "Edit" : "Add"}
        </button>
      </div>
      {address ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {address.firstName} {address.lastName}
          </p>
          <p>{address.streetAddress}</p>
          <p>Nearest Bus Stop: {address.nearestBusStop}</p>
          <p>Landmark: {address.landmark}</p>
          <p>
            {address.lga}, {address.state}
          </p>
          <p>Phone 1: +234 {address.phone1}</p>
          <p>Phone 2: +234 {address.phone2}</p>
        </div>
      ) : (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No {title.toLowerCase()} saved yet
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto mt-20 max-w-4xl px-4 pb-20">
      <h1 className="mb-6 text-3xl font-bold">Saved Addresses</h1>

      {editMode ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
          <h2 className="mb-4 text-xl font-semibold">
            {editMode === "shipping" ? "Shipping Address" : "Billing Address"}
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
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
                value={formData.streetAddress}
                onChange={(e) =>
                  handleInputChange("streetAddress", e.target.value)
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
                value={formData.nearestBusStop}
                onChange={(e) =>
                  handleInputChange("nearestBusStop", e.target.value)
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
                value={formData.landmark}
                onChange={(e) => handleInputChange("landmark", e.target.value)}
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
                  value={formData.lga}
                  onChange={(e) => handleInputChange("lga", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="e.g., Ikeja, Ikorodu"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  State *
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
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
                    value={formData.phone1}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      handleInputChange("phone1", value);
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
                    value={formData.phone2}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      handleInputChange("phone2", value);
                    }}
                    className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="802 3456 789"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <LoadingDots className="bg-white" /> : "Save Address"}
            </button>
            <button
              onClick={() => setEditMode(null)}
              disabled={saving}
              className="rounded-md border border-neutral-300 px-6 py-2 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AddressCard
            title="Shipping Address"
            address={addresses.shippingAddress}
            type="shipping"
          />
          <AddressCard
            title="Billing Address"
            address={addresses.billingAddress}
            type="billing"
          />
        </div>
      )}
    </div>
  );
}
