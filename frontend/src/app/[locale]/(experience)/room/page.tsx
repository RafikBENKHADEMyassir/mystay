"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Copy, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StackedCarousel } from "./stacked-carousel";
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


// Promo card component
function PromoCard({ href, title, subtitle, cta, image }: { 
  href: string; 
  title: string; 
  subtitle?: string;
  cta: string; 
  image: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex gap-4">
        <div
          className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted/30"
        >
          <Image 
            src={image} 
            alt={title} 
            width={80} 
            height={80} 
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Link
        href={href}
        className="mt-3 flex w-full items-center justify-center rounded-lg bg-muted/50 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {cta}
      </Link>
    </div>
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
    <div className="mx-auto max-w-md pb-24 lg:max-w-3xl relative">
      
      {/* Fixed absolute header for back button */}
      <div className="absolute left-0 top-0 z-[100] w-full p-4 pt-[calc(env(safe-area-inset-top)+12px)] pointer-events-none">
        <button
          onClick={() => router.back()}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/30"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{strings.yourRoom}</span>
        </button>
      </div>

      {/* Hero Carousel */}
      <section className="relative h-[480px] w-full">
        <StackedCarousel 
          images={roomImages.length > 0 ? roomImages : ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&fit=crop"]} 
          alt={suiteName}
        >
          {/* Tailored Badge */}
          <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+80px)] rounded bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-md z-10">
            {strings.tailored}
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-10 left-4 right-4 z-10 flex flex-col justify-end pointer-events-none">
            {/* Icon (Tree logo placeholder) */}
            <div className="mb-2">
               <div className="flex h-8 w-8 items-center justify-center opacity-80">
                 {/* Replace with actual tree icon if available */}
               </div>
            </div>

            <p className="mb-6 text-3xl font-light uppercase tracking-wide text-white drop-shadow-md">{suiteName}</p>

            {/* Complete Check-in Button (Overlay) */}
            {!checkInComplete && (
              <Link
                href={withLocale(locale, "/reception/check-in")}
                className="pointer-events-auto mb-6 flex w-full items-center justify-between rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-6 w-6">
                     <div className="absolute inset-0 rounded-full border-2 border-muted" />
                     <div className="absolute inset-0 rounded-full border-2 border-black border-t-transparent -rotate-45" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{strings.completeCheckIn}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </StackedCarousel>
      </section>

      <div className="px-5 pt-6">
        {/* Room Details Grid - Redesigned */}
        <div className="grid grid-cols-2 gap-y-6">
          {/* Room Number */}
          <div>
            <p className="text-xs text-muted-foreground">{strings.room}</p>
            <p className="mt-0.5 text-lg font-medium text-foreground">№ {roomNumber}</p>
          </div>
          
          {/* Guests */}
          <div>
             <div className="flex flex-col items-start">
               <span className="text-lg font-medium text-foreground">{adults} <span className="text-base font-normal text-muted-foreground">{strings.adults}</span></span>
               {children > 0 && (
                 <span className="text-lg font-medium text-foreground">{children} <span className="text-base font-normal text-muted-foreground">{strings.child}</span></span>
               )}
               {children === 0 && <span className="text-base text-muted-foreground">&nbsp;</span>} 
               {/* Spacer to align if no kids, or just hide. Screenshot shows stacked: 2 adultes, 1 enfant */}
             </div>
          </div>

          {/* Check-in */}
          <div>
            <p className="text-xs text-muted-foreground">{strings.checkIn}</p>
            <p className="mt-0.5 font-medium text-foreground text-base">
               {checkInDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-lg font-medium text-foreground">
               {/* Screenshot shows time e.g. 9:00 */}
               {checkInDate.getHours()}:00
            </p>
          </div>

          {/* Check-out */}
          <div>
            <p className="text-xs text-muted-foreground">{strings.checkOut}</p>
            <p className="mt-0.5 font-medium text-foreground text-base">
              {checkOutDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-lg font-medium text-foreground">
              {checkOutDate.getHours()}:00
            </p>
          </div>
        </div>
        
        <div className="my-6 h-px w-full bg-border/50" />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={withLocale(locale, "/reception")}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
          >
            <span className="text-xs font-semibold leading-tight text-foreground">{strings.digitalKey}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href={withLocale(locale, "/hotels")}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
          >
            <span className="text-xs font-semibold leading-tight text-foreground">{strings.usefulInfo}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href={withLocale(locale, "/room-service")}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
          >
            <span className="text-xs font-semibold leading-tight text-foreground">{strings.roomControl}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href={withLocale(locale, "/hotels")}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
          >
            <span className="text-xs font-semibold leading-tight text-foreground">{strings.directions}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
        <div className="mt-3">
          <Link
            href={withLocale(locale, "/room-service")}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted/30"
          >
             <span className="text-xs font-semibold leading-tight text-foreground">{strings.extraBed}</span>
             <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
        
        <div className="my-6 h-px w-full bg-border/50" />

        {/* Promo Cards */}
        <div className="space-y-4">
          <PromoCard
            href={withLocale(locale, "/housekeeping")}
            title={strings.cleaning}
            subtitle={strings.cleaningSubtitle}
            cta={strings.requestCleaning}
            image="https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=400&fit=crop"
          />
          <PromoCard
            href={withLocale(locale, "/services")}
            title={strings.needService}
            subtitle={strings.needServiceSubtitle}
            cta={strings.requestService}
            image="https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400&fit=crop"
          />
        </div>
        
        <div className="my-6 h-px w-full bg-border/50" />

        {/* Room Upgrade Card */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="relative h-40 w-full overflow-hidden rounded-xl">
            <Image
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&fit=crop"
              alt="Room upgrade"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="mt-4">
            <div className="mb-4">
               <p className="text-base font-semibold text-foreground">{strings.roomUpgrade}</p>
               <p className="text-xs text-muted-foreground">{strings.upgradeSubtitle}</p>
            </div>
            <Link
              href={withLocale(locale, "/services")}
              className="block w-full rounded-lg bg-black py-3 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {strings.seeOptions}
            </Link>
          </div>
        </section>

        {/* Upsells Grid ("Plaisirs sur mesure") */}
        <section className="mt-8">
          <p className="mb-4 text-lg font-semibold text-foreground">{strings.tailored}</p>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar">
            {/* Mock Upsell Items based on screenshot */}
            {[
              { title: "FLEURS", img: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&fit=crop" },
              { title: "CHAMPAGNE", img: "https://images.unsplash.com/photo-1598414539665-279fd9026d3e?w=400&fit=crop" },
              { title: "LETTRE", img: "https://images.unsplash.com/photo-1579783483458-83d02161294e?w=400&fit=crop" },
              { title: "MAGAZINE", img: "https://images.unsplash.com/photo-1550974868-b39418af8858?w=400&fit=crop" },
              { title: "VOS UPSELLS", img: null }, // Placeholder for 'Vos Upsells' with icon
            ].map((item, index) => (
              <Link 
                href={withLocale(locale, "/services")} 
                key={index} 
                className="relative h-40 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                {item.img ? (
                   <Image
                     src={item.img}
                     alt={item.title}
                     fill
                     className="object-cover"
                     unoptimized
                   />
                ) : (
                   <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-800 p-2">
                      <div className="mb-2 rounded border border-white/30 p-2">
                        {/* Placeholder icon box */}
                        <div className="h-4 w-4 bg-white/20" />
                      </div>
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-2 left-2 text-sm font-medium uppercase text-white">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom Actions List */}
        <div className="mt-6 space-y-1">
          <div className="flex items-center justify-between py-4">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <span>{strings.reservation} {confirmationNumber}</span>
               <button onClick={handleCopyReservation}>
                 <Copy className={cn("h-3.5 w-3.5", copied ? "text-green-600" : "text-muted-foreground")} />
               </button>
             </div>
          </div>
          
          <div className="h-px w-full bg-border/50" />
          
          <Link
            href={withLocale(locale, "/profile")}
            className="flex items-center justify-between py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{strings.stayHistory}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          
          <div className="h-px w-full bg-border/50" />

          <Link
            href={withLocale(locale, "/reception")}
            className="flex items-center justify-between py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{strings.lateCheckout}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <div className="h-px w-full bg-border/50" />

          <Link
            href={withLocale(locale, "/messages")}
            className="flex items-center justify-between py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>{strings.contactReception}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
