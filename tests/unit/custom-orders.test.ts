import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  buildTitle,
  depositFor,
  estimate,
  normaliseSettings,
  quoteLines,
  timelineStep,
  type ChosenEdit,
} from "lib/custom-orders/shared";
import { deliveryFee, readDeliveryAddress } from "lib/custom-orders/delivery";
import { toLinkList, toUploadList } from "lib/custom-orders/uploads";
import {
  isValidRequestAccessToken,
  requestAccessToken,
} from "lib/custom-order-utils";

const roses: ChosenEdit = { id: "a", name: "Add roses", price: 2000, needsReview: false };
const sole: ChosenEdit = { id: "b", name: "Change the sole", price: 3000, needsReview: true };

describe("estimate", () => {
  const base = { basePrice: 12000, sizeEu: 40, pairs: 1, hasExtraNote: false, settings: DEFAULT_SETTINGS };

  it("adds priced edits to the base design", () => {
    const e = estimate({ ...base, edits: [roses] });
    expect(e.total).toBe(14000);
    expect(e.partial).toBe(false);
    expect(e.lines.map((l) => l.label)).toEqual(["Base design", "Add roses"]);
  });

  it("charges the large-size surcharge from the configured size", () => {
    expect(estimate({ ...base, edits: [], sizeEu: 42 }).total).toBe(12000);
    expect(estimate({ ...base, edits: [], sizeEu: 43 }).total).toBe(14000);
  });

  it("multiplies by the number of pairs", () => {
    expect(estimate({ ...base, edits: [roses], pairs: 3 }).total).toBe(42000);
  });

  it("is a 'from' price when an edit needs review or there's a free-text extra", () => {
    expect(estimate({ ...base, edits: [sole] }).partial).toBe(true);
    expect(estimate({ ...base, edits: [roses], hasExtraNote: true }).partial).toBe(true);
  });
});

describe("buildTitle", () => {
  it("names the design and the changes", () => {
    expect(buildTitle({ kind: "modify", productTitle: "Amara slide", edits: [roses] })).toBe(
      "Amara slide — Add roses",
    );
    expect(buildTitle({ kind: "new", style: "Slides", edits: [] })).toBe("New slides");
  });
});

describe("timelineStep", () => {
  it("maps statuses to the customer timeline", () => {
    expect(timelineStep("needs_info")).toBe(0);
    expect(timelineStep("quoted")).toBe(1);
    expect(timelineStep("in_production")).toBe(3);
    expect(timelineStep("rejected")).toBe(-1);
  });
});

describe("normaliseSettings", () => {
  it("fills gaps with defaults and clamps bad values", () => {
    expect(normaliseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normaliseSettings({ depositPercent: 500, replyHours: "abc" })).toMatchObject({
      depositPercent: 100,
      replyHours: DEFAULT_SETTINGS.replyHours,
    });
  });
});

describe("reference inputs", () => {
  it("keeps only our own Cloudinary uploads", () => {
    expect(
      toUploadList(
        [
          "https://res.cloudinary.com/x/image/upload/v1/dfootprint/custom-orders/requests/a.webp",
          "https://evil.example/dfootprint/custom-orders/requests/a.webp",
          "javascript:alert(1)",
        ],
        6,
      ),
    ).toHaveLength(1);
  });

  it("keeps https links from known inspiration sites only", () => {
    expect(
      toLinkList(
        ["https://vm.tiktok.com/abc", "https://www.pinterest.co.uk/pin/1", "http://instagram.com/p/x", "https://evil.example"],
        3,
      ),
    ).toEqual(["https://vm.tiktok.com/abc", "https://www.pinterest.co.uk/pin/1"]);
  });
});

describe("request access token", () => {
  const previous = process.env.NEXTAUTH_SECRET;
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = "unit-test-secret";
  });
  afterAll(() => {
    process.env.NEXTAUTH_SECRET = previous;
  });

  it("accepts the token for its own request only", () => {
    const token = requestAccessToken("COR-1-AAAAA");
    expect(isValidRequestAccessToken("COR-1-AAAAA", token)).toBe(true);
    expect(isValidRequestAccessToken("COR-1-BBBBB", token)).toBe(false);
    expect(isValidRequestAccessToken("COR-1-AAAAA", "")).toBe(false);
    expect(isValidRequestAccessToken("COR-1-AAAAA", `${token}x`)).toBe(false);
  });
});

describe("depositFor", () => {
  it("rounds the deposit to the nearest ₦100", () => {
    expect(depositFor(25_000, 50)).toBe(12_500);
    expect(depositFor(23_450, 50)).toBe(11_700);
  });
  it("is null when there's nothing left to pay later", () => {
    expect(depositFor(25_000, 100)).toBeNull();
    expect(depositFor(0, 50)).toBeNull();
    expect(depositFor(100, 10)).toBeNull();
  });
});

describe("quoteLines", () => {
  it("keeps well-formed lines and drops the rest", () => {
    expect(
      quoteLines({ lines: [{ label: "Base", amount: "15000" }, { label: 3 }, null] }),
    ).toEqual([{ label: "Base", amount: 15_000 }]);
    expect(quoteLines(null)).toEqual([]);
    expect(quoteLines({})).toEqual([]);
  });
});

describe("readDeliveryAddress", () => {
  const delivery = {
    method: "delivery",
    name: "Ada Obi Eze",
    phone: "0803 123 4567",
    state: "Lagos",
    lga: "Ikeja",
    streetAddress: "12 Allen Avenue",
  };

  it("accepts a full delivery address and splits the name", () => {
    const result = readDeliveryAddress(delivery);
    expect("address" in result && result.address).toMatchObject({
      method: "delivery",
      firstName: "Ada",
      lastName: "Obi Eze",
      state: "Lagos",
      country: "Nigeria",
    });
  });

  it("needs a name, a callable phone, and an address for delivery", () => {
    expect(readDeliveryAddress(undefined)).toEqual({ error: "Add the name for the delivery" });
    expect(readDeliveryAddress({ ...delivery, phone: "123" })).toHaveProperty("error");
    expect(readDeliveryAddress({ ...delivery, lga: "" })).toHaveProperty("error");
    expect(readDeliveryAddress({ ...delivery, streetAddress: " " })).toHaveProperty("error");
  });

  it("only needs a name and phone for pickup, and pickup is free", () => {
    const result = readDeliveryAddress({ method: "pickup", name: "Ada", phone: "08031234567" });
    expect("address" in result).toBe(true);
    if ("address" in result) {
      expect(result.address.state).toBeUndefined();
      expect(deliveryFee(result.address, 30_000, 1)).toBe(0);
    }
  });

  it("charges delivery like checkout", () => {
    const result = readDeliveryAddress(delivery);
    if (!("address" in result)) throw new Error("expected an address");
    expect(deliveryFee(result.address, 30_000, 1)).toBe(4000);
  });
});
