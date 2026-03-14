export type ShippingAddressInfo = {
  state?: string | null;
  lga?: string | null;
  ward?: string | null;
};

export type ShippingCalculationInput = {
  address?: ShippingAddressInfo | null;
  subtotalAmount: number;
  totalQuantity: number;
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const SOUTH_WEST = new Set(
  ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"].map(normalize),
);
const SOUTH_EAST = new Set(
  ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"].map(normalize),
);
const SOUTH_SOUTH = new Set(
  ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"].map(
    normalize,
  ),
);
const NORTH = new Set(
  [
    "Benue",
    "Kogi",
    "Kwara",
    "Nasarawa",
    "Niger",
    "Plateau",
    "FCT",
    "Adamawa",
    "Bauchi",
    "Borno",
    "Gombe",
    "Taraba",
    "Yobe",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Sokoto",
    "Zamfara",
  ].map(normalize),
);

const LAGOS = normalize("Lagos");
const OJO = normalize("Ojo");
const IBA = normalize("Iba");

const getBaseShipping = (address?: ShippingAddressInfo | null) => {
  const state = normalize(address?.state || "");
  const lga = normalize(address?.lga || "");
  const ward = normalize(address?.ward || "");

  if (state === LAGOS) {
    if (lga === OJO && ward === IBA) return 1000;
    if (lga === OJO) return 3000;
    return 4000;
  }

  if (SOUTH_WEST.has(state)) return 6000;
  if (SOUTH_EAST.has(state)) return 7000;
  if (SOUTH_SOUTH.has(state)) return 7000;
  if (NORTH.has(state)) return 10000;

  return 10000;
};

export const calculateShippingAmount = ({
  address,
  subtotalAmount,
  totalQuantity,
}: ShippingCalculationInput) => {
  const quantity = Math.max(1, Number.isFinite(totalQuantity) ? totalQuantity : 1);
  const baseShipping = getBaseShipping(address);
  const multiplier = 1 + 0.2 * Math.max(0, quantity - 1);
  let shipping = baseShipping * multiplier;

  if (subtotalAmount > 5000) {
    const cap = subtotalAmount * 0.4;
    if (shipping > cap) {
      shipping = cap;
    }
  }

  return Math.round(shipping);
};
