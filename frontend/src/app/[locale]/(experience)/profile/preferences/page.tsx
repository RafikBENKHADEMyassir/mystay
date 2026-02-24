"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { supportedLocales, type Locale, isLocale } from "@/lib/i18n/locales";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n/paths";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function PreferencesPage() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(
    null
  );
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.profile;

  const [langSheetOpen, setLangSheetOpen] = useState(false);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  function switchLocale(nextLocale: Locale) {
    const basePath = stripLocaleFromPathname(pathname);
    const nextPath = withLocale(nextLocale, basePath);
    const query = searchParams?.toString() ?? "";
    router.push(query ? `${nextPath}?${query}` : nextPath);
    setLangSheetOpen(false);
  }

  if (!page) {
    return <div className="min-h-screen bg-white" />;
  }

  const menuItems = [
    {
      label: page.preferences.menuItems.personalInfo,
      onClick: () => router.back(),
    },
    {
      label: page.preferences.menuItems.interfaceSettings,
      onClick: () => setLangSheetOpen(true),
    },
    {
      label: page.preferences.menuItems.communications,
      onClick: () => {},
    },
    {
      label: page.preferences.menuItems.paymentMethods,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Topbar */}
      <div className="pointer-events-none sticky top-0 z-20">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-2.5 pr-4"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0.75) 25%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0) 100%)",
            backgroundSize: "100% 90px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <div />
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-12">
        <h1 className="text-[24px] font-light leading-[1.15] tracking-[-0.24px] text-black/75">
          {page.preferences.title}
        </h1>
      </div>

      {/* Menu Items */}
      <div className="pt-8">
        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="flex w-full items-center justify-between px-4 py-4"
          >
            <span className="text-[15px] font-medium leading-[1.15] text-black">
              {item.label}
            </span>
            <ChevronRight className="h-4 w-4 text-black/30" />
          </button>
        ))}
      </div>

      {/* Language Sheet */}
      <Sheet open={langSheetOpen} onOpenChange={setLangSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[50vh] rounded-t-[20px] border-0 bg-white px-0 pb-6 pt-3"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/20" />
          <SheetHeader className="px-5 text-left">
            <SheetTitle className="text-[20px] leading-none text-black">
              {page.preferences.languageLabel}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1 px-5">
            {supportedLocales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => switchLocale(loc)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-[15px] ${
                  loc === locale
                    ? "bg-black/[0.04] font-medium text-black"
                    : "text-black/70"
                }`}
              >
                {page.preferences.localeNames[loc]}
                {loc === locale && (
                  <span className="text-[13px] text-black/40">✓</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
