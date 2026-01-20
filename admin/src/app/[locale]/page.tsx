import { notFound, redirect } from "next/navigation";

const supportedLocales = ["en", "fr", "es"] as const;

type Locale = (typeof supportedLocales)[number];

function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export default function AdminLocaleRootPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  redirect("/");
}

