import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, isLocale, type Locale } from "./lib/i18n/locales";

const publicFile = /\.(.*)$/;

// Routes that require authentication
const protectedPaths = ["/experience", "/messages", "/services", "/profile", "/agenda"];

// Routes that are only for non-authenticated users
const authPaths = ["/login", "/signup"];

function detectLocaleFromHeader(header: string | null): Locale | null {
  if (!header) return null;
  const parts = header.split(",").map((part) => part.trim().split(";")[0]?.trim());
  for (const part of parts) {
    if (!part) continue;
    const base = part.split("-")[0]?.trim();
    if (base && isLocale(base)) return base;
  }
  return null;
}

function stripLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase() ?? "";
  if (isLocale(first)) {
    return "/" + segments.slice(1).join("/") || "/";
  }
  return pathname;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and admin
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    publicFile.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const rawLocale = segments[0] ?? "";
  const maybeLocale = rawLocale.toLowerCase();

  // Handle locale case sensitivity
  if (rawLocale && maybeLocale && rawLocale !== maybeLocale && isLocale(maybeLocale)) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = `/${maybeLocale}/${segments.slice(1).join("/")}`.replace(/\/+$/, "") || `/${maybeLocale}`;
    return NextResponse.redirect(nextUrl);
  }

  // If valid locale, continue
  if (maybeLocale && isLocale(maybeLocale)) {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", maybeLocale, { path: "/" });

    // Check authentication for protected routes
    // Accept either: guest_session (client-set token) or session (httpOnly cookie set by login API)
    const pathWithoutLocale = stripLocale(pathname);
    const guestSessionCookie = request.cookies.get("guest_session")?.value;
    const serverSessionCookie = request.cookies.get("session")?.value;
    const isAuthenticated = !!(guestSessionCookie || serverSessionCookie);

    // For protected routes, redirect to login if not authenticated
    // But allow browsing hotels without authentication
    const isProtectedRoute = protectedPaths.some((p) => pathWithoutLocale.startsWith(p));
    if (isProtectedRoute && !isAuthenticated && pathWithoutLocale !== "/hotels") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${maybeLocale}/login`;
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages (login/signup)
    const isAuthPath = authPaths.some((p) => pathWithoutLocale.startsWith(p));
    if (isAuthPath && isAuthenticated) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = `/${maybeLocale}`;
      return NextResponse.redirect(homeUrl);
    }

    return response;
  }

  // Determine preferred locale
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value ?? "";
  const preferred =
    (isLocale(cookieLocale) ? cookieLocale : null) ??
    detectLocaleFromHeader(request.headers.get("accept-language")) ??
    defaultLocale;

  // Redirect to localized path
  const nextUrl = request.nextUrl.clone();
  const looksLikeLocale = Boolean(rawLocale && /^[a-zA-Z]{2}$/.test(rawLocale));
  const restPath = looksLikeLocale ? `/${segments.slice(1).join("/")}` : pathname;
  nextUrl.pathname = `/${preferred}${restPath === "/" ? "" : restPath}`;
  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
