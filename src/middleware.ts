import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/verify-otp"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Tokens are in-memory (not cookies), so route protection is enforced
  // client-side via AuthContext. Middleware only handles the base redirect.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
