import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-token";

/**
 * Optimistic gate: sends signed-out visitors to sign-in before rendering protected pages.
 * Real authorisation (signature, expiry, role) happens in the data access layer on every request.
 */
export function proxy(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/seller/:path*", "/logistics/:path*", "/admin/:path*", "/checkout"],
};
