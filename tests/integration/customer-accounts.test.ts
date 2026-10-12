import crypto from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { testSql } from "../setup/db";
import {
  OTHER_ORDER,
  VICTIM_EMAIL,
  VICTIM_ORDER,
  VICTIM_REQUEST_NUMBER,
} from "../setup/fixtures";
import { api, cookieFrom } from "./helpers";

const sql = testSql();
afterAll(() => sql.end());

async function magicLink(email: string, callbackUrl?: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await sql`
    insert into magic_link_tokens (email, token_hash, expires_at)
    values (${email}, ${tokenHash}, now() + interval '10 minutes')
  `;
  const params = new URLSearchParams({ email, token });
  if (callbackUrl) params.set("callbackUrl", callbackUrl);
  return `/api/user-auth/magic-link/verify?${params}`;
}

describe("registering someone else's email doesn't expose their orders", () => {
  let attacker = "";

  it("rejects wildcard emails at registration", async () => {
    const res = await api("/api/user-auth/register", {
      method: "POST",
      json: { email: "%", password: "longpassword1" },
    });
    expect(res.status).toBe(400);
  });

  it("lets a password account be created with an unverified email", async () => {
    const res = await api("/api/user-auth/register", {
      method: "POST",
      json: { email: VICTIM_EMAIL, password: "attackerpass1" },
    });
    expect(res.status).toBe(201);
    const login = await api("/api/user-auth/login", {
      method: "POST",
      json: { email: VICTIM_EMAIL, password: "attackerpass1" },
    });
    expect(login.status).toBe(200);
    attacker = cookieFrom(login);
    expect(attacker).toMatch(/^user-session=/);
  });

  it("offers no guest orders to an unverified session", async () => {
    const res = await api("/api/user-auth/order-links", { cookie: attacker });
    expect(await res.json()).toEqual({
      orders: [],
      verificationRequired: true,
    });
  });

  it("refuses to link guest orders for an unverified session", async () => {
    const res = await api("/api/user-auth/order-links", {
      method: "POST",
      cookie: attacker,
      json: { orderIds: [VICTIM_ORDER.id] },
    });
    expect(res.status).toBe(403);
    const [order] =
      await sql`select user_id from orders where id = ${VICTIM_ORDER.id}`;
    expect(order?.user_id).toBeNull();
  });

  it("doesn't claim custom requests on password login", async () => {
    const [req] = await sql`
      select user_id from custom_order_requests where request_number = ${VICTIM_REQUEST_NUMBER}
    `;
    expect(req?.user_id).toBeNull();
  });
});

describe("magic-link sign-in", () => {
  it("ignores off-site redirects", async () => {
    const res = await api(
      await magicLink(VICTIM_EMAIL, "https://evil.example/x"),
    );
    const location = res.headers.get("location") ?? "";
    expect(new URL(location).pathname).toBe("/account");
  });

  it("can't be used twice", async () => {
    const link = await magicLink(VICTIM_EMAIL);
    await api(link);
    const again = await api(link);
    expect(again.headers.get("location")).toContain("error=expired");
  });

  it("verifies the email, so only the owner's guest orders are offered", async () => {
    const res = await api(await magicLink(VICTIM_EMAIL));
    const session = cookieFrom(res);
    const links = await api("/api/user-auth/order-links", { cookie: session });
    const body = await links.json();
    expect(
      body.orders.map((o: { orderNumber: string }) => o.orderNumber),
    ).toEqual([VICTIM_ORDER.number]);
    expect(JSON.stringify(body)).not.toContain(OTHER_ORDER.number);

    const [req] = await sql`
      select user_id from custom_order_requests where request_number = ${VICTIM_REQUEST_NUMBER}
    `;
    expect(req?.user_id).not.toBeNull();
  });

  it("refuses deactivated users", async () => {
    await sql`update users set is_active = false where email = ${VICTIM_EMAIL}`;
    try {
      const res = await api(await magicLink(VICTIM_EMAIL));
      expect(res.headers.get("location")).toContain("error=inactive");
    } finally {
      await sql`update users set is_active = true where email = ${VICTIM_EMAIL}`;
    }
  });
});
