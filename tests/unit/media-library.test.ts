import { describe, expect, it } from "vitest";
import {
  isProductMediaId,
  publicIdFromUrl,
  withTransform,
} from "../../lib/admin/media-library";

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

describe("publicIdFromUrl", () => {
  const url = (path: string) =>
    `https://res.cloudinary.com/shop/image/upload/${path}`;

  it("reads the public ID from our own product photo URLs", () => {
    expect(
      publicIdFromUrl(url("v1712/dfootprint/products/abc.webp"), "shop"),
    ).toBe("dfootprint/products/abc");
    expect(publicIdFromUrl(url("dfootprint/products/abc.jpg"), "shop")).toBe(
      "dfootprint/products/abc",
    );
  });

  it("rejects other clouds, hosts, folders and junk", () => {
    expect(
      publicIdFromUrl(url("v1/dfootprint/products/a.webp"), "other"),
    ).toBeNull();
    expect(
      publicIdFromUrl(
        "https://evil.example/shop/image/upload/v1/dfootprint/products/a.webp",
        "shop",
      ),
    ).toBeNull();
    expect(
      publicIdFromUrl(url("v1/dfootprint/custom-orders/a.webp"), "shop"),
    ).toBeNull();
    expect(publicIdFromUrl("not a url", "shop")).toBeNull();
    expect(
      publicIdFromUrl(url("v1/dfootprint/products/a.webp"), undefined),
    ).toBeNull();
  });
});
