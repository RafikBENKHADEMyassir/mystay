const supportedAdminLocales = ["en", "fr", "es"] as const;

export type AdminLocale = (typeof supportedAdminLocales)[number];

export const adminLocaleCookieName = "mystay-admin-locale";
export const defaultAdminLocale: AdminLocale = "en";
export const adminLocales = supportedAdminLocales;

export function isAdminLocale(value: string | null | undefined): value is AdminLocale {
  if (!value) return false;
  return adminLocales.includes(value as AdminLocale);
}

export function resolveAdminLocale(value: string | null | undefined): AdminLocale {
  return isAdminLocale(value) ? value : defaultAdminLocale;
}

export function getAdminLocaleFromPathname(pathname: string): AdminLocale | null {
  const firstSegment = pathname.split("/")[1] ?? "";
  return isAdminLocale(firstSegment) ? firstSegment : null;
}

export function stripAdminLocaleFromPathname(pathname: string): string {
  const locale = getAdminLocaleFromPathname(pathname);
  if (!locale) return pathname;

  const withoutLocale = pathname.slice(`/${locale}`.length);
  return withoutLocale.startsWith("/") ? withoutLocale || "/" : `/${withoutLocale}`;
}

export function withAdminLocale(pathname: string, locale: AdminLocale): string {
  const basePath = stripAdminLocaleFromPathname(pathname);
  if (basePath === "/") return `/${locale}`;
  return `/${locale}${basePath}`;
}
