"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { Info } from "lucide-react";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";

type Props = {
  locale: Locale;
  hotelName: string;
  coverImageUrl: string | null;
  hotelLogoUrl: string | null;
  roomKeyLabel: GuestContent["pages"]["home"]["overview"]["roomKey"];
};

export function HeroCard({ locale, hotelName, coverImageUrl, hotelLogoUrl, roomKeyLabel }: Props) {
  return (
    <section className="relative h-[480px] w-full overflow-hidden shadow-sm">
      <div
        className="absolute inset-0 bg-cover bg-bottom"
        style={{
          backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
      </div>

      {/* Hotel logo */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2">
        {hotelLogoUrl ? (
          <Image
            src={hotelLogoUrl}
            alt={hotelName}
            width={180}
            height={60}
            className="h-20 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
            unoptimized
          />
        ) : (
          <p className="text-center text-xl font-bold text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]">
            {hotelName}
          </p>
        )}
      </div>

      {/* Room Key Buttons */}
      <div className="absolute bottom-6 left-4 right-4 flex gap-2">
        <AppLink
          href={withLocale(locale, "/reception")}
          className="flex flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/70 px-4 py-3 text-base font-semibold text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-white/80"
        >
          {roomKeyLabel}
        </AppLink>
        <AppLink
          href={withLocale(locale, "/reception/info")}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-xl border border-white/20 bg-white/70 shadow-lg backdrop-blur-md transition-colors hover:bg-white/80"
        >
          <Info className="h-5 w-5 text-foreground" />
        </AppLink>
      </div>
    </section>
  );
}
