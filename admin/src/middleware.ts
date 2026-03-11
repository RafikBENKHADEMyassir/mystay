import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { adminLocaleCookieName, defaultAdminLocale, getAdminLocaleFromPathname, isAdminLocale, stripAdminLocaleFromPathname, withAdminLocale } from "@/lib/admin-locale";

const staffTokenCookieName = "mystay_staff_token";
const oneYearInSeconds = 60 * 60 * 24 * 365;

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
  const localeFromPath = getAdminLocaleFromPathname(pathname);
  const normalizedPathname = localeFromPath ? stripAdminLocaleFromPathname(pathname) : pathname;
  const storedLocale = request.cookies.get(adminLocaleCookieName)?.value;
  const preferredLocale = isAdminLocale(storedLocale) ? storedLocale : defaultAdminLocale;

  if (!localeFromPath && preferredLocale !== defaultAdminLocale) {
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.pathname = withAdminLocale(pathname, preferredLocale);
    return NextResponse.redirect(localizedUrl);
  }

  function passThrough() {
    if (!localeFromPath) return NextResponse.next();

    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = normalizedPathname;
    return NextResponse.rewrite(rewrittenUrl);
  }

  function persistLocale(response: NextResponse) {
    if (!localeFromPath) return response;

    response.cookies.set(adminLocaleCookieName, localeFromPath, {
      path: "/",
      maxAge: oneYearInSeconds,
      sameSite: "lax",
    });
    return response;
  }

  const isRestricted = restrictedRoutes.some(
    (route) => normalizedPathname === route || normalizedPathname.startsWith(route + "/")
  );

  if (!isRestricted) {
    return persistLocale(passThrough());
  }

  const token = request.cookies.get(staffTokenCookieName)?.value;
  const payload = decodeTokenPayload(token);
  const isAdminOrManager = payload?.role === "admin" || payload?.role === "manager";

  if (isAdminOrManager) {
    const response = persistLocale(passThrough());
    if (payload.hotelId) {
      response.headers.set("x-hotel-id", payload.hotelId);
    }
    return response;
  }

  const deptRoute = Object.entries(departmentRoutes).find(
    ([route]) => normalizedPathname === route || normalizedPathname.startsWith(route + "/")
  );
  if (deptRoute) {
    const requiredDept = deptRoute[1];
    const departments = Array.isArray(payload?.departments) ? payload.departments : [];
    if (departments.includes(requiredDept)) {
      const response = persistLocale(passThrough());
      if (payload?.hotelId) {
        response.headers.set("x-hotel-id", payload.hotelId);
      }
      return response;
    }
  }

  const fallbackUrl = request.nextUrl.clone();
  fallbackUrl.pathname = localeFromPath ? `/${localeFromPath}` : "/";
  fallbackUrl.search = "";
  return NextResponse.redirect(fallbackUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
