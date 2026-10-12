import { describe, expect, it } from "vitest";
import { api } from "./helpers";

describe("custom-order image uploads", () => {
  const publicId = "dfootprint/custom-orders/requests/abc";

  it("won't delete without the upload's token", async () => {
    const res = await api("/api/custom-order-requests/upload", {
      method: "DELETE",
      json: { publicId },
    });
    expect(res.status).toBe(400);
  });

  it("won't delete with a forged token", async () => {
    const res = await api("/api/custom-order-requests/upload", {
      method: "DELETE",
      json: { publicId, deleteToken: "forged" },
    });
    expect(res.status).toBe(403);
  });
});

describe("cron auth", () => {
  it("rejects 'Bearer undefined'", async () => {
    const res = await api("/api/custom-order-quotes/cron", {
      headers: { authorization: "Bearer undefined" },
    });
    expect(res.status).toBe(401);
  });

  it("accepts Vercel's bearer header", async () => {
    const res = await api("/api/custom-order-quotes/cron", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status).toBe(200);
  });
});

describe("rate limits", () => {
  it("throttles newsletter sign-ups per IP", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await api("/api/newsletter/subscribe", {
        method: "POST",
        ip: "203.0.113.7",
        json: { email: `rl${i}@example.com` },
      });
      statuses.push(res.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});
