import { isValidEmail, normalizeEmail } from "lib/user-utils";

/**
 * Checkout details and their validation. Shared by the checkout page (inline
 * errors as you go) and /api/checkout/initialize (the real check), so both
 * say exactly the same thing.
 */

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  streetAddress: string;
  /** Landmark or nearest bus stop — how riders actually find you. */
  landmark: string;
  state: string;
  lga: string;
  ward?: string;
};

export type CheckoutDetails = {
  email: string;
  /** National number, 10 digits, no leading 0 (e.g. 8031234567). */
  phone1: string;
  phone2?: string;
  address: CheckoutAddress;
  notes?: string;
  couponCode?: string;
  saveAddress?: boolean;
  acceptsMarketing?: boolean;
};

export type CheckoutField =
  | "email"
  | "phone1"
  | "phone2"
  | "firstName"
  | "lastName"
  | "state"
  | "lga"
  | "streetAddress"
  | "landmark";

export type FieldErrors = Partial<Record<CheckoutField, string>>;

/** Turns 0803…, 803…, +234 803… or 234803… into 8031234567. */
export function normalizeNigerianPhone(raw: string | null | undefined) {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export const isValidNigerianPhone = (digits: string) =>
  /^[789][01]\d{8}$/.test(digits);

const clean = (value: unknown, max = 200) =>
  typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";

/** One field's message, or undefined when it's fine. */
export function validateField(
  field: CheckoutField,
  value: string,
): string | undefined {
  const v = value.trim();
  switch (field) {
    case "email":
      if (!v) return "Enter your email so we can send your receipt";
      return isValidEmail(normalizeEmail(v))
        ? undefined
        : "That email doesn't look right — check for typos";
    case "phone1":
    case "phone2": {
      if (!v)
        return field === "phone1"
          ? "Enter a phone number for the rider"
          : undefined;
      const digits = normalizeNigerianPhone(v);
      if (digits.length < 10)
        return `${10 - digits.length} more digit${10 - digits.length === 1 ? "" : "s"} needed`;
      return isValidNigerianPhone(digits)
        ? undefined
        : "Enter a Nigerian mobile number, like 0803 123 4567";
    }
    case "firstName":
      return v ? undefined : "Enter your first name";
    case "lastName":
      return v ? undefined : "Enter your last name";
    case "state":
      return v ? undefined : "Choose your state";
    case "lga":
      return v ? undefined : "Choose your LGA";
    case "streetAddress":
      return v.length >= 4 ? undefined : "Enter your house number and street";
    case "landmark":
      return v.length >= 3
        ? undefined
        : "Add a landmark or bus stop so the rider can find you";
  }
}

/** Parses an untrusted request body. Returns clean details or field errors. */
export function parseCheckoutDetails(
  body: unknown,
): { ok: true; details: CheckoutDetails } | { ok: false; errors: FieldErrors } {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const a = (
    typeof b.address === "object" && b.address !== null ? b.address : {}
  ) as Record<string, unknown>;

  const raw = {
    email: clean(b.email, 254),
    phone1: clean(b.phone1, 20),
    phone2: clean(b.phone2, 20),
    firstName: clean(a.firstName, 80),
    lastName: clean(a.lastName, 80),
    state: clean(a.state, 80),
    lga: clean(a.lga, 80),
    streetAddress: clean(a.streetAddress, 240),
    landmark: clean(a.landmark, 240),
  } satisfies Record<CheckoutField, string>;

  const errors: FieldErrors = {};
  for (const field of Object.keys(raw) as CheckoutField[]) {
    const message = validateField(field, raw[field]);
    if (message) errors[field] = message;
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const phone2 = normalizeNigerianPhone(raw.phone2);
  const ward = clean(a.ward, 80);
  const notes = clean(b.notes, 1000);
  const couponCode = clean(b.couponCode, 50);

  return {
    ok: true,
    details: {
      email: normalizeEmail(raw.email),
      phone1: normalizeNigerianPhone(raw.phone1),
      ...(phone2 && phone2 !== normalizeNigerianPhone(raw.phone1)
        ? { phone2 }
        : {}),
      address: {
        firstName: raw.firstName,
        lastName: raw.lastName,
        streetAddress: raw.streetAddress,
        landmark: raw.landmark,
        state: raw.state,
        lga: raw.lga,
        ...(ward ? { ward } : {}),
      },
      ...(notes ? { notes } : {}),
      ...(couponCode ? { couponCode } : {}),
      saveAddress: b.saveAddress === true,
      acceptsMarketing: b.acceptsMarketing === true,
    },
  };
}
