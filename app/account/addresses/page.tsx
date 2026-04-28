"use client";

import LoadingDots from "components/loading-dots";
import {
    LocationSelectGroup,
    type LocationChangeSource,
} from "components/locations/location-select-group";
import PageLoader from "components/page-loader";
import { useUserSession } from "hooks/useUserSession";
import { normalizeLocationName } from "lib/locations";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  ward: "",
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

    setFormData({ ...emptyAddress, ...(selectedAddress || {}) });
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

  const handleLocationChange = (
    field: "state" | "lga" | "ward",
    value: string,
    source: LocationChangeSource,
  ) => {
    const currentValue = formData[field] || "";
    const changed =
      normalizeLocationName(currentValue) !== normalizeLocationName(value);

    handleInputChange(field, value);

    if (source !== "select" || !changed) return;

    if (field === "state") {
      handleInputChange("lga", "");
      handleInputChange("ward", "");
    }

    if (field === "lga") {
      handleInputChange("ward", "");
    }
  };

  if (status === "loading" || loading) {
    return <PageLoader size="lg" message="Loading addresses..." />;
  }

  if (!session) return null;

  return (
    <div className="ad-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .ad-root {
          font-family: 'DM Sans', sans-serif;
          color: #F2E8D5;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 2.5rem;
        }

        .ad-hero {
          background: rgba(16,12,6,0.85);
          border: 1px solid rgba(242,232,213,0.09);
          padding: 2rem;
        }

        .ad-eyebrow {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #BF5A28;
          margin-bottom: 0.7rem;
        }

        .ad-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.75rem, 2.5vw, 2.3rem);
          font-weight: 300;
          color: #F2E8D5;
          line-height: 1.2;
        }

        .ad-sub {
          margin-top: 0.5rem;
          color: #8A7762;
          font-size: 0.85rem;
          line-height: 1.6;
          max-width: 40rem;
        }

        .ad-panel {
          background: rgba(16,12,6,0.7);
          border: 1px solid rgba(242,232,213,0.09);
          padding: 1.5rem;
        }

        .ad-panel-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.55rem;
          font-weight: 300;
          color: #F2E8D5;
          margin-bottom: 0.35rem;
        }

        .ad-panel-note {
          color: #8A7762;
          font-size: 0.8rem;
          line-height: 1.6;
        }

        .ad-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ad-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .ad-field-label {
          display: block;
          margin-bottom: 0.35rem;
          color: #8A7762;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .ad-input {
          width: 100%;
          background: rgba(10,7,4,0.8);
          border: 1px solid rgba(242,232,213,0.09);
          color: #F2E8D5;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          padding: 0.72rem 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .ad-input:focus {
          border-color: rgba(191,90,40,0.5);
        }

        .ad-phone-prefix {
          display: flex;
          align-items: center;
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.03);
          color: #C9B99A;
          padding: 0 0.75rem;
          font-size: 0.75rem;
        }

        .ad-actions {
          margin-top: 1.25rem;
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .ad-btn-primary {
          border: none;
          background: #BF5A28;
          color: #F2E8D5;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.72rem 1.2rem;
          cursor: pointer;
        }

        .ad-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ad-btn-ghost {
          border: 1px solid rgba(242,232,213,0.2);
          background: transparent;
          color: #C9B99A;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.72rem 1.2rem;
          cursor: pointer;
        }

        .ad-address-card {
          background: rgba(16,12,6,0.75);
          border: 1px solid rgba(242,232,213,0.09);
          padding: 1.25rem;
        }

        .ad-address-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.9rem;
          gap: 0.75rem;
        }

        .ad-address-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 300;
          color: #F2E8D5;
        }

        .ad-link-btn {
          border: none;
          background: none;
          color: #BF5A28;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
        }

        .ad-line {
          color: #C9B99A;
          font-size: 0.8rem;
          line-height: 1.55;
        }

        .ad-line--muted {
          color: #8A7762;
        }

        @media (max-width: 768px) {
          .ad-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ad-hero">
        <p className="ad-eyebrow">Address book</p>
        <h2 className="ad-title">Saved addresses</h2>
        <p className="ad-sub">
          Keep your delivery details current so checkout stays fast and
          accurate.
        </p>
      </div>

      {editMode ? (
        <div className="ad-panel">
          <h3 className="ad-panel-title">
            {editMode === "shipping" ? "Edit shipping" : "Edit billing"} address
          </h3>
          <p className="ad-panel-note">
            Provide complete details including landmarks and valid phone
            numbers.
          </p>

          <div className="ad-form">
            <div className="ad-grid">
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

            <LocationSelectGroup
              stateValue={formData.state}
              lgaValue={formData.lga}
              wardValue={formData.ward}
              onStateChange={(value, source) =>
                handleLocationChange("state", value, source)
              }
              onLgaChange={(value, source) =>
                handleLocationChange("lga", value, source)
              }
              onWardChange={(value, source) =>
                handleLocationChange("ward", value, source)
              }
              inputClassName="ad-input"
              menuClassName="rounded-none border border-[rgba(242,232,213,0.09)] bg-[#100C06]"
            />

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

            <div className="ad-grid">
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

          <div className="ad-actions">
            <button
              onClick={handleSave}
              disabled={saving}
              className="ad-btn-primary"
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
              className="ad-btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="ad-grid">
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
      <label className="ad-field-label">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ad-input"
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
      <label className="ad-field-label">{label}</label>
      <div className="flex gap-2">
        <div className="ad-phone-prefix">+234</div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          maxLength={10}
          className="ad-input"
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
    <div className="ad-address-card">
      <div className="ad-address-head">
        <h3 className="ad-address-title">{title}</h3>
        <button onClick={onEdit} className="ad-link-btn">
          {address ? "Edit" : "Add"}
        </button>
      </div>

      {address ? (
        <div>
          <p
            className="ad-line"
            style={{ color: "#F2E8D5", marginBottom: "0.2rem" }}
          >
            {address.firstName} {address.lastName}
          </p>
          <p className="ad-line">{address.streetAddress}</p>
          <p className="ad-line">{address.nearestBusStop}</p>
          <p className="ad-line">{address.landmark}</p>
          <p className="ad-line">
            {[address.ward, address.lga, address.state]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="ad-line">+234 {address.phone1}</p>
          <p className="ad-line">+234 {address.phone2}</p>
        </div>
      ) : (
        <p className="ad-line ad-line--muted">No address saved yet.</p>
      )}
    </div>
  );
}
