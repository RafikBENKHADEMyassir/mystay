import type { Locale } from "../locales";
import en from "./en";
import es from "./es";
import fr from "./fr";

export const messages = {
  en,
  fr,
  es
} satisfies Record<Locale, typeof en>;

export type MessagesSchema = typeof en;
