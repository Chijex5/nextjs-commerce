/** Fixed rows seeded before the integration suite runs. */
export const PASSWORD = "Fixture-pass-123";

export const SUPER_ADMIN_ID = "11111111-1111-4111-8111-111111111111";
export const PLAIN_ADMIN_ID = "22222222-2222-4222-8222-222222222222";

export const VICTIM_EMAIL = "victim@example.com";
export const VICTIM_ORDER = {
  id: "aaaaaaaa-0000-4000-8000-000000000001",
  number: "ORD-100001",
  email: "Victim@Example.com", // stored with mixed case on purpose
};
export const OTHER_ORDER = {
  id: "aaaaaaaa-0000-4000-8000-000000000002",
  number: "ORD-100002",
  email: "other@example.com",
};
export const VICTIM_REQUEST_NUMBER = "COR-000001";

export const baseUrl = () => {
  const url = process.env.TEST_BASE_URL;
  if (!url) throw new Error("TEST_BASE_URL is not set");
  return url.replace(/\/$/, "");
};
