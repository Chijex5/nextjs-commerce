import { afterAll, describe, expect, it } from "vitest";
import { testSql } from "../setup/db";
import { PLAIN_ADMIN_ID, SUPER_ADMIN_ID } from "../setup/fixtures";
import { adminCookie, api } from "./helpers";

const sql = testSql();
afterAll(async () => {
  await sql`update admin_users set is_active = true, role = 'admin' where id = ${PLAIN_ADMIN_ID}`;
  await sql.end();
});

describe("admin team management", () => {
  it("ignores a forged role in the token: plain admins can't add admins", async () => {
    const forged = await adminCookie(PLAIN_ADMIN_ID, "super_admin");
    const res = await api("/api/admin/admins", {
      method: "POST",
      cookie: forged,
      json: {
        email: "new1@test.dev",
        password: "longpassword1",
        role: "super_admin",
      },
    });
    expect(res.status).toBe(403);
  });

  it("plain admins can't delete a super admin", async () => {
    const res = await api(`/api/admin/admins/${SUPER_ADMIN_ID}`, {
      method: "DELETE",
      cookie: await adminCookie(PLAIN_ADMIN_ID, "admin"),
    });
    expect(res.status).toBe(403);
  });

  it("plain admins can still read the team", async () => {
    const res = await api("/api/admin/admins", {
      cookie: await adminCookie(PLAIN_ADMIN_ID, "admin"),
    });
    expect(res.status).toBe(200);
  });

  it("rejects unknown roles", async () => {
    const res = await api("/api/admin/admins", {
      method: "POST",
      cookie: await adminCookie(SUPER_ADMIN_ID, "super_admin"),
      json: {
        email: "new2@test.dev",
        password: "longpassword1",
        role: "owner",
      },
    });
    expect(res.status).toBe(400);
  });

  it("super admins can add an admin (email stored lower-case)", async () => {
    const res = await api("/api/admin/admins", {
      method: "POST",
      cookie: await adminCookie(SUPER_ADMIN_ID, "super_admin"),
      json: {
        email: "New3@Test.dev",
        password: "longpassword1",
        role: "admin",
      },
    });
    expect(res.ok).toBe(true);
    const [row] =
      await sql`select email from admin_users where email = 'new3@test.dev'`;
    expect(row).toBeDefined();
  });

  it.each([
    ["deactivate", { isActive: false }],
    ["demote", { role: "admin" }],
  ])("super admins can't %s themselves", async (_, body) => {
    const res = await api(`/api/admin/admins/${SUPER_ADMIN_ID}`, {
      method: "PUT",
      cookie: await adminCookie(SUPER_ADMIN_ID, "super_admin"),
      json: body,
    });
    expect(res.status).toBe(400);
  });
});

describe("admin sessions follow the database", () => {
  it("a promotion takes effect on the existing token", async () => {
    await sql`update admin_users set role = 'super_admin' where id = ${PLAIN_ADMIN_ID}`;
    const res = await api("/api/admin/admins", {
      method: "POST",
      cookie: await adminCookie(PLAIN_ADMIN_ID, "admin"),
      json: { email: "new4@test.dev", password: "longpassword1" },
    });
    expect(res.ok).toBe(true);
  });

  it("a deactivated admin's existing token stops working", async () => {
    await sql`update admin_users set is_active = false where id = ${PLAIN_ADMIN_ID}`;
    const res = await api("/api/admin/admins", {
      cookie: await adminCookie(PLAIN_ADMIN_ID, "admin"),
    });
    expect(res.status).toBe(401);
  });
});
