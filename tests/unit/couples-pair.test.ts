import { describe, expect, it } from "vitest";
import { carryStock } from "lib/admin/product-variants";
import { stockShortfalls } from "lib/checkout/stock";
import {
  lineKey,
  pairLabel,
  parsePairing,
  setSaving,
  setTitle,
  setUnitPrice,
  withCouple,
} from "lib/pairing";
import type { Product } from "lib/types/commerce";

describe("couples set pricing", () => {
  it("takes a fixed naira discount off both pairs", () => {
    const fixed = { discountType: "fixed", discountValue: 5000 } as const;
    expect(setUnitPrice(25000, 22000, fixed)).toBe(42000);
    expect(setSaving(25000, 22000, fixed)).toBe(5000);
  });

  it("takes a percentage off both pairs", () => {
    const pct = { discountType: "percentage", discountValue: 10 } as const;
    expect(setUnitPrice(25000, 15000, pct)).toBe(36000);
  });

  it("never prices a set below zero or a percentage above 90%", () => {
    expect(
      setUnitPrice(1000, 1000, { discountType: "fixed", discountValue: 9999 }),
    ).toBe(0);
    expect(
      setUnitPrice(1000, 1000, {
        discountType: "percentage",
        discountValue: 100,
      }),
    ).toBe(200);
  });

  it("reads saved config defensively", () => {
    expect(parsePairing(null)).toBeNull();
    expect(
      parsePairing({ discountType: "percentage", discountValue: 150 }),
    ).toEqual({
      discountType: "percentage",
      discountValue: 90,
      labels: ["His", "Hers"],
    });
    expect(
      parsePairing({ discountValue: "abc", labels: ["  Groom ", ""] }),
    ).toEqual({
      discountType: "fixed",
      discountValue: 0,
      labels: ["Groom", "Hers"],
    });
  });
});

describe("couples set lines", () => {
  const his = [
    { name: "Size", value: "43" },
    { name: "Color", value: "Black" },
  ];
  const hers = [
    { name: "Size", value: "38" },
    { name: "Color", value: "Tan" },
  ];

  it("names both pairs", () => {
    expect(pairLabel(his)).toBe("43 / Black");
    expect(setTitle(his, hers)).toBe(
      "Couple set · His 43 / Black · Hers 38 / Tan",
    );
    expect(setTitle(his, [], ["Groom", "Bride"])).toBe(
      "Couple set · Groom 43 / Black · Bride",
    );
  });

  it("keys a set separately from its pairs", () => {
    expect(lineKey("a")).toBe("a");
    expect(lineKey("a", "b")).toBe("a+b");
    expect(lineKey("a", null)).toBe("a");
  });
});

describe("stock across the bag", () => {
  it("lets lines through when stock covers the whole bag", () => {
    expect(
      stockShortfalls([
        { lineId: "1", quantity: 1, parts: [{ id: "his43", left: 2 }] },
        {
          lineId: "2",
          quantity: 1,
          parts: [
            { id: "his43", left: 2 },
            { id: "hers38", left: 1 },
          ],
        },
      ]).size,
    ).toBe(0);
  });

  it("catches a pair wanted by a single and a set at once", () => {
    const short = stockShortfalls([
      { lineId: "single", quantity: 1, parts: [{ id: "his43", left: 1 }] },
      {
        lineId: "set",
        quantity: 1,
        parts: [
          { id: "his43", left: 1 },
          { id: "hers38", left: 5 },
        ],
      },
    ]);
    expect(short.get("single")).toBe(0);
    expect(short.get("set")).toBe(0);
  });

  it("limits a set by its scarcer pair", () => {
    const short = stockShortfalls([
      {
        lineId: "set",
        quantity: 3,
        parts: [
          { id: "his43", left: 5 },
          { id: "hers38", left: 2 },
        ],
      },
    ]);
    expect(short.get("set")).toBe(2);
  });

  it("never limits made-to-order pairs", () => {
    expect(
      stockShortfalls([
        {
          lineId: "set",
          quantity: 20,
          parts: [
            { id: "a", left: Infinity },
            { id: "b", left: Infinity },
          ],
        },
      ]).size,
    ).toBe(0);
  });
});

describe("couple listing", () => {
  const product = (
    id: string,
    min: number,
    max: number,
    image = "",
  ): Product => ({
    id,
    handle: id,
    availableForSale: true,
    title: id,
    description: "",
    descriptionHtml: "",
    options: [],
    priceRange: {
      minVariantPrice: { amount: String(min), currencyCode: "NGN" },
      maxVariantPrice: { amount: String(max), currencyCode: "NGN" },
    },
    variants: [],
    featuredImage: { url: image, altText: "", width: 1, height: 1 },
    images: image ? [{ url: image, altText: "", width: 1, height: 1 }] : [],
    seo: { title: id, description: "" },
    tags: [],
    updatedAt: "",
  });
  const listing = {
    ...product("set", 0, 0),
    pairing: parsePairing({ discountType: "fixed", discountValue: 5000 }),
  };

  it("prices the set from both products, men's dearer than women's", () => {
    const men = product("men", 30000, 34000, "/men.jpg");
    const women = product("women", 22000, 24000, "/women.jpg");
    const view = withCouple(listing, men, women);
    expect(view.couple).toEqual({ first: men, second: women });
    expect(view.priceRange.minVariantPrice.amount).toBe("47000");
    expect(view.priceRange.maxVariantPrice.amount).toBe("53000");
    // No photos of its own: shows both pairs'.
    expect(view.images.map((i) => i.url)).toEqual(["/men.jpg", "/women.jpg"]);
    expect(view.featuredImage.url).toBe("/men.jpg");
  });

  it("drops out of the shop when either product is missing or hidden", () => {
    const men = product("men", 30000, 30000);
    const hidden = {
      ...product("women", 22000, 22000),
      availableForSale: false,
    };
    expect(withCouple(listing, men, hidden)).toMatchObject({
      couple: null,
      availableForSale: false,
    });
    expect(withCouple(listing, men, undefined).availableForSale).toBe(false);
    expect(withCouple(listing, men, men).couple).toBeNull();
  });

  it("leaves ordinary products alone", () => {
    const men = product("men", 30000, 30000);
    expect(withCouple(men, undefined, undefined)).toBe(men);
  });
});

describe("admin variant rebuild", () => {
  it("keeps counted stock when variants are rebuilt", () => {
    const next = carryStock(
      [
        {
          title: "43 / Black",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "43" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          title: "44 / Black",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "44" },
            { name: "Color", value: "Black" },
          ],
        },
      ],
      [
        {
          title: "43 / Black",
          // Saved in a different order: still the same variant.
          selectedOptions: [
            { name: "Color", value: "Black" },
            { name: "Size", value: "43" },
          ],
          trackInventory: true,
          stockQuantity: 0,
          availableForSale: false,
        },
      ],
    );
    expect(next[0]).toMatchObject({
      trackInventory: true,
      stockQuantity: 0,
      availableForSale: false,
    });
    expect(next[1]).not.toHaveProperty("trackInventory");
  });
});
