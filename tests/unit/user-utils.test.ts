import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { emailEquals } from "lib/db/email-match";
import { users } from "lib/db/schema";
import { isValidEmail, normalizeEmail, safeRedirectPath } from "lib/user-utils";

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last+tag@shop.example.ng"])("accepts %s", (e) =>
    expect(isValidEmail(e)).toBe(true),
  );
  it.each(["%", "_", "%@%", "no-at.example.com", "a b@c.de", "a@b", ""])(
    "rejects %j",
    (e) => expect(isValidEmail(e)).toBe(false),
  );
  it("rejects over-long addresses", () => {
    expect(isValidEmail(`${"a".repeat(250)}@b.co`)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  const fallback = "/account";
  it.each(["/orders", "/account?welcome=1", "/a/b#c"])("keeps %s", (p) =>
    expect(safeRedirectPath(p, fallback)).toBe(p),
  );
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "orders",
    "",
    null,
    undefined,
  ])("rejects %j", (p) => expect(safeRedirectPath(p, fallback)).toBe(fallback));
});

describe("emailEquals", () => {
  it("compares lower-cased values exactly, with the value as a parameter", () => {
    const query = new PgDialect().sqlToQuery(
      emailEquals(users.email, "  Victim@Example.COM "),
    );
    expect(query.sql).toBe('lower("users"."email") = $1');
    expect(query.params).toEqual(["victim@example.com"]);
    expect(query.sql).not.toMatch(/like/i);
  });

  it("treats wildcard characters literally", () => {
    const query = new PgDialect().sqlToQuery(emailEquals(users.email, "%"));
    expect(query.sql).toContain("=");
    expect(query.params).toEqual(["%"]);
  });
});

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co");
  });
});
