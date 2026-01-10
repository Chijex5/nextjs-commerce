import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
    const isLoginPage = req.nextUrl.pathname === "/admin/login";

    // Allow access to login page
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Protect admin routes
    if (isAdminPath && !token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
        const isLoginPage = req.nextUrl.pathname === "/admin/login";

        if (isLoginPage) return true;
        if (isAdminPath) return !!token;
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*"],
};
