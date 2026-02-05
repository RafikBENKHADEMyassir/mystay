"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, BedDouble, ChevronRight, Copy, Info, Key, Loader2, MapPin, Monitor } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

function formatDateFull(locale: Locale, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Quick action button component
function QuickActionButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

// Promo card component
function PromoCard({ href, title, subtitle, cta, image }: { 
  href: string; 
  title: string; 
  subtitle?: string;
  cta: string; 
  image: string;
}) {
  return (
    <Link href={href} className="flex overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className="h-24 w-24 flex-shrink-0 bg-muted/30 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col justify-center p-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        <span className="mt-2 inline-flex w-fit items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
          {cta}
        </span>
      </div>
    </Link>
  );
}

export default function RoomDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoading, overview, authenticated } = useGuestOverview();
  const [copied, setCopied] = useState(false);

  const strings = useMemo(() => {
    if (locale === "fr") {
      return {
        yourRoom: "Votre chambre",
        tailored: "Plaisirs sur mesure",
        completeCheckIn: "Complétez votre check‑in",
        room: "Chambre",
        adults: "adultes",
        child: "enfant",
        checkIn: "Check-in",
        checkOut: "Check-out",
        digitalKey: "Clé digitale de chambre",
        usefulInfo: "Informations utiles",
        roomControl: "Contrôle de chambre",
        directions: "Itinéraire vers l'hôtel",
        extraBed: "Demander un lit supplémentaire",
        cleaning: "Nettoyage",
        cleaningSubtitle: "Selon votre agenda.",
        requestCleaning: "Demander un nettoyage",
        needService: "Besoin d'un service ?",
        needServiceSubtitle: "Dites nous ce dont vous avez besoin.",
        requestService: "Demander un service",
        roomUpgrade: "Room upgrade",
        upgradeSubtitle: "Optez pour un maximum de confort.",
        seeOptions: "Consulter les options",
        reservation: "Réservation n°",
        stayHistory: "Historique de séjours et factures",
        lateCheckout: "Late check-out",
        contactReception: "Contacter la réception"
      };
    }

    return {
      yourRoom: "Your room",
      tailored: "Tailored experiences",
      completeCheckIn: "Complete your check‑in",
      room: "Room",
      adults: "adults",
      child: "child",
      checkIn: "Check-in",
      checkOut: "Check-out",
      digitalKey: "Digital room key",
      usefulInfo: "Useful information",
      roomControl: "Room control",
      directions: "Directions to hotel",
      extraBed: "Request an extra bed",
      cleaning: "Housekeeping",
      cleaningSubtitle: "Based on your schedule.",
      requestCleaning: "Request cleaning",
      needService: "Need a service?",
      needServiceSubtitle: "Tell us what you need.",
      requestService: "Request a service",
      roomUpgrade: "Room upgrade",
      upgradeSubtitle: "Opt for maximum comfort.",
      seeOptions: "See options",
      reservation: "Reservation #",
      stayHistory: "Stay history & invoices",
      lateCheckout: "Late check-out",
      contactReception: "Contact reception"
    };
  }, [locale]);

  // Room images
  const [roomImages, setRoomImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&fit=crop",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&fit=crop"
  ]);

  // Fetch room images
  useEffect(() => {
    async function loadRoomImages() {
      if (overview?.hotel?.id) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
          const res = await fetch(`${apiBaseUrl}/api/v1/hotels/${overview.hotel.id}/room-images`);
          if (res.ok) {
            const data = await res.json() as { images: Array<{ imageUrl: string }> };
            if (data.images?.length > 0) {
              setRoomImages(data.images.map((img) => img.imageUrl).slice(0, 6));
              return;
            }
          }
        } catch {
          // Keep default images
        }
      }

      // Try localStorage
      try {
        const stored = localStorage.getItem("mystay_room_images");
        if (stored) {
          const parsed = JSON.parse(stored) as Array<{ imageUrl: string; isActive: boolean }>;
          const activeImages = parsed.filter((img) => img.isActive).map((img) => img.imageUrl);
          if (activeImages.length > 0) {
            setRoomImages(activeImages.slice(0, 6));
          }
        }
      } catch {
        // Keep default images
      }
    }

    void loadRoomImages();
  }, [overview?.hotel?.id]);

  const handleCopyReservation = () => {
    if (overview?.stay.confirmationNumber) {
      navigator.clipboard.writeText(overview.stay.confirmationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  const roomNumber = overview.stay.roomNumber ?? "—";
  const adults = overview.stay.guests?.adults ?? 1;
  const children = overview.stay.guests?.children ?? 0;
  const checkInDate = parseDateOrNull(overview.stay.checkIn) ?? new Date();
  const checkOutDate = parseDateOrNull(overview.stay.checkOut) ?? new Date();
  const checkInFormatted = formatDateFull(locale, checkInDate);
  const checkOutFormatted = formatDateFull(locale, checkOutDate);
  const confirmationNumber = overview.stay.confirmationNumber;
  const suiteName = "SEA VIEW SUITE";
  const checkInComplete = Boolean(overview.guest.idDocumentVerified) && Boolean(overview.guest.hasPaymentMethod);

  // Room hero image
  const roomHeroImage = roomImages[0] ?? "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&fit=crop";

  return (
    <div className="mx-auto max-w-md pb-24 lg:max-w-3xl">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{strings.yourRoom}</span>
        </button>
      </header>

      {/* Room Hero Image */}
      <section className="relative h-64 w-full">
        <Image
          src={roomHeroImage}
          alt={suiteName}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

        {/* Tailored Badge */}
        <div className="absolute right-4 top-4 rounded-lg bg-muted/80 px-2.5 py-1.5 text-[10px] font-medium text-foreground backdrop-blur">
          {strings.tailored}
        </div>

        {/* Suite Name */}
        <div className="absolute bottom-4 left-4">
          <p className="text-lg font-semibold text-white">{suiteName}</p>
        </div>
      </section>

      <div className="px-4">
        {/* Complete Check-in Button */}
        {!checkInComplete && (
          <Link
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 transition-colors hover:bg-muted/30"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-full border border-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">{strings.completeCheckIn}</span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        )}

        {/* Room Details Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{strings.room}</p>
            <p className="font-semibold text-foreground">N° {roomNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {adults} {strings.adults}
            </p>
            {children > 0 && (
              <p className="text-xs text-muted-foreground">
                {children} {strings.child}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{strings.checkIn}</p>
            <p className="font-medium text-foreground">{checkInFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{strings.checkOut}</p>
            <p className="font-medium text-foreground">{checkOutFormatted}</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <QuickActionButton
            href={withLocale(locale, "/reception")}
            label={strings.digitalKey}
            icon={<Key className="h-4 w-4 text-muted-foreground" />}
          />
          <QuickActionButton
            href={withLocale(locale, "/hotels")}
            label={strings.usefulInfo}
            icon={<Info className="h-4 w-4 text-muted-foreground" />}
          />
          <QuickActionButton
            href={withLocale(locale, "/room-service")}
            label={strings.roomControl}
            icon={<Monitor className="h-4 w-4 text-muted-foreground" />}
          />
          <QuickActionButton
            href={withLocale(locale, "/hotels")}
            label={strings.directions}
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="mt-2">
          <QuickActionButton
            href={withLocale(locale, "/room-service")}
            label={strings.extraBed}
            icon={<BedDouble className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Promo Cards */}
        <div className="mt-6 space-y-3">
          <PromoCard
            href={withLocale(locale, "/housekeeping")}
            title={strings.cleaning}
            subtitle={strings.cleaningSubtitle}
            cta={strings.requestCleaning}
            image="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&fit=crop"
          />
          <PromoCard
            href={withLocale(locale, "/services")}
            title={strings.needService}
            subtitle={strings.needServiceSubtitle}
            cta={strings.requestService}
            image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&fit=crop"
          />
        </div>

        {/* Room Upgrade Card */}
        <section className="mt-6">
          <div className="relative h-36 w-full overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&fit=crop"
              alt="Room upgrade"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="mt-3">
            <p className="font-semibold text-foreground">{strings.roomUpgrade}</p>
            <p className="text-xs text-muted-foreground">{strings.upgradeSubtitle}</p>
            <Link
              href={withLocale(locale, "/services")}
              className="mt-3 block w-full rounded-full bg-foreground py-2.5 text-center text-sm font-semibold text-background"
            >
              {strings.seeOptions}
            </Link>
          </div>
        </section>

        {/* Room Photos Carousel */}
        <section className="mt-6">
          <p className="mb-3 text-sm font-semibold text-foreground">{strings.tailored}</p>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {roomImages.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative h-32 min-w-[120px] flex-shrink-0 overflow-hidden rounded-2xl"
              >
                <Image
                  src={src}
                  alt={`Room photo ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>

        {/* Reservation Number */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground">
            {strings.reservation}
            <span className="font-mono">{confirmationNumber}</span>
          </p>
          <button
            onClick={handleCopyReservation}
            className="rounded p-1 hover:bg-muted"
            title="Copy"
          >
            <Copy className={cn("h-3.5 w-3.5", copied ? "text-green-600" : "text-muted-foreground")} />
          </button>
        </div>

        {/* Bottom Actions */}
        <section className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          <Link
            href={withLocale(locale, "/profile")}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="font-medium text-foreground">{strings.stayHistory}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href={withLocale(locale, "/reception")}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="font-medium text-foreground">{strings.lateCheckout}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href={withLocale(locale, "/messages")}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="font-medium text-foreground">{strings.contactReception}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </div>
    </div>
  );
}
