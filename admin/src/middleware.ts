import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const staffTokenCookieName = "mystay_staff_token";

// Routes that require admin or manager role
const restrictedRoutes = ["/integrations", "/settings", "/settings/staff", "/request-templates"];

function decodeTokenRole(token: string | undefined): string | null {
  if (!token) return null;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // JWT uses base64url encoding - convert to standard base64
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is restricted
  const isRestricted = restrictedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isRestricted) {
    return NextResponse.next();
  }

  // Get the token and decode the role
  const token = request.cookies.get(staffTokenCookieName)?.value;
  const role = decodeTokenRole(token);

  // Only admin and manager can access restricted routes
  if (role !== "admin" && role !== "manager") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/integrations/:path*",
    "/settings/:path*",
    "/request-templates/:path*"
  ]
};
