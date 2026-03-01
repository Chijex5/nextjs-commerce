import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canonicalHost } from "lib/seo";

const CANONICAL_HOST = canonicalHost();

export default withAuth(
  function proxy(req) {
    const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
    const isLoginPage = req.nextUrl.pathname === "/admin/login";
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-is-admin-route", isAdminPath ? "1" : "0");

    if (process.env.NODE_ENV !== "development" && CANONICAL_HOST) {
      const host = req.headers.get("host") || "";
      const forwardedProto =
        req.headers.get("x-forwarded-proto") ||
        req.nextUrl.protocol.replace(":", "");

      const shouldRedirectHost =
        !host.includes("localhost") && host !== CANONICAL_HOST;
      const shouldRedirectProtocol = forwardedProto !== "https";

      if (shouldRedirectHost || shouldRedirectProtocol) {
        const url = req.nextUrl.clone();
        url.protocol = "https";
        url.host = CANONICAL_HOST;
        return NextResponse.redirect(url, 308);
      }
    }

    const token = req.nextauth.token;

    // Allow access to login page
    if (isLoginPage) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // Protect admin routes
    if (isAdminPath && !token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
