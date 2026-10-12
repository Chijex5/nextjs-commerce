import { describe, expect, it } from "vitest";
import {
  OTHER_ORDER,
  VICTIM_ORDER,
  VICTIM_REQUEST_NUMBER,
} from "../setup/fixtures";
import { api } from "./helpers";

const track = (q: Record<string, string>) =>
  api(`/api/orders/track?${new URLSearchParams(q)}`);

describe("order tracking", () => {
  it("returns only a summary for the order number alone", async () => {
    const res = await track({ orderNumber: VICTIM_ORDER.number });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.detailsRequireEmail).toBe(true);
    expect(body.order.totalAmount).toBeDefined();
    for (const field of ["id", "shippingAddress", "notes", "trackingNumber"]) {
      expect(body.order).not.toHaveProperty(field);
    }
  });

  it("keeps details hidden for the wrong email", async () => {
    const res = await track({
      orderNumber: VICTIM_ORDER.number,
      email: OTHER_ORDER.email,
    });
    expect((await res.json()).order).not.toHaveProperty("shippingAddress");
  });

  it("returns details for the matching email, any case", async () => {
    const res = await track({
      orderNumber: VICTIM_ORDER.number,
      email: "VICTIM@example.com",
    });
    const { order } = await res.json();
    expect(order.id).toBe(VICTIM_ORDER.id);
    expect(order.shippingAddress.city).toBe("Lagos");
  });

  it.each([
    ["number only", { orderNumber: VICTIM_ORDER.number }],
    ["wildcard email", { orderNumber: VICTIM_ORDER.number, email: "%" }],
  ])("order page API refuses %s", async (_, q) => {
    const res = await api(
      `/api/orders/${VICTIM_ORDER.id}?${new URLSearchParams(q)}`,
    );
    expect(res.status).toBe(404);
  });

  it("order page API works with number + email", async () => {
    const q = new URLSearchParams({
      orderNumber: VICTIM_ORDER.number,
      email: "victim@example.com",
    });
    const res = await api(`/api/orders/${VICTIM_ORDER.id}?${q}`);
    expect(res.status).toBe(200);
  });
});

describe("custom request tracking", () => {
  it("doesn't treat % as a wildcard", async () => {
    const res = await api(
      "/api/custom-order-requests/track?requestNumber=%25&email=%25",
    );
    expect(res.status).toBe(404);
  });

  it("matches the exact request number and email, any case", async () => {
    const q = new URLSearchParams({
      requestNumber: VICTIM_REQUEST_NUMBER.toLowerCase(),
      email: "VICTIM@example.com",
    });
    const res = await api(`/api/custom-order-requests/track?${q}`);
    expect(res.status).toBe(200);
  });
});
