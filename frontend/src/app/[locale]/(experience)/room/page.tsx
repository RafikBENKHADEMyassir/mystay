"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Copy, Leaf, Loader2, LogOut } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

import { CleaningBookingSheet } from "@/components/cleaning/cleaning-booking-sheet";
import { useLocale } from "@/components/providers/locale-provider";
import { UsefulInfoBottomSheet } from "@/components/useful-info/useful-info-bottom-sheet";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";
import { StackedCarousel } from "./stacked-carousel";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Resolve image src – prefix API base for /uploads/ paths */
function resolveImage(src: string): string {
  if (src.startsWith("/uploads/")) return `${API_BASE}${src}`;
  if (src.startsWith("http")) return src;
  return src; // /images/... served by Next.js directly
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", year: "numeric" }).format(value).normalize("NFC");
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function formatTime(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { hour: "2-digit", minute: "2-digit" }).format(value).normalize("NFC");
  } catch {
    return value.toISOString().slice(11, 16);
  }
}

/* ─── Quick Action Icon Card (link) ─── */
function QuickActionCard({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon?: string;
}) {
  return (
    <AppLink
      href={href}
      className="relative flex flex-col items-center justify-center gap-3 rounded-[6px] border border-black/[0.06] bg-white px-2 pb-6 pt-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
    >
      {icon ? (
        <div className="relative h-[60px] w-[60px] overflow-hidden bg-white">
          <Image src={icon} alt={label} fill className="object-contain" sizes="120px" unoptimized />
        </div>
      ) : (
        <div className="flex h-[60px] w-[60px] items-center justify-center bg-white">
          <ChevronRight className="h-5 w-5 text-black/40" />
        </div>
      )}
      <span className="text-center text-[16px] font-light leading-[1.15] text-black">{label}</span>
    </AppLink>
  );
}

/* ─── Quick Action Button Card (onClick) ─── */
function QuickActionButton({
  onClick,
  label,
  icon
}: {
  onClick: () => void;
  label: string;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid="useful-info-trigger"
      className="relative flex flex-col items-center justify-center gap-3 rounded-[6px] border border-black/[0.06] bg-white px-2 pb-6 pt-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
    >
      {icon ? (
        <div className="relative h-[60px] w-[60px] overflow-hidden bg-white">
          <Image src={icon} alt={label} fill className="object-contain" sizes="120px" unoptimized />
        </div>
      ) : (
        <div className="flex h-[60px] w-[60px] items-center justify-center bg-white">
          <ChevronRight className="h-5 w-5 text-black/40" />
        </div>
      )}
      <span className="text-center text-[16px] font-light leading-[1.15] text-black">{label}</span>
    </button>
  );
}

/* ─── Promo Service Card ─── */
function PromoCard({
  href,
  onClick,
  title,
  subtitle,
  cta,
  image,
  testId,
}: {
  href?: string;
  onClick?: () => void;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  testId?: string;
}) {
  const ctaContent = (
    <div className="flex overflow-hidden rounded-[6px] border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]" data-testid={testId}>
      <div className="relative w-[125px] flex-shrink-0 self-stretch">
        <Image src={image} alt={title} fill className="object-cover" unoptimized />
      </div>
      <div className="flex flex-1 flex-col gap-[18px] items-end p-4">
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] text-black">{title}</p>
          <p className="text-[15px] leading-[1.15] text-black/50">{subtitle}</p>
        </div>
        <span className="flex h-[40px] w-full items-center justify-center rounded-[8px] bg-white/65 text-[14px] font-medium text-black shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-[6px]">
          {cta}
        </span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {ctaContent}
      </button>
    );
  }

  return href ? <AppLink href={href}>{ctaContent}</AppLink> : ctaContent;
}

export default function RoomDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoading, overview, authenticated, token } = useGuestOverview();
  const { content } = useGuestContent(locale, overview?.hotel.id ?? null);
  const page = content?.pages.room;

  const [copied, setCopied] = useState(false);
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [showUsefulInfo, setShowUsefulInfo] = useState(false);
  const [showCleaning, setShowCleaning] = useState(false);

  /* Fallback images from CMS content */
  useEffect(() => {
    if (!page) return;
    if (page.fallbackHeroImages.length > 0) {
      setRoomImages(page.fallbackHeroImages.map(resolveImage));
    }
  }, [page]);

  /* Fetch room-specific images from API (overrides fallback) */
  useEffect(() => {
    async function loadRoomImages() {
      if (!overview?.hotel?.id) return;
      try {
        const url = new URL(`${API_BASE}/api/v1/hotels/${overview.hotel.id}/room-images`);
        if (overview.stay?.roomNumber) {
          url.searchParams.set("roomNumber", overview.stay.roomNumber);
        }

        const res = await fetch(url.toString());
        if (!res.ok) return;

        const data = (await res.json()) as { images: Array<{ imageUrl: string }> };
        if (data.images?.length > 0) {
          setRoomImages(data.images.map((img) => resolveImage(img.imageUrl)));
        }
      } catch {
        // Keep fallback images
      }
    }

    void loadRoomImages();
  }, [overview?.hotel?.id, overview?.stay?.roomNumber]);

  const carouselImages = useMemo(() => roomImages, [roomImages]);

  const handleCopyReservation = () => {
    if (!overview?.stay.confirmationNumber) return;
    navigator.clipboard.writeText(overview.stay.confirmationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated || !overview) {
    router.push(withLocale(locale, "/"));
    return null;
  }

  if (!page) {
    return <div className="min-h-screen bg-background" />;
  }

  const roomNumber = overview.stay.roomNumber ?? "—";
  const adults = overview.stay.guests?.adults ?? 1;
  const children = overview.stay.guests?.children ?? 0;
  const checkInDate = parseDateOrNull(overview.stay.checkIn) ?? new Date();
  const checkOutDate = parseDateOrNull(overview.stay.checkOut) ?? new Date();
  const confirmationNumber = overview.stay.confirmationNumber;
  const checkInComplete = Boolean(overview.guest.idDocumentVerified) && Boolean(overview.guest.hasPaymentMethod);

  const suiteName = interpolateTemplate(page.suiteNameTemplate, { roomNumber });

  return (
    <div className="relative mx-auto max-w-md pb-24 lg:max-w-3xl">
      {/* ─── Hero Carousel ─── */}
      <section className="relative w-full overflow-hidden">
        {carouselImages.length > 0 ? (
          <StackedCarousel images={carouselImages} alt={suiteName} className="h-[480px]" showArrows={false} showDots={false}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none z-[1]" />

            {/* Back button with white-to-transparent gradient */}
            <div className="absolute left-0 top-0 z-20 w-full pt-[calc(env(safe-area-inset-top)+4px)] pointer-events-none">
              <div className="bg-gradient-to-b from-white/80 via-white/40 to-transparent px-4 pb-6 pt-3 pointer-events-auto">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-base font-semibold text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>{page.title}</span>
                </button>
              </div>
            </div>

            {/* Plaisirs sur mesure tag */}
            <a
              href="#plaisirs-sur-mesure"
              className="absolute right-0 top-[86px] z-10 flex items-center rounded-l-[6px] bg-black/50 py-3 pl-3 pr-4 backdrop-blur-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] pointer-events-auto"
            >
              <span className="text-[15px] font-light leading-tight text-white whitespace-pre-line">{page.tailored.split(" ")[0]}{"\n"}{page.tailored.split(" ").slice(1).join(" ")}</span>
            </a>

            {/* Suite name & check-in/check-out CTA */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-4 items-start justify-end p-6 pointer-events-auto">
              <p className="text-[32px] font-light uppercase leading-none text-white">{suiteName}</p>

              {checkInComplete ? (
                <AppLink
                  href={withLocale(locale, "/reception/check-out")}
                  className="inline-flex items-center gap-2.5 rounded-[6px] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <LogOut className="h-6 w-6 text-black/70" />
                  <span className="text-sm text-black">{page.startCheckOut}</span>
                  <ChevronRight className="h-[10px] w-[13px] text-black/50" strokeWidth={2} />
                </AppLink>
              ) : (
                <AppLink
                  href={withLocale(locale, "/reception/check-in")}
                  className="inline-flex items-center gap-2.5 rounded-[6px] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Loader2 className="h-6 w-6 text-black/70" />
                  <span className="text-sm text-black">{page.completeCheckIn}</span>
                  <ChevronRight className="h-[10px] w-[13px] text-black/50" strokeWidth={2} />
                </AppLink>
              )}
            </div>
          </StackedCarousel>
        ) : (
          <div className="h-[320px] bg-muted" />
        )}
      </section>

      {/* ─── Room Info Grid ─── */}
      <div className="px-6 py-6">
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-2 pb-0.5">
            <p className="text-[13px] leading-[1.15] text-black/50">{page.labels.room}</p>
            <p className="text-[18px] leading-[1.25] text-black" style={{ fontFeatureSettings: "'ordn'" }}>No. {roomNumber}</p>
          </div>

          <div className="flex flex-1 flex-col gap-1 pb-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] leading-none text-black">{adults}</span>
              <span className="text-[15px] leading-[1.15] text-black/50">{page.labels.adults}</span>
            </div>
            {children > 0 && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] leading-none text-black">{children}</span>
                <span className="text-[15px] leading-[1.15] text-black/50">{page.labels.child}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <div className="flex flex-1 flex-col gap-1 pb-0.5">
            <p className="text-[15px] leading-[1.15] text-black/50">{page.labels.checkIn}</p>
            <p className="text-[18px] leading-[1.25] text-black">{formatDate(locale, checkInDate)}</p>
            <p className="text-[18px] leading-[1.25] text-black">{formatTime(locale, checkInDate)}</p>
          </div>

          <div className="flex flex-1 flex-col gap-1 pb-0.5">
            <p className="text-[15px] leading-[1.15] text-black/50">{page.labels.checkOut}</p>
            <p className="text-[18px] leading-[1.25] text-black">{formatDate(locale, checkOutDate)}</p>
            <p className="text-[18px] leading-[1.25] text-black">{formatTime(locale, checkOutDate)}</p>
          </div>
        </div>

        {/* ─── Quick Actions Grid ─── */}
        <div className="mt-6 grid grid-cols-2 gap-2 px-4">
          {page.quickActions.map((action) =>
            action.id === "hotel-info" ? (
              <QuickActionButton
                key={action.id}
                onClick={() => setShowUsefulInfo(true)}
                label={action.label}
                icon={action.icon ? resolveImage(action.icon) : undefined}
              />
            ) : (
              <QuickActionCard
                key={action.id}
                href={withLocale(locale, action.href)}
                label={action.label}
                icon={action.icon ? resolveImage(action.icon) : undefined}
              />
            )
          )}
        </div>

        <div className="flex items-center justify-center px-12 py-8">
          <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* ─── Promo / Service Cards ─── */}
        <div className="flex flex-col gap-4">
          {page.promoCards.map((card) =>
            card.id === "housekeeping" ? (
              <PromoCard
                key={card.id}
                onClick={() => setShowCleaning(true)}
                title={card.title}
                subtitle={card.subtitle}
                cta={card.cta}
                image={resolveImage(card.image)}
                testId="cleaning-trigger"
              />
            ) : (
              <PromoCard
                key={card.id}
                href={withLocale(locale, card.href)}
                title={card.title}
                subtitle={card.subtitle}
                cta={card.cta}
                image={resolveImage(card.image)}
              />
            )
          )}
        </div>

        <div className="flex items-center justify-center px-12 py-8">
          <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* ─── Room Upgrade Banner ─── */}
        <section className="mx-4 overflow-hidden rounded-[6px] border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="relative h-[130px] w-full overflow-hidden">
            <Image src={resolveImage(page.upgrade.image)} alt={page.upgrade.title} fill className="object-cover" unoptimized />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-[16px] text-black/75">{page.upgrade.title}</p>
            <p className="text-[15px] leading-[1.15] text-black/50">{page.upgrade.subtitle}</p>
            <AppLink
              href={withLocale(locale, page.upgrade.href)}
              className="flex h-[40px] w-full items-center justify-center rounded-[6px] bg-black text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {page.upgrade.cta}
            </AppLink>
          </div>
        </section>

        {/* ─── Upsells / Plaisirs sur mesure ─── */}
        <section id="plaisirs-sur-mesure" className="scroll-mt-4">
          <div className="pb-4 pt-[42px] px-4">
            <p className="text-[22px] font-medium leading-[1.15] text-black">{page.upsellsTitle}</p>
          </div>
          <div className="flex gap-1 overflow-x-auto px-4 pb-4 no-scrollbar">
            {page.upsells.map((upsell) => (
              <AppLink
                href={withLocale(locale, upsell.href)}
                key={upsell.id}
                className="relative h-[215px] w-[170px] flex-shrink-0 overflow-hidden rounded-[6px]"
              >
                <Image src={resolveImage(upsell.image)} alt={upsell.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-x-0 bottom-0 top-[32%]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.098) 20%, rgba(0,0,0,0.325) 50%, rgba(0,0,0,0.584) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 px-3 py-4">
                  <p className="text-[23px] font-normal uppercase leading-[1.25] text-white">
                    {upsell.title}
                  </p>
                </div>
              </AppLink>
            ))}
          </div>
        </section>

        {/* ─── Reservation Info & Links ─── */}
        <div className="space-y-0">
          <div className="flex items-center justify-center gap-1 pb-4">
            <span className="text-[15px] leading-[1.15] text-black/50">
              {page.labels.reservation} {confirmationNumber}
            </span>
            <button onClick={handleCopyReservation} className="flex items-center">
              <Copy className={cn("h-5 w-5", copied ? "text-green-600" : "text-black/50")} />
            </button>
          </div>

          <div className="rounded-[8px]">
            <div className="flex items-center justify-between p-4">
              <AppLink
                href={withLocale(locale, "/profile")}
                className="flex flex-1 items-center justify-between"
              >
                <span className="text-[15px] font-medium leading-[1.15] text-black">{page.labels.stayHistory}</span>
                <ChevronRight className="h-[10px] w-[17px] text-black/50" strokeWidth={2} />
              </AppLink>
            </div>
          </div>

          <div className="rounded-[8px]">
            <div className="flex items-center justify-between p-4">
              <AppLink
                href={withLocale(locale, "/reception")}
                className="flex flex-1 items-center justify-between"
              >
                <span className="text-[15px] font-medium leading-[1.15] text-black">{page.labels.lateCheckout}</span>
                <ChevronRight className="h-[10px] w-[17px] text-black/50" strokeWidth={2} />
              </AppLink>
            </div>
          </div>

          <div className="rounded-[8px]">
            <div className="flex items-center justify-between p-4">
              <AppLink
                href={withLocale(locale, "/messages?department=reception")}
                className="flex flex-1 items-center justify-between"
              >
                <span className="text-[15px] font-medium leading-[1.15] text-black">{page.labels.contactReception}</span>
                <ChevronRight className="h-[10px] w-[17px] text-black/50" strokeWidth={2} />
              </AppLink>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Useful Informations Bottom Sheet ─── */}
      {showUsefulInfo && overview?.hotel?.id && (
        <UsefulInfoBottomSheet
          hotelId={overview.hotel.id}
          onClose={() => setShowUsefulInfo(false)}
        />
      )}

      {/* ─── Cleaning Booking Bottom Sheet ─── */}
      {showCleaning && overview?.hotel?.id && token && (
        <CleaningBookingSheet
          hotelId={overview.hotel.id}
          stayId={overview.stay?.id}
          guestName={`${overview.guest?.firstName ?? ""} ${overview.guest?.lastName ?? ""}`.trim() || "Guest"}
          guestToken={token}
          onClose={() => setShowCleaning(false)}
        />
      )}
    </div>
  );
}
