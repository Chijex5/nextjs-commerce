"use client";

import LoadingDots from "components/loading-dots";
import PageLoader from "components/page-loader";
import { useUserSession } from "hooks/useUserSession";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

const emptyAddress: Address = {
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
};

export default function AddressesPage() {
  const { data: session, status } = useUserSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<UserAddresses>({});
  const [editMode, setEditMode] = useState<"shipping" | "billing" | null>(null);
  const [formData, setFormData] = useState<Address>(emptyAddress);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account/addresses");
      return;
    }

    if (status === "authenticated") {
      void fetchAddresses();
    }
  }, [status, router]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/user-auth/addresses");
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || {});
      }
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: "shipping" | "billing") => {
    const selectedAddress =
      type === "shipping"
        ? addresses.shippingAddress
        : addresses.billingAddress;

    setFormData(selectedAddress || emptyAddress);
    setEditMode(type);
  };

  const handleSave = async () => {
    if (!editMode) return;

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

      if (!response.ok) {
        toast.error("Failed to save address");
        return;
      }

      toast.success("Address saved successfully");
      await fetchAddresses();
      setEditMode(null);
    } catch {
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

  if (!session) return null;

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Saved addresses
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Keep your delivery information up to date for faster checkout.
        </p>
      </div>

      {editMode ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className="mb-5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {editMode === "shipping" ? "Edit shipping" : "Edit billing"} address
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              value={formData.firstName}
              onChange={(v) => handleInputChange("firstName", v)}
            />
            <Field
              label="Last name"
              value={formData.lastName}
              onChange={(v) => handleInputChange("lastName", v)}
            />
          </div>

          <div className="mt-4 space-y-4">
            <Field
              label="Street address"
              value={formData.streetAddress}
              onChange={(v) => handleInputChange("streetAddress", v)}
            />
            <Field
              label="Nearest bus stop / junction"
              value={formData.nearestBusStop}
              onChange={(v) => handleInputChange("nearestBusStop", v)}
            />
            <Field
              label="Landmark"
              value={formData.landmark}
              onChange={(v) => handleInputChange("landmark", v)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="LGA"
                value={formData.lga}
                onChange={(v) => handleInputChange("lga", v)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PhoneField
                label="Phone number 1"
                value={formData.phone1}
                onChange={(v) => handleInputChange("phone1", v)}
              />
              <PhoneField
                label="Phone number 2"
                value={formData.phone2}
                onChange={(v) => handleInputChange("phone2", v)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? (
                <LoadingDots className="bg-white dark:bg-black" />
              ) : (
                "Save address"
              )}
            </button>
            <button
              onClick={() => setEditMode(null)}
              disabled={saving}
              className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AddressCard
            title="Shipping address"
            address={addresses.shippingAddress}
            onEdit={() => handleEdit("shipping")}
          />
          <AddressCard
            title="Billing address"
            address={addresses.billingAddress}
            onEdit={() => handleEdit("billing")}
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
      />
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <div className="flex items-center rounded-xl border border-neutral-300 bg-neutral-100 px-3 text-sm font-medium dark:border-neutral-700 dark:bg-neutral-900">
          +234
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          maxLength={10}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
    </div>
  );
}

function AddressCard({
  title,
  address,
  onEdit,
}: {
  title: string;
  address?: Address;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <button
          onClick={onEdit}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
        >
          {address ? "Edit" : "Add"}
        </button>
      </div>

      {address ? (
        <div className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {address.firstName} {address.lastName}
          </p>
          <p>{address.streetAddress}</p>
          <p>{address.nearestBusStop}</p>
          <p>{address.landmark}</p>
          <p>
            {address.lga}, {address.state}
          </p>
          <p>+234 {address.phone1}</p>
          <p>+234 {address.phone2}</p>
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No address saved yet.
        </p>
      )}
    </div>
  );
}
