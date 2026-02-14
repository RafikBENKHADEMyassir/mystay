import { useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";

import { defaultLocale, type Locale } from "./locales";
import { messages, type MessagesSchema } from "./messages";

type Primitive = string | number | boolean | null | undefined;
type TranslationVars = Record<string, Primitive>;

type DotPath<T extends object> = {
  [K in keyof T & string]: T[K] extends object ? `${K}.${DotPath<T[K]>}` : K;
}[keyof T & string];

export type TranslationKey = DotPath<MessagesSchema>;

const warnedMissingKeys = new Set<string>();

function resolveMessage(locale: Locale, key: TranslationKey): string | undefined {
  const parts = key.split(".");
  let cursor: unknown = messages[locale];

  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }

  return typeof cursor === "string" ? cursor : undefined;
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token: string) => {
    const value = vars[token];
    return value == null ? "" : String(value);
  });
}

export function translate(locale: Locale, key: TranslationKey, vars?: TranslationVars): string {
  const localized = resolveMessage(locale, key);
  if (localized) return interpolate(localized, vars);

  const fallback = resolveMessage(defaultLocale, key);
  if (fallback) return interpolate(fallback, vars);

  const warningKey = `${locale}:${key}`;
  if (process.env.NODE_ENV !== "production" && !warnedMissingKeys.has(warningKey)) {
    warnedMissingKeys.add(warningKey);
    console.warn(`Missing translation key "${key}" for locale "${locale}"`);
  }

  return key;
}

export function useTranslations() {
  const locale = useLocale();
  return useCallback((key: TranslationKey, vars?: TranslationVars) => translate(locale, key, vars), [locale]);
}
