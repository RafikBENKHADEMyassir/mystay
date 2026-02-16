import type { Locale } from "@/lib/i18n/locales";

function getLanguageTag(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
}

export function formatDateShort(locale: Locale, value: Date): string {
  const languageTag = getLanguageTag(locale);
  try {
    return new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

export function formatDayName(locale: Locale, value: Date): string {
  const languageTag = getLanguageTag(locale);
  try {
    return new Intl.DateTimeFormat(languageTag, { weekday: "long", day: "numeric", month: "short" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

export function formatTime(locale: Locale, value: Date): string {
  const languageTag = getLanguageTag(locale);
  try {
    return new Intl.DateTimeFormat(languageTag, { hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
  } catch {
    return value.toISOString().slice(11, 16);
  }
}

export function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function clampDay(value: Date, min: Date, max: Date): Date {
  const day = startOfDay(value);
  if (day.getTime() < min.getTime()) return startOfDay(min);
  if (day.getTime() > max.getTime()) return startOfDay(max);
  return day;
}

export function capitalizeFirstLetter(value: string, locale: Locale): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase(getLanguageTag(locale)) + value.slice(1);
}
