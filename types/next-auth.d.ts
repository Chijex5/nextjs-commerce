import NextAuth, { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /**
       * User role - used for admin authentication.
       * Optional for regular user authentication (customer accounts).
       */
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    /**
     * User role - used for admin authentication.
     * Optional for regular user authentication (customer accounts).
     */
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    /**
     * User role - used for admin authentication.
     * Optional for regular user authentication (customer accounts).
     */
    role?: string;
  }
}
