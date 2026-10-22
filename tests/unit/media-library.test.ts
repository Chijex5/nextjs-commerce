import { describe, expect, it } from "vitest";
import { isProductMediaId, withTransform } from "../../lib/admin/media-library";

describe("isProductMediaId", () => {
  it("accepts product photo public IDs", () => {
    expect(isProductMediaId("dfootprint/products/abc123")).toBe(true);
    expect(isProductMediaId("dfootprint/products/a-b_c.webp")).toBe(true);
  });

  it("rejects anything outside the product folder", () => {
    expect(isProductMediaId("dfootprint/custom-orders/requests/a")).toBe(false);
    expect(isProductMediaId("dfootprint/products/../custom-orders/a")).toBe(
      false,
    );
    expect(isProductMediaId("dfootprint/products/a?b")).toBe(false);
    expect(isProductMediaId(null)).toBe(false);
  });
});

describe("withTransform", () => {
  it("inserts a transformation after /upload/", () => {
    expect(
      withTransform(
        "https://res.cloudinary.com/x/image/upload/v1/dfootprint/products/a.webp",
        "w_300",
      ),
    ).toBe(
      "https://res.cloudinary.com/x/image/upload/w_300/v1/dfootprint/products/a.webp",
    );
  });
});
