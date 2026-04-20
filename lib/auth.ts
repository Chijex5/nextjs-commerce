import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { adminUsers } from "./db/schema";

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
      async authorize(credentials) {
        console.log("[admin-auth][authorize] start", {
          email: credentials?.email,
          hasSecret: Boolean(authSecret),
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("[admin-auth][authorize] missing credentials");
          throw new Error("Email and password required");
        }

        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, credentials.email))
          .limit(1);

        if (!user || !user.isActive) {
          console.log("[admin-auth][authorize] invalid user", {
            email: credentials.email,
            found: Boolean(user),
            active: Boolean(user?.isActive),
          });
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          console.log("[admin-auth][authorize] password mismatch", {
            email: credentials.email,
            userId: user.id,
          });
          throw new Error("Invalid credentials");
        }

        await db
          .update(adminUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsers.id, user.id));

        console.log("[admin-auth][authorize] success", {
          userId: user.id,
          email: user.email,
          role: user.role,
        });

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
      console.log("[admin-auth][jwt] before", {
        hasUser: Boolean(user),
        tokenId: token.id,
        tokenRole: token.role,
      });

      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      console.log("[admin-auth][jwt] after", {
        tokenId: token.id,
        tokenRole: token.role,
      });

      return token;
    },
    async session({ session, token }) {
      console.log("[admin-auth][session] before", {
        hasSessionUser: Boolean(session.user),
        sessionEmail: session.user?.email,
        tokenId: token.id,
        tokenRole: token.role,
      });

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      console.log("[admin-auth][session] after", {
        sessionEmail: session.user?.email,
        sessionId: session.user?.id,
        sessionRole: session.user?.role,
      });

      return session;
    },
  },
  secret: authSecret,
};
