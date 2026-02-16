"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { formatDateShort } from "@/lib/utils/date";

type Props = {
  locale: Locale;
  content: Pick<GuestContent["pages"]["home"]["overview"], "greeting" | "roomImageAlt" | "roomNumberPrefix">;
  guestName: string;
  roomNumber: string;
  roomThumbnail: string;
  checkInDate: Date;
  checkOutDate: Date;
};

export function GuestInfoCard({
  locale,
  guestName,
  roomNumber,
  roomThumbnail,
  checkInDate,
  checkOutDate,
  content,
}: Props) {
  const checkIn = formatDateShort(locale, checkInDate);
  const checkOut = formatDateShort(locale, checkOutDate);

  return (
    <div className="px-4">
      <AppLink href={withLocale(locale, "/room")} className="mt-4 block">
        <section className="flex items-center gap-4 rounded-xl border border-border bg-card p-2 shadow-sm transition-colors hover:bg-muted/30">
          {/* Room Thumbnail */}
          <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg">
            {roomThumbnail ? (
              <Image src={roomThumbnail} alt={content.roomImageAlt} fill className="object-cover" unoptimized />
            ) : (
              <div className="h-full w-full bg-muted/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <p className="absolute bottom-2 left-2 text-sm font-medium text-white shadow-sm">
              {content.roomNumberPrefix} {roomNumber}
            </p>
          </div>

          {/* Guest Info */}
          <div className="min-w-0 flex-1 py-1">
            <p className="text-base font-semibold text-foreground">{content.greeting}</p>
            <p className="truncate text-base font-semibold text-foreground">{guestName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {checkIn} – {checkOut}
            </p>
          </div>

          <ChevronRight className="mr-2 h-5 w-5 flex-shrink-0 text-muted-foreground/60" />
        </section>
      </AppLink>
    </div>
  );
}
