"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";
import { useUserSession } from "hooks/useUserSession";

interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
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
    address: "",
    city: "",
    state: "",
    postalCode: "",
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
        address: "",
        city: "",
        state: "",
        postalCode: "",
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
    return (
      <div className="mx-auto mt-20 max-w-4xl px-4">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div className="space-y-4">
            <div className="h-64 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="h-64 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
          </div>
        </div>
      </div>
    );
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
          <p>{address.address}</p>
          <p>
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p>{address.country}</p>
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
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="Street address"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Country *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
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
