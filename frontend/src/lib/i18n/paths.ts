import { defaultLocale, isLocale, type Locale } from "./locales";

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return "/";

  const maybeLocale = segments[0];
  if (!maybeLocale || !isLocale(maybeLocale)) return pathname;

  const rest = segments.slice(1).join("/");
  return rest ? `/${rest}` : "/";
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  return maybeLocale && isLocale(maybeLocale) ? maybeLocale : defaultLocale;
}

export function withLocale(locale: Locale, pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

