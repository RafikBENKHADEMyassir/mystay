export const supportedLocales = ["en", "fr", "es"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}
