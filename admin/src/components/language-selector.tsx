"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
] as const;

const STORAGE_KEY = "mystay-admin-locale";

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setLocale(stored);
  }, []);

  function selectLanguage(code: string) {
    setLocale(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
    setOpen(false);
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
