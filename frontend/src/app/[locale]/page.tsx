"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import {
  FirstScreen,
  NoReservationScreen,
  HeroCard,
  GuestInfoCard,
  QuickActions,
  AgendaSection,
  ExperienceCarousel,
} from "@/components/overview";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { useExperienceSections } from "@/lib/hooks/use-experience-sections";
import { useRoomThumbnail } from "@/lib/hooks/use-room-thumbnail";
import { useAgendaEvents } from "@/lib/hooks/use-agenda-events";
import { parseDateOrNull, startOfDay, clampDay } from "@/lib/utils/date";

import ExperienceLayout from "./(experience)/layout";

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}${url}`;
  }
  return url;
}

export default function OverviewPage() {
  const locale = useLocale();
  const { isLoading, overview, authenticated, token } = useGuestOverview();
  const { content } = useGuestContent(locale, overview?.hotel?.id);
  const homePage = content?.pages.home;

  // Data fetching hooks
  const { sections: experienceSections, error: experienceError } = useExperienceSections(overview?.hotel?.id);
  const roomThumbnailUrl = useRoomThumbnail(overview?.hotel?.id, overview?.stay?.roomNumber);
  const { events: agendaEvents } = useAgendaEvents(overview?.stay?.id, token);

  // Agenda day state
  const [agendaDay, setAgendaDay] = useState<Date | null>(null);

  // Initialize agenda day (default to today, clamped to stay range)
  useEffect(() => {
    if (agendaDay) return;
    if (!overview?.stay?.checkIn || !overview?.stay?.checkOut) return;
    const stayStart = startOfDay(parseDateOrNull(overview.stay.checkIn) ?? new Date());
    const stayEnd = startOfDay(parseDateOrNull(overview.stay.checkOut) ?? new Date());
    setAgendaDay(clampDay(new Date(), stayStart, stayEnd));
  }, [agendaDay, overview?.stay?.checkIn, overview?.stay?.checkOut]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!homePage) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return <FirstScreen locale={locale} content={homePage.firstScreen} />;
  }

  // No reservation
  if (!overview) {
    return <NoReservationScreen locale={locale} content={homePage.noReservation} />;
  }

  // Derived data
  const roomNumber = overview.stay.roomNumber ?? "—";
  const checkInDate = parseDateOrNull(overview.stay.checkIn) ?? new Date();
  const checkOutDate = parseDateOrNull(overview.stay.checkOut) ?? new Date();
  const hotelName = overview.hotel.name;
  const guestName =
    [overview.guest.firstName, overview.guest.lastName].filter(Boolean).join(" ") ||
    homePage.overview.guestFallback;

  const coverImageUrl = resolveImageUrl(overview.hotel.coverImageUrl);
  const hotelLogoUrl = resolveImageUrl(overview.hotel.logoUrl);

  const stayStart = startOfDay(checkInDate);
  const stayEnd = startOfDay(checkOutDate);
  const roomThumbnail = roomThumbnailUrl ?? coverImageUrl ?? "";
  const selectedAgendaDay = agendaDay ?? stayStart;

  return (
    <ExperienceLayout>
      <div className="mx-auto max-w-md pb-24 lg:max-w-3xl">
        <HeroCard
          locale={locale}
          hotelName={hotelName}
          coverImageUrl={coverImageUrl}
          hotelLogoUrl={hotelLogoUrl}
          roomKeyLabel={homePage.overview.roomKey}
        />

        <GuestInfoCard
          locale={locale}
          content={homePage.overview}
          guestName={guestName}
          roomNumber={roomNumber}
          roomThumbnail={roomThumbnail}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
        />

        <QuickActions locale={locale} content={homePage.overview.quickActions} />

        <AgendaSection
          locale={locale}
          content={homePage.overview}
          hotelName={hotelName}
          events={agendaEvents}
          selectedDay={selectedAgendaDay}
          stayStart={stayStart}
          stayEnd={stayEnd}
          onDayChange={setAgendaDay}
        />

        <ExperienceCarousel
          locale={locale}
          content={homePage.overview}
          sections={experienceSections}
          error={experienceError}
        />
      </div>
    </ExperienceLayout>
  );
}
