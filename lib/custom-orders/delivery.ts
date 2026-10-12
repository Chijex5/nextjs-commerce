/**
 * Delivery details for a custom order, collected when the customer first pays.
 * Stored in the same shape as checkout addresses so order pages, emails and
 * shipping fees treat custom orders like any other order. Pure — shared by
 * the payment form and the API.
 */
import { calculateShippingAmount } from "lib/shipping";

export type DeliveryAddress = {
  method: "delivery" | "pickup";
  firstName: string;
  lastName?: string;
  phone1: string;
  streetAddress?: string;
  landmark?: string;
  ward?: string;
  lga?: string;
  state?: string;
  country: "Nigeria";
};

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Validates untrusted input; returns the address or a message for the customer. */
export function readDeliveryAddress(
  input: unknown,
): { address: DeliveryAddress } | { error: string } {
  const v = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const method: DeliveryAddress["method"] = v.method === "pickup" ? "pickup" : "delivery";
  const name = text(v.name, 120);
  const phone1 = text(v.phone, 30);
  if (!name) return { error: "Add the name for the delivery" };
  if (phone1.replace(/\D/g, "").length < 10)
    return { error: "Add a phone number the rider can call" };
  const [firstName, ...rest] = name.split(/\s+/);
  const base = {
    method,
    firstName: firstName || name,
    lastName: rest.join(" ") || undefined,
    phone1,
    country: "Nigeria" as const,
  };
  if (method === "pickup") return { address: base };

  const state = text(v.state, 60);
  const lga = text(v.lga, 80);
  const streetAddress = text(v.streetAddress, 250);
  if (!state || !lga) return { error: "Choose your state and LGA" };
  if (!streetAddress) return { error: "Add your street address" };
  return {
    address: {
      ...base,
      state,
      lga,
      ward: text(v.ward, 80) || undefined,
      streetAddress,
      landmark: text(v.landmark, 160) || undefined,
    },
  };
}

/** Delivery fee, using the same rules as checkout. Pickup is free. */
export function deliveryFee(address: DeliveryAddress, itemsTotal: number, pairs: number) {
  if (address.method === "pickup") return 0;
  return calculateShippingAmount({
    address,
    subtotalAmount: itemsTotal,
    totalQuantity: pairs,
  });
}
