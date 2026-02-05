"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Hotel, ImageIcon, Info, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

function formatDateShort(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function formatDayName(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { weekday: "long", day: "numeric", month: "short" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function formatTime(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
  } catch {
    return value.toISOString().slice(11, 16);
  }
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function clampDay(value: Date, min: Date, max: Date) {
  const day = startOfDay(value);
  if (day.getTime() < min.getTime()) return startOfDay(min);
  if (day.getTime() > max.getTime()) return startOfDay(max);
  return day;
}

function capitalizeFirstLetter(value: string, locale: Locale) {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase(locale === "fr" ? "fr-FR" : "en-US") + value.slice(1);
}

function FirstScreen({ locale }: { locale: Locale }) {
  const strings =
    locale === "fr"
      ? {
          title: "Bienvenue sur votre espace",
          subtitle:
            "Votre hôtel est directement joignable depuis votre espace.\nRéalisez votre check‑in, utilisez votre clé dématérialisée, faites appel au service de chambre, programmez des réservations et bien plus encore.",
          noAccount: "Vous n'avez pas encore de compte configuré ?",
          setup: "Je configure mon profil",
          login: "Connexion"
        }
      : {
          title: "Welcome to your space",
          subtitle:
            "Reach your hotel directly from your space.\nComplete your check‑in, use a digital key, request room service, book experiences, and more.",
          noAccount: "Don't have an account yet?",
          setup: "Set up my profile",
          login: "Sign in"
        };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-md flex-col justify-between px-5 pb-12 pt-16">
      <div className="space-y-6">
        <h1 className="text-[26px] font-semibold leading-tight text-foreground">{strings.title}</h1>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{strings.subtitle}</p>
      </div>

      <div className="space-y-4 pt-8">
        <p className="text-center text-sm font-semibold text-foreground">{strings.noAccount}</p>
        <Link
          href={withLocale(locale, "/signup")}
          className="block w-full rounded-full border border-border bg-background py-3.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted/30"
        >
          {strings.setup}
        </Link>
        <Link
          href={withLocale(locale, "/login")}
          className="block w-full rounded-full bg-foreground py-3.5 text-center text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
        >
          {strings.login}
        </Link>
      </div>
    </div>
  );
}

function NoReservationScreen({ locale }: { locale: Locale }) {
  const strings =
    locale === "fr"
      ? {
          title: "Pas de réservation active",
          description: "Liez une réservation pour accéder à tous les services de votre hôtel.",
          linkReservation: "Lier une réservation",
          explore: "Explorer les hôtels"
        }
      : {
          title: "No active reservation",
          description: "Link a reservation to access all hotel services.",
          linkReservation: "Link a reservation",
          explore: "Explore hotels"
        };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Hotel className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-3 text-2xl font-bold">{strings.title}</h1>
        <p className="mb-8 text-muted-foreground">{strings.description}</p>
        <div className="flex flex-col gap-3">
          <Link href={withLocale(locale, "/link-reservation")}>
            <span className="block w-full rounded-2xl bg-foreground py-3 text-center text-sm font-semibold text-background shadow-sm">
              {strings.linkReservation}
            </span>
          </Link>
          <Link href={withLocale(locale, "/hotels")}>
            <span className="block w-full rounded-2xl border border-border bg-background py-3 text-center text-sm font-semibold text-foreground shadow-sm">
              {strings.explore}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Quick action chip with arrow
function QuickActionChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-w-[132px] items-center justify-between gap-2 rounded-full border border-border bg-card px-3 py-2 text-[12px] font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/30"
    >
      <span className="truncate">{label}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </Link>
  );
}

export default function OverviewPage() {
  const locale = useLocale();
  const { isLoading, overview, authenticated, token } = useGuestOverview();

  const strings = useMemo(() => {
    if (locale === "fr") {
      return {
        roomKey: "Room Key",
        greeting: "Belle journée,",
        upgradeRoom: "Upgrade Room",
        roomService: "Room Service",
        housekeeping: "Housekeeping",
        viewAgenda: "Voir l'agenda",
        anotherTime: "Une autre fois",
        see: "Voir",
        spaRelax: "Une heure de relaxation au Spa",
        launchEvening: "Soirée de lancement",
        invites: "vous invite"
      };
    }

    return {
      roomKey: "Room Key",
      greeting: "Good day,",
      upgradeRoom: "Upgrade Room",
      roomService: "Room Service",
      housekeeping: "Housekeeping",
      viewAgenda: "View agenda",
      anotherTime: "Another time",
      see: "See",
      spaRelax: "Relaxing hour at the Spa",
      launchEvening: "Launch evening",
      invites: "invites you"
    };
  }, [locale]);

  type ExperienceItem = {
    id: string;
    label: string;
    imageUrl: string;
    linkUrl?: string | null;
  };

  type ExperienceSection = {
    id: string;
    slug: string;
    titleFr: string;
    titleEn: string;
    items: ExperienceItem[];
  };

  type RoomImage = {
    id: string;
    category: string;
    imageUrl: string;
    sortOrder: number;
    isActive: boolean;
    roomNumber: string | null;
  };

  type AgendaEvent = {
    id: string;
    type: string;
    title: string;
    startAt: string;
    endAt: string | null;
    status: string;
    metadata?: Record<string, unknown> | null;
  };

  const [experienceSections, setExperienceSections] = useState<ExperienceSection[]>([]);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [roomThumbnailUrl, setRoomThumbnailUrl] = useState<string | null>(null);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [agendaDay, setAgendaDay] = useState<Date | null>(null);

  // Fetch experience sections from backend (upselling carousels)
  useEffect(() => {
    async function loadExperiences() {
      if (!overview?.hotel?.id) return;
      
      try {
        setExperienceError(null);
        const res = await fetch(`/api/hotels/${encodeURIComponent(overview.hotel.id)}/experiences`, { cache: "no-store" });
        if (!res.ok) {
          setExperienceSections([]);
          setExperienceError(`fetch_failed_${res.status}`);
          return;
        }

        const data = (await res.json()) as { sections?: ExperienceSection[] };
        setExperienceSections(Array.isArray(data.sections) ? data.sections : []);
      } catch {
        setExperienceSections([]);
        setExperienceError("fetch_failed");
      }
    }
    
    void loadExperiences();
  }, [overview?.hotel?.id]);

  // Fetch first room image for the room preview card (from backend room images)
  useEffect(() => {
    async function loadRoomThumbnail() {
      if (!overview?.hotel?.id) return;
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
        const res = await fetch(`${apiBaseUrl}/api/v1/hotels/${overview.hotel.id}/room-images`);
        if (!res.ok) return;
        const data = (await res.json()) as { images?: RoomImage[] };
        const images = Array.isArray(data.images) ? data.images : [];
        const first = images
          .filter((img) => img.isActive)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
        if (first?.imageUrl) setRoomThumbnailUrl(first.imageUrl);
      } catch {
        // ignore
      }
    }

    void loadRoomThumbnail();
  }, [overview?.hotel?.id]);

  // Fetch agenda events for the stay (seeded in DB for demo)
  useEffect(() => {
    async function loadAgendaEvents() {
      if (!token) return;
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
        const url = new URL("/api/v1/events", apiBaseUrl);
        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: AgendaEvent[] };
        setAgendaEvents(Array.isArray(data.items) ? data.items : []);
      } catch {
        // ignore
      }
    }

    if (!overview?.stay?.id) return;
    void loadAgendaEvents();
  }, [overview?.stay?.id, token]);

  // Initialize agenda day (default to today, clamped to stay range)
  useEffect(() => {
    if (agendaDay) return;
    if (!overview?.stay?.checkIn || !overview?.stay?.checkOut) return;
    const stayStart = startOfDay(parseDateOrNull(overview.stay.checkIn) ?? new Date());
    const stayEnd = startOfDay(parseDateOrNull(overview.stay.checkOut) ?? new Date());
    setAgendaDay(clampDay(new Date(), stayStart, stayEnd));
  }, [agendaDay, overview?.stay?.checkIn, overview?.stay?.checkOut]);

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <FirstScreen locale={locale} />;
  }

  if (!overview) {
    return <NoReservationScreen locale={locale} />;
  }

  const roomNumber = overview.stay.roomNumber ?? "—";
  const checkInDate = parseDateOrNull(overview.stay.checkIn) ?? new Date();
  const checkOutDate = parseDateOrNull(overview.stay.checkOut) ?? new Date();
  const checkIn = formatDateShort(locale, checkInDate);
  const checkOut = formatDateShort(locale, checkOutDate);

  const hotelName = overview.hotel.name;
  const guestName = [overview.guest.firstName, overview.guest.lastName].filter(Boolean).join(" ") || "Guest";
  const coverImageUrl = overview.hotel.coverImageUrl;
  const hotelLogoUrl = overview.hotel.logoUrl;

  const stayStart = startOfDay(checkInDate);
  const stayEnd = startOfDay(checkOutDate);

  const roomThumbnail = roomThumbnailUrl ?? coverImageUrl ?? "";

  const selectedAgendaDay = agendaDay ?? stayStart;
  const dayName = capitalizeFirstLetter(formatDayName(locale, selectedAgendaDay), locale);

  const canGoPrevDay = selectedAgendaDay.getTime() > stayStart.getTime();
  const canGoNextDay = selectedAgendaDay.getTime() < stayEnd.getTime();

  const agendaDayEvents = agendaEvents
    .filter((event) => isSameDay(startOfDay(new Date(event.startAt)), selectedAgendaDay))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 2);

  const visibleExperienceSections = experienceSections.filter(
    (section) => Array.isArray(section.items) && section.items.length > 0
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-[calc(env(safe-area-inset-top)+8px)] lg:max-w-3xl">
      {/* Hero Card with Hotel Image */}
      <section className="overflow-hidden rounded-[20px] shadow-sm">
        <div className="relative h-[210px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

          {/* Hotel logo */}
          <div className="absolute left-1/2 top-4 -translate-x-1/2">
            {hotelLogoUrl ? (
              <Image
                src={hotelLogoUrl}
                alt={hotelName}
                width={140}
                height={40}
                className="h-10 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                unoptimized
              />
            ) : (
              <p className="text-center text-sm font-semibold text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]">
                {hotelName}
              </p>
            )}
          </div>

          {/* Room Key Button */}
          <div className="absolute bottom-3 left-3 right-3">
            <Link
              href={withLocale(locale, "/reception")}
              className="flex items-center justify-between rounded-full border border-white/30 bg-white/80 px-4 py-2.5 text-[13px] font-semibold text-foreground shadow-sm backdrop-blur"
            >
              <span>{strings.roomKey}</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/20 bg-white/40">
                <Info className="h-4 w-4 text-foreground/70" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Guest Info Card - Clickable to Room Detail */}
      <Link href={withLocale(locale, "/room")} className="mt-3 block">
        <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/30">
          {/* Room Thumbnail */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
            {roomThumbnail ? (
              <Image src={roomThumbnail} alt="Room" fill className="object-cover" unoptimized />
            ) : (
              <div className="h-full w-full bg-muted/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <p className="absolute bottom-1 left-1.5 text-[10px] font-semibold text-white">
              N° {roomNumber}
            </p>
          </div>

          {/* Guest Info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-foreground">{strings.greeting}</p>
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{guestName}</p>
            <p className="text-xs text-muted-foreground">
              {checkIn} – {checkOut}
            </p>
          </div>

          <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </section>
      </Link>

      {/* Quick Actions */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <QuickActionChip href={withLocale(locale, "/services")} label={strings.upgradeRoom} />
        <QuickActionChip href={withLocale(locale, "/room-service")} label={strings.roomService} />
        <QuickActionChip href={withLocale(locale, "/housekeeping")} label={strings.housekeeping} />
      </div>

      {/* Agenda Section with Timeline */}
      <section className="mt-5 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={cn(
                "rounded-full p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                !canGoPrevDay && "pointer-events-none opacity-40"
              )}
              onClick={() => {
                if (!canGoPrevDay) return;
                setAgendaDay((prev) => (prev ? clampDay(new Date(prev.getTime() - 86400000), stayStart, stayEnd) : stayStart));
              }}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold capitalize text-foreground">{dayName}</p>
            <button
              type="button"
              className={cn(
                "rounded-full p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                !canGoNextDay && "pointer-events-none opacity-40"
              )}
              onClick={() => {
                if (!canGoNextDay) return;
                setAgendaDay((prev) => (prev ? clampDay(new Date(prev.getTime() + 86400000), stayStart, stayEnd) : stayStart));
              }}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link
            href={withLocale(locale, "/agenda")}
            className="text-xs font-medium text-muted-foreground hover:underline"
          >
            {strings.viewAgenda}
          </Link>
        </div>

        {/* Timeline */}
        <div className="relative mt-3 pl-8">
          {/* Vertical Line */}
          <div className="absolute left-3 top-0 h-full w-px bg-border" />

          {agendaDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <div className="space-y-4">
              {agendaDayEvents.map((event) => {
                const start = new Date(event.startAt);
                const end = event.endAt ? new Date(event.endAt) : null;
                const isInvite = event.type === "invite" || event.metadata?.variant === "invite";

                const href = (() => {
                  const linkUrl = typeof event.metadata?.linkUrl === "string" ? event.metadata.linkUrl : null;
                  if (linkUrl) return withLocale(locale, linkUrl);
                  if (event.type === "spa") return withLocale(locale, "/spa-gym");
                  if (event.type === "restaurant") return withLocale(locale, "/restaurants");
                  if (event.type === "transfer") return withLocale(locale, "/concierge");
                  return withLocale(locale, "/agenda");
                })();

                return (
                  <div key={event.id} className="relative">
                    <div
                      className={cn(
                        "absolute -left-5 top-1 h-2 w-2 rounded-full border-2 bg-background",
                        isInvite ? "border-foreground bg-foreground" : "border-border"
                      )}
                    />

                    {isInvite ? (
                      <div className="flex gap-3">
                        <div className="w-10 text-[11px] leading-4 text-muted-foreground">
                          <p>{formatTime(locale, start)}</p>
                          {end ? <p className="mt-8">{formatTime(locale, end)}</p> : null}
                        </div>
                        <div className="flex-1 rounded-xl border border-border bg-background p-3">
                          <p className="text-[11px] text-muted-foreground">
                            {hotelName} {strings.invites}
                          </p>
                          <p className="mt-1 text-[13px] font-semibold text-foreground">{event.title}</p>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted/30"
                            >
                              {strings.anotherTime}
                            </button>
                            <Link
                              href={href}
                              className="rounded-full bg-foreground px-4 py-1.5 text-[12px] font-semibold text-background"
                            >
                              {strings.see}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 text-[11px] leading-4 text-muted-foreground">
                          <p>{formatTime(locale, start)}</p>
                          {end ? <p>{formatTime(locale, end)}</p> : null}
                        </div>
                        <Link
                          href={href}
                          className="flex flex-1 items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/30"
                        >
                          <span className="text-[12px] text-muted-foreground">{event.title}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Experience Sections from Backend */}
      {visibleExperienceSections.length === 0 ? (
        <p className="mt-6 px-0.5 text-xs text-muted-foreground">
          {experienceError
            ? locale === "fr"
              ? "Upsells indisponibles pour le moment."
              : "Upsells are temporarily unavailable."
            : locale === "fr"
              ? "Aucun upsell configuré."
              : "No upsells configured yet."}
        </p>
      ) : null}

      {visibleExperienceSections.map((section) => (
        <section key={section.id} className="mt-6">
          <p className="mb-3 px-0.5 text-[13px] font-semibold text-foreground">
            {locale === "fr" ? section.titleFr : section.titleEn}
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar snap-x snap-mandatory scroll-px-4">
            {section.items.map((item) => {
              const href = item.linkUrl ? withLocale(locale, item.linkUrl) : withLocale(locale, "/services");
              const isUpsellsCard = item.label.toLowerCase().includes("upsell");
              const imageUrl = item.imageUrl?.startsWith("/uploads/")
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}${item.imageUrl}`
                : item.imageUrl;

              return (
                <Link
                  key={item.id}
                  href={href}
                  className={cn(
                    "relative h-[104px] w-[calc((100%-0.5rem)/2)] flex-shrink-0 snap-start overflow-hidden rounded-[14px] bg-muted/40 shadow-sm",
                    isUpsellsCard && "bg-muted/70"
                  )}
                  style={{
                    backgroundImage: isUpsellsCard ? undefined : `url(${imageUrl})`,
                    backgroundSize: isUpsellsCard ? undefined : "cover",
                    backgroundPosition: isUpsellsCard ? undefined : "center"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {isUpsellsCard ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <ImageIcon className="h-5 w-5 text-white/80" />
                      </div>
                    </div>
                  ) : null}
                  <p className="line-clamp-2 absolute bottom-2 left-2 right-2 text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-white">
                    {item.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
