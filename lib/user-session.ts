import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required");
}

const JWT_SECRET_KEY = JWT_SECRET as string;

export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
}

interface TokenPayload {
  user: UserSession;
  iat: number;
  exp: number;
}

// Create session token
export async function createUserSession(user: UserSession): Promise<string> {
  const payload: TokenPayload = {
    user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", JWT_SECRET_KEY)
    .update(base64Payload)
    .digest("base64url");

  return `${base64Payload}.${signature}`;
}

// Verify session token
export async function verifyUserSession(
  token: string,
): Promise<UserSession | null> {
  try {
    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET_KEY)
      .update(base64Payload)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(base64Payload, "base64url").toString(),
    );

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload.user;
  } catch (error) {
    return null;
  }
}

// Get current user session
export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("user-session")?.value;

  if (!token) {
    return null;
  }

  return verifyUserSession(token);
}

// Set session cookie
export async function setUserSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("user-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Clear session cookie
export async function clearUserSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("user-session");
}

// Check if user is authenticated
export async function requireUserAuth(): Promise<UserSession> {
  const session = await getUserSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
