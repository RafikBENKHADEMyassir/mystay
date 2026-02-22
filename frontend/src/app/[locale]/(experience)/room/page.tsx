"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Copy, Leaf, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

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
    return new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", year: "numeric" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function formatTime(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { hour: "2-digit", minute: "2-digit" }).format(value);
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
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center">
          <Image src={icon} alt={label} width={56} height={56} className="h-14 w-14 object-contain" unoptimized />
        </div>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted/40">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <span className="text-center text-xs font-medium leading-tight text-foreground">{label}</span>
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
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center">
          <Image src={icon} alt={label} width={56} height={56} className="h-14 w-14 object-contain" unoptimized />
        </div>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted/40">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <span className="text-center text-xs font-medium leading-tight text-foreground">{label}</span>
    </button>
  );
}

/* ─── Promo Service Card ─── */
function PromoCard({
  href,
  title,
  subtitle,
  cta,
  image
}: {
  href: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted/30">
        <Image src={image} alt={title} width={96} height={96} className="h-full w-full object-cover" unoptimized />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        <AppLink
          href={href}
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-muted/50 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {cta}
        </AppLink>
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoading, overview, authenticated } = useGuestOverview();
  const { content } = useGuestContent(locale, overview?.hotel.id ?? null);
  const page = content?.pages.room;

  const [copied, setCopied] = useState(false);
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [showUsefulInfo, setShowUsefulInfo] = useState(false);

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

            {/* Plaisirs sur mesure tag (Figma: on right, overlaying next slide peek) */}
            <a
              href="#plaisirs-sur-mesure"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center justify-center rounded-lg bg-black/60 px-3 py-4 text-xs font-medium leading-tight text-white backdrop-blur-md transition-opacity hover:bg-black/70 pointer-events-auto max-w-[72px] text-center"
            >
              <span className="block">{page.tailored.split(" ")[0]}</span>
              <span className="block">{page.tailored.split(" ").slice(1).join(" ")}</span>
              <ChevronRight className="mt-1 h-3 w-3 rotate-[-90deg]" strokeWidth={2} />
            </a>

            {/* Suite name & check-in CTA (Figma: lower-left text, white CTA with dark border) */}
            <div className="absolute bottom-6 left-0 right-0 z-10 px-5 pointer-events-auto">
              <div className="mb-3 flex items-center gap-2">
                {/* <Leaf className="h-5 w-5 text-white drop-shadow-md" strokeWidth={1.5} /> */}
                <p className="text-2xl font-semibold uppercase tracking-widest text-white drop-shadow-md">{suiteName}</p>
              </div>

              <AppLink
                href={withLocale(locale, "/reception/check-in")}
                className="flex w-[80%] max-w-[340px] mx-auto items-center justify-between rounded-sm border border-gray-300 bg-white px-4 py-3 shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="h-7 w-7 text-gray-700" />
                  <span className="text-sm font-semibold text-gray-900">{page.completeCheckIn}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600" strokeWidth={2} />
              </AppLink>
              {/* )} */}
            </div>
          </StackedCarousel>
        ) : (
          <div className="h-[320px] bg-muted" />
        )}
      </section>

      {/* ─── Room Info Grid ─── */}
      <div className="px-5 pt-6">
        <div className="grid grid-cols-2 gap-y-5">
          <div>
            <p className="text-xs text-muted-foreground">{page.labels.room}</p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">&#8470; {roomNumber}</p>
          </div>

          <div>
            <span className="text-lg font-semibold text-foreground">
              {adults}{" "}
              <span className="text-sm font-normal text-muted-foreground">{page.labels.adults}</span>
            </span>
            {children > 0 && (
              <span className="block text-lg font-semibold text-foreground">
                {children}{" "}
                <span className="text-sm font-normal text-muted-foreground">{page.labels.child}</span>
              </span>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{page.labels.checkIn}</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{formatDate(locale, checkInDate)}</p>
            <p className="text-sm text-muted-foreground">{formatTime(locale, checkInDate)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{page.labels.checkOut}</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{formatDate(locale, checkOutDate)}</p>
            <p className="text-sm text-muted-foreground">{formatTime(locale, checkOutDate)}</p>
          </div>
        </div>

        {/* ─── Quick Actions Grid ─── */}
        <div className="mt-8 grid grid-cols-2 gap-3">
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

        <div className="my-8 h-px w-full bg-border/50" />

        {/* ─── Promo / Service Cards ─── */}
        <div className="space-y-4">
          {page.promoCards.map((card) => (
            <PromoCard
              key={card.id}
              href={withLocale(locale, card.href)}
              title={card.title}
              subtitle={card.subtitle}
              cta={card.cta}
              image={resolveImage(card.image)}
            />
          ))}
        </div>

        <div className="my-8 h-px w-full bg-border/50" />

        {/* ─── Room Upgrade Banner ─── */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative h-44 w-full overflow-hidden">
            <Image src={resolveImage(page.upgrade.image)} alt={page.upgrade.title} fill className="object-cover" unoptimized />
          </div>
          <div className="p-4">
            <p className="text-base font-semibold text-foreground">{page.upgrade.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{page.upgrade.subtitle}</p>
            <AppLink
              href={withLocale(locale, page.upgrade.href)}
              className="mt-4 block w-full rounded-lg bg-black py-3 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {page.upgrade.cta}
            </AppLink>
          </div>
        </section>

        {/* ─── Upsells / Plaisirs sur mesure ─── */}
        <section id="plaisirs-sur-mesure" className="mt-8 scroll-mt-4">
          <p className="mb-4 text-lg font-semibold text-foreground">{page.upsellsTitle}</p>
          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
            {page.upsells.map((upsell) => (
              <AppLink
                href={withLocale(locale, upsell.href)}
                key={upsell.id}
                className="relative h-44 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-muted shadow-md transition-shadow hover:shadow-lg"
              >
                <Image src={resolveImage(upsell.image)} alt={upsell.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-3">
                  <p className="text-sm font-semibold uppercase tracking-wider text-white drop-shadow-md">
                    {upsell.title}
                  </p>
                </div>
              </AppLink>
            ))}
          </div>
        </section>

        {/* ─── Reservation Info & Links ─── */}
        <div className="mt-6 space-y-1">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {page.labels.reservation} {confirmationNumber}
              </span>
              <button onClick={handleCopyReservation}>
                <Copy className={cn("h-3.5 w-3.5", copied ? "text-green-600" : "text-muted-foreground")} />
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-border/50" />

          <AppLink
            href={withLocale(locale, "/profile")}
            className="flex items-center justify-between py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{page.labels.stayHistory}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </AppLink>

          <div className="h-px w-full bg-border/50" />

          <AppLink
            href={withLocale(locale, "/reception")}
            className="flex items-center justify-between py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{page.labels.lateCheckout}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </AppLink>

          <div className="h-px w-full bg-border/50" />

          <AppLink
            href={withLocale(locale, "/messages?department=reception")}
            className="flex items-center justify-between py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{page.labels.contactReception}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </AppLink>
        </div>
      </div>

      {/* ─── Useful Informations Bottom Sheet ─── */}
      {showUsefulInfo && overview?.hotel?.id && (
        <UsefulInfoBottomSheet
          hotelId={overview.hotel.id}
          onClose={() => setShowUsefulInfo(false)}
        />
      )}
    </div>
  );
}
