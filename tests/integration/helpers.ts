import { encode } from "next-auth/jwt";
import { baseUrl } from "../setup/fixtures";

let ipCounter = 0;
/** A fresh client IP per call so per-IP rate limits don't leak across tests. */
export const freshIp = () =>
  `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

export async function api(
  path: string,
  init: RequestInit & { json?: unknown; cookie?: string; ip?: string } = {},
) {
  const { json, cookie, ip, headers, ...rest } = init;
  return fetch(`${baseUrl()}${path}`, {
    redirect: "manual",
    ...rest,
    headers: {
      "x-forwarded-for": ip ?? freshIp(),
      // As Vercel sends it; production redirects plain-http requests.
      "x-forwarded-proto": "https",
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(headers as Record<string, string>),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
}

/** First cookie pair from a response, e.g. "user-session=…". */
export const cookieFrom = (res: Response) =>
  (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";

/** An admin session cookie, as NextAuth would issue it after login. */
export async function adminCookie(id: string, role: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET must match the app's");
  const token = await encode({ token: { id, role }, secret });
  return `next-auth.session-token=${token}`;
}
