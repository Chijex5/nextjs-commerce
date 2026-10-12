import { describe, expect, it } from "vitest";
import {
  normalizeNigerianPhone,
  parseCheckoutDetails,
  validateField,
} from "lib/checkout/details";
import {
  estimateDelivery,
  formatDeliveryRange,
} from "lib/checkout/delivery-estimate";
import { readSnapshot } from "lib/checkout/snapshot";

const valid = {
  email: "  Ada@Example.com ",
  phone1: "0803 123 4567",
  address: {
    firstName: "Ada",
    lastName: "Okafor",
    state: "Lagos",
    lga: "Eti-Osa",
    streetAddress: "14 Admiralty Way",
    landmark: "Opposite the filling station",
  },
};

describe("checkout details", () => {
  it("normalises Nigerian phone numbers", () => {
    for (const raw of [
      "08031234567",
      "8031234567",
      "+234 803 123 4567",
      "2348031234567",
    ]) {
      expect(normalizeNigerianPhone(raw)).toBe("8031234567");
    }
  });

  it("explains phone problems as you type", () => {
    expect(validateField("phone1", "0803")).toBe("7 more digits needed");
    expect(validateField("phone1", "0603 123 4567")).toMatch(/Nigerian mobile/);
    expect(validateField("phone1", "")).toMatch(/rider/);
    expect(validateField("phone2", "")).toBeUndefined();
  });

  it("accepts a complete form and cleans it", () => {
    const result = parseCheckoutDetails({
      ...valid,
      phone2: "",
      couponCode: " ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.details.email).toBe("ada@example.com");
    expect(result.details.phone1).toBe("8031234567");
    expect(result.details.phone2).toBeUndefined();
    expect(result.details.couponCode).toBeUndefined();
    expect(result.details.address.landmark).toBe(
      "Opposite the filling station",
    );
  });

  it("drops a second phone that repeats the first", () => {
    const result = parseCheckoutDetails({ ...valid, phone2: "+2348031234567" });
    expect(result.ok && result.details.phone2).toBeUndefined();
  });

  it("names every field that needs fixing", () => {
    const result = parseCheckoutDetails({
      email: "ada@",
      address: { state: "Lagos" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      [
        "email",
        "firstName",
        "landmark",
        "lastName",
        "lga",
        "phone1",
        "streetAddress",
      ].sort(),
    );
  });

  it("survives junk bodies", () => {
    expect(parseCheckoutDetails(null).ok).toBe(false);
    expect(parseCheckoutDetails("x").ok).toBe(false);
  });
});

describe("delivery estimate", () => {
  // Tuesday 13 Oct 2026, 10:00 in Lagos.
  const now = new Date("2026-10-13T09:00:00Z");

  it("adds production and Lagos transit, skipping Sundays", () => {
    const e = estimateDelivery({ productionDays: [7], state: "Lagos", now });
    // 8 working days → Thu 22 Oct; 9 → Fri 23 Oct.
    expect(e).toEqual({
      from: "2026-10-22",
      to: "2026-10-23",
      productionDays: 7,
    });
    expect(formatDeliveryRange(e)).toBe("Thu 22 – Fri 23 Oct");
  });

  it("uses the slowest item and the default for unknown ones", () => {
    const e = estimateDelivery({
      productionDays: [2, null],
      state: "Kano",
      now,
    });
    expect(e.productionDays).toBe(7);
  });

  it("ships stocked-only bags straight away", () => {
    const e = estimateDelivery({ productionDays: [0], state: "Lagos", now });
    expect(e.from).toBe("2026-10-14");
  });

  it("uses Lagos's date, not UTC's, late at night", () => {
    // 23:30 UTC on the 12th is already the 13th in Lagos.
    const late = estimateDelivery({
      productionDays: [0],
      state: "Lagos",
      now: new Date("2026-10-12T23:30:00Z"),
    });
    expect(late.from).toBe("2026-10-14");
  });
});

describe("checkout snapshot", () => {
  it("only accepts a well-formed snapshot", () => {
    expect(readSnapshot(null)).toBeNull();
    expect(
      readSnapshot({ version: 1, cartId: "c", lines: [], amountInKobo: 1 }),
    ).toBeNull();
    const ok = { version: 1, cartId: "c", lines: [{}], amountInKobo: 100 };
    expect(readSnapshot(ok)).toBe(ok);
  });
});
