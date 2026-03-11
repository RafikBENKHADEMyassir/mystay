"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

import { adminLocaleCookieName, defaultAdminLocale, isAdminLocale, withAdminLocale } from "@/lib/admin-locale";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
] as const;

const STORAGE_KEY = adminLocaleCookieName;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(defaultAdminLocale);

  useEffect(() => {
    const fromPath = pathname.split("/")[1] ?? "";
    const stored = localStorage.getItem(STORAGE_KEY);
    const nextLocale = isAdminLocale(fromPath)
      ? fromPath
      : isAdminLocale(stored)
        ? stored
        : defaultAdminLocale;

    setLocale(nextLocale);
    localStorage.setItem(STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    document.cookie = `${STORAGE_KEY}=${nextLocale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
  }, [pathname]);

  function selectLanguage(code: string) {
    if (!isAdminLocale(code)) return;

    const query = searchParams?.toString();
    const destination = withAdminLocale(pathname, code);
    const nextUrl = query ? `${destination}?${query}` : destination;

    setLocale(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
    document.cookie = `${STORAGE_KEY}=${code}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
    setOpen(false);
    router.replace(nextUrl);
  }

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="gap-1.5"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.label}</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border bg-popover shadow-md">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => selectLanguage(lang.code)}
                className={
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted " +
                  (lang.code === locale ? "bg-muted font-medium" : "")
                }
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
