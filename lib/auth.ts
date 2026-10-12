import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { isMockData } from "./data/source";
import { emailEquals } from "./db/email-match";
import { adminUsers } from "./db/schema";
import { rateLimit } from "./rate-limit";
import { normalizeEmail } from "./user-utils";

export const authSecret =
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const email = normalizeEmail(credentials.email);
        const forwarded = req?.headers?.["x-forwarded-for"];
        const ip =
          (Array.isArray(forwarded) ? forwarded[0] : forwarded)
            ?.split(",")[0]
            ?.trim() || "unknown";
        const ipLimit = rateLimit(`admin-login:ip:${ip}`, 20, 15 * 60_000);
        const emailLimit = rateLimit(
          `admin-login:email:${email}`,
          5,
          15 * 60_000,
        );
        if (!ipLimit.ok || !emailLimit.ok) {
          throw new Error("Too many attempts. Please wait and try again.");
        }

        const [user] = await db
          .select()
          .from(adminUsers)
          .where(emailEquals(adminUsers.email, email))
          .limit(1);

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Your account is inactive. Please contact support.");
        }

        await db
          .update(adminUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsers.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        return token;
      }

      // Re-read the admin on every session check so a deactivated, deleted
      // or demoted admin loses access straight away instead of keeping the
      // role baked into their token for up to 30 days. Throwing here makes
      // NextAuth treat the session as signed out. (Middleware only decodes
      // the token; route handlers and pages go through this callback.)
      if (!isMockData && typeof token.id === "string") {
        const [admin] = await db
          .select({ role: adminUsers.role, isActive: adminUsers.isActive })
          .from(adminUsers)
          .where(eq(adminUsers.id, token.id))
          .limit(1);
        if (!admin || !admin.isActive) {
          throw new Error("Admin account is no longer active");
        }
        token.role = admin.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },
  secret: authSecret,
};
