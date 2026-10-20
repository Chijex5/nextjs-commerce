import { describe, expect, it } from "vitest";
import { carryStock, splitByWearer } from "lib/admin/product-variants";
import { stockShortfalls } from "lib/checkout/stock";
import {
  lineKey,
  pairLabel,
  parsePairing,
  setSaving,
  setTitle,
  setUnitPrice,
  wearerOf,
} from "lib/pairing";

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
    ).toEqual({ discountType: "percentage", discountValue: 90 });
    expect(parsePairing({ discountValue: "abc" })).toEqual({
      discountType: "fixed",
      discountValue: 0,
    });
  });
});

describe("couples set lines", () => {
  const his = [
    { name: "Wearer", value: "His" },
    { name: "Size", value: "43" },
    { name: "Color", value: "Black" },
  ];
  const hers = [
    { name: "Wearer", value: "Hers" },
    { name: "Size", value: "38" },
    { name: "Color", value: "Tan" },
  ];

  it("names both pairs", () => {
    expect(wearerOf(his)).toBe("His");
    expect(wearerOf([{ name: "Size", value: "40" }])).toBeNull();
    expect(pairLabel(his)).toBe("43 / Black");
    expect(setTitle(his, hers)).toBe(
      "Couple set · His 43 / Black · Hers 38 / Tan",
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

describe("admin variant rebuild", () => {
  it("makes every size and colour for His and Hers", () => {
    const rows = splitByWearer([
      {
        title: "43 / Black",
        selectedOptions: [
          { name: "Size", value: "43" },
          { name: "Color", value: "Black" },
        ],
      },
    ]);
    expect(rows.map((r) => r.title)).toEqual([
      "His / 43 / Black",
      "Hers / 43 / Black",
    ]);
    expect(rows[1]!.selectedOptions[0]).toEqual({
      name: "Wearer",
      value: "Hers",
    });
  });

  it("keeps counted stock when variants are rebuilt", () => {
    const next = carryStock(
      [
        {
          title: "His / 43",
          availableForSale: true,
          selectedOptions: [
            { name: "Wearer", value: "His" },
            { name: "Size", value: "43" },
          ],
        },
        {
          title: "His / 44",
          availableForSale: true,
          selectedOptions: [
            { name: "Wearer", value: "His" },
            { name: "Size", value: "44" },
          ],
        },
      ],
      [
        {
          title: "His / 43",
          // Saved in a different order: still the same variant.
          selectedOptions: [
            { name: "Size", value: "43" },
            { name: "Wearer", value: "His" },
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
