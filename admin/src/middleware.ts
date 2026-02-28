import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const staffTokenCookieName = "mystay_staff_token";

const restrictedRoutes = [
  "/integrations",
  "/settings",
  "/settings/staff",
  "/request-templates",
  "/audience",
  "/automations",
  "/upsell-services",
  "/housekeeping"
];

type TokenPayload = {
  role?: string;
  hotelId?: string;
  typ?: string;
  departments?: string[];
};

function decodeTokenPayload(token: string | undefined): TokenPayload | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

const departmentRoutes: Record<string, string> = {
  "/housekeeping": "housekeeping",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isRestricted = restrictedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isRestricted) {
    return NextResponse.next();
  }

  const token = request.cookies.get(staffTokenCookieName)?.value;
  const payload = decodeTokenPayload(token);
  const isAdminOrManager = payload?.role === "admin" || payload?.role === "manager";

  if (isAdminOrManager) {
    const response = NextResponse.next();
    if (payload.hotelId) {
      response.headers.set("x-hotel-id", payload.hotelId);
    }
    return response;
  }

  const deptRoute = Object.entries(departmentRoutes).find(
    ([route]) => pathname === route || pathname.startsWith(route + "/")
  );
  if (deptRoute) {
    const requiredDept = deptRoute[1];
    const departments = Array.isArray(payload?.departments) ? payload.departments : [];
    if (departments.includes(requiredDept)) {
      const response = NextResponse.next();
      if (payload?.hotelId) {
        response.headers.set("x-hotel-id", payload.hotelId);
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/integrations/:path*",
    "/settings/:path*",
    "/request-templates/:path*",
    "/audience/:path*",
    "/automations/:path*",
    "/upsell-services/:path*",
    "/housekeeping/:path*"
  ]
};
