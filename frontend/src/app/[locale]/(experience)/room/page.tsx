"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { StackedCarousel } from "./stacked-carousel";
import { useLocale } from "@/components/providers/locale-provider";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

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
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted/30">
          <Image src={image} alt={title} width={80} height={80} className="h-full w-full object-cover" unoptimized />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <AppLink
        href={href}
        className="mt-3 flex w-full items-center justify-center rounded-lg bg-muted/50 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {cta}
      </AppLink>
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

  useEffect(() => {
    if (!page) return;
    setRoomImages(page.fallbackHeroImages.slice(0, 6));
  }, [page]);

  useEffect(() => {
    async function loadRoomImages() {
      if (!overview?.hotel?.id) return;
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
        const url = new URL(`${apiBaseUrl}/api/v1/hotels/${overview.hotel.id}/room-images`);
        if (overview.stay?.roomNumber) {
          url.searchParams.set("roomNumber", overview.stay.roomNumber);
        }

        const res = await fetch(url.toString());
        if (!res.ok) return;

        const data = (await res.json()) as { images: Array<{ imageUrl: string }> };
        if (data.images?.length > 0) {
          const images = data.images.map((img) => {
            if (img.imageUrl.startsWith("/")) {
              return `${apiBaseUrl}${img.imageUrl}`;
            }
            return img.imageUrl;
          });
          setRoomImages(images.slice(0, 6));
        }
      } catch {
        // Keep fallback images
      }
    }

    void loadRoomImages();
  }, [overview?.hotel?.id, overview?.stay?.roomNumber]);

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
  const carouselImages = roomImages.length > 0 ? roomImages : page.fallbackHeroImages;

  return (
    <div className="relative mx-auto max-w-md pb-24 lg:max-w-3xl">
      <div className="pointer-events-none absolute left-0 top-0 z-[100] w-full p-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button
          onClick={() => router.back()}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/30"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{page.title}</span>
        </button>
      </div>

      <section className="relative h-[480px] w-full">
        <StackedCarousel images={carouselImages} alt={suiteName}>
          <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+80px)] z-10 rounded bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
            {page.tailored}
          </div>

          <div className="pointer-events-none absolute bottom-10 left-4 right-4 z-10 flex flex-col justify-end">
            <p className="mb-6 text-3xl font-light uppercase tracking-wide text-white drop-shadow-md">{suiteName}</p>

            {!checkInComplete && (
              <AppLink
                href={withLocale(locale, "/reception/check-in")}
                className="pointer-events-auto mb-6 flex w-full items-center justify-between rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-sm font-semibold text-foreground">{page.completeCheckIn}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </AppLink>
            )}
          </div>
        </StackedCarousel>
      </section>

      <div className="px-5 pt-6">
        <div className="grid grid-cols-2 gap-y-6">
          <div>
            <p className="text-xs text-muted-foreground">{page.labels.room}</p>
            <p className="mt-0.5 text-lg font-medium text-foreground">№ {roomNumber}</p>
          </div>

          <div>
            <span className="text-lg font-medium text-foreground">
              {adults} <span className="text-base font-normal text-muted-foreground">{page.labels.adults}</span>
            </span>
            {children > 0 ? (
              <span className="block text-lg font-medium text-foreground">
                {children} <span className="text-base font-normal text-muted-foreground">{page.labels.child}</span>
              </span>
            ) : null}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{page.labels.checkIn}</p>
            <p className="mt-0.5 font-medium text-foreground text-base">{formatDate(locale, checkInDate)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{page.labels.checkOut}</p>
            <p className="mt-0.5 font-medium text-foreground text-base">{formatDate(locale, checkOutDate)}</p>
          </div>
        </div>

        <div className="my-6 h-px w-full bg-border/50" />

        <div className="grid grid-cols-2 gap-3">
          {page.quickActions.slice(0, 4).map((action) => (
            <AppLink
              key={action.id}
              href={withLocale(locale, action.href)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
            >
              <span className="text-xs font-semibold leading-tight text-foreground">{action.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </AppLink>
          ))}
        </div>
        {page.quickActions[4] ? (
          <div className="mt-3">
            <AppLink
              href={withLocale(locale, page.quickActions[4].href)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
            >
              <span className="text-xs font-semibold leading-tight text-foreground">{page.quickActions[4].label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </AppLink>
          </div>
        ) : null}

        <div className="my-6 h-px w-full bg-border/50" />

        <div className="space-y-4">
          {page.promoCards.map((card) => (
            <PromoCard
              key={card.id}
              href={withLocale(locale, card.href)}
              title={card.title}
              subtitle={card.subtitle}
              cta={card.cta}
              image={card.image}
            />
          ))}
        </div>

        <div className="my-6 h-px w-full bg-border/50" />

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="relative h-40 w-full overflow-hidden rounded-xl">
            <Image src={page.upgrade.image} alt={page.upgrade.title} fill className="object-cover" unoptimized />
          </div>
          <div className="mt-4">
            <div className="mb-4">
              <p className="text-base font-semibold text-foreground">{page.upgrade.title}</p>
              <p className="text-xs text-muted-foreground">{page.upgrade.subtitle}</p>
            </div>
            <AppLink
              href={withLocale(locale, page.upgrade.href)}
              className="block w-full rounded-lg bg-black py-3 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {page.upgrade.cta}
            </AppLink>
          </div>
        </section>

        {/* <section className="mt-8">
          <p className="mb-4 text-lg font-semibold text-foreground">{page.upsellsTitle}</p>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar">
            {page.upsells.map((upsell) => (
              <AppLink
                href={withLocale(locale, upsell.href)}
                key={upsell.id}
                className="relative h-40 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <Image src={upsell.image} alt={upsell.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-2 left-2 text-sm font-medium uppercase text-white">{upsell.title}</p>
              </AppLink>
            ))}
          </div>
        </section> */}

        <div className="mt-6 space-y-1">
          <div className="flex items-center justify-between py-4">
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
    </div>
  );
}
