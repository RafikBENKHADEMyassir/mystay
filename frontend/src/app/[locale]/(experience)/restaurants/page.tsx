"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { RestaurantBottomSheet } from "@/components/restaurant/restaurant-bottom-sheet";
import { RestaurantBookingForm } from "@/components/restaurant/restaurant-booking-form";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { withLocale } from "@/lib/i18n/paths";
import type { ExperienceItem, ExperienceSection } from "@/types/overview";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Map restaurant label to local image path (e.g. SEA FU -> sea-fu.png) */
const LABEL_TO_IMAGE: Record<string, string> = {
  "SEA FU": "sea-fu",
  COYA: "coya",
  "MIMI KAKUSHI": "mimi-kakushi",
  SCALINI: "scalini",
  VERDE: "verde",
  PASTRIES: "pastries",
  "NUSR-ET": "nusr-et",
  NAMMOS: "nammos",
};

function getRestaurantImageUrl(item: ExperienceItem): string {
  const slug = LABEL_TO_IMAGE[item.label];
  if (slug) {
    return `/images/restaurant/${slug}.png`;
  }
  const config = (item.restaurantConfig ?? {}) as Record<string, unknown>;
  const coverImage = (config.coverImage as string) || item.imageUrl;
  if (coverImage?.startsWith("/uploads/")) {
    return `${apiBaseUrl}${coverImage}`;
  }
  if (coverImage && (coverImage.startsWith("http") || coverImage.startsWith("/"))) {
    return coverImage;
  }
  const derivedSlug = item.label.toLowerCase().replace(/\s+/g, "-");
  return `/images/restaurant/${derivedSlug}.png`;
}

export default function RestaurantsPage() {
  const locale = useLocale();
  const { overview, token: overviewToken } = useGuestOverview();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId ?? overview?.hotel.id ?? null);

  const page = content?.pages.restaurants;
  const common = content?.common;

  const [restaurants, setRestaurants] = useState<ExperienceItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ExperienceItem | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const demo = getDemoSession();
    if (demo) {
      setSession(demo);
    } else if (overview && overviewToken) {
      setSession({
        hotelId: overview.hotel.id,
        hotelName: overview.hotel.name,
        stayId: overview.stay.id,
        confirmationNumber: overview.stay.confirmationNumber,
        guestToken: overviewToken,
        roomNumber: overview.stay.roomNumber,
      });
    }
  }, [overview, overviewToken]);

  // Fetch restaurant-type experience items from the backend
  useEffect(() => {
    if (!session?.hotelId) return;
    let cancelled = false;

    async function loadRestaurants() {
      setIsLoadingItems(true);
      try {
        const res = await fetch(
          `/api/hotels/${encodeURIComponent(session!.hotelId)}/experiences`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          setRestaurants([]);
          return;
        }
        const data = (await res.json()) as { sections?: ExperienceSection[] };
        const sections = Array.isArray(data.sections) ? data.sections : [];
        const restaurantItems = sections
          .flatMap((s) => s.items ?? [])
          .filter((item) => item.type === "restaurant");

        if (!cancelled) setRestaurants(restaurantItems);
      } catch {
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setIsLoadingItems(false);
      }
    }

    void loadRestaurants();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.hotelId]);

  const handleRestaurantClick = useCallback((item: ExperienceItem) => {
    setSelectedRestaurant(item);
    setShowBookingForm(false);
    setBookingSuccess(false);
  }, []);

  const handleBook = useCallback(() => {
    setShowBookingForm(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedRestaurant(null);
    setShowBookingForm(false);
  }, []);

  const handleBooked = useCallback(() => {
    setBookingSuccess(true);
    setShowBookingForm(false);
    setSelectedRestaurant(null);
  }, []);

  // Auto-hide success toast
  useEffect(() => {
    if (!bookingSuccess) return;
    const timer = setTimeout(() => setBookingSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [bookingSuccess]);

  function getConfig(item: ExperienceItem) {
    return (item.restaurantConfig ?? {}) as Record<string, unknown>;
  }

  if (!page || !common) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
          <AppLink href={withLocale(locale, "/services")} className="p-2">
            <Image src="/images/housekeeping/arrow-back.svg" alt="Back" width={26} height={26} unoptimized />
          </AppLink>
          <p className="text-[16px] font-medium text-black">{page.title}</p>
          <Image src="/images/housekeeping/logo.svg" alt="" width={32} height={32} unoptimized />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-black/40">{common.signInToAccessRestaurants}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Hero — 260px full-bleed with dark overlay */}
      <div className="relative h-[260px] overflow-hidden">
        <Image
          src="/images/restaurant/hero-background.png"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Top bar — absolute over hero with gradient */}
      <div className="pointer-events-none absolute left-0 right-0 top-0">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-[10px] pr-4"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.376) 25%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 79.808%, rgba(0,0,0,0) 100%)",
          }}
        >
          <AppLink
            href={withLocale(locale, "/services")}
            className="flex h-[36px] items-center justify-center rounded-[8px] p-[8px]"
          >
            <Image src="/images/housekeeping/arrow-back.svg" alt="Back" width={26} height={26} unoptimized />
          </AppLink>
          <Image src="/images/housekeeping/logo.svg" alt="" width={32} height={32} unoptimized />
        </div>
      </div>

      {/* Title — centered over hero at top 104px */}
      <div className="pointer-events-none absolute left-0 right-0 top-[104px] flex items-center justify-center">
        <h1
          className="text-[28px] font-light tracking-[1.12px] text-white"
          style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.5)" }}
        >
          {page.title}
        </h1>
      </div>

      {/* Content overlapping hero by -24px */}
      <div className="-mt-[24px] relative z-10 pb-[120px]">
        {/* Chat availability card */}
        <div className="px-[16px]">
          <AppLink
            href={withLocale(locale, "/messages?department=restaurants")}
            className="flex items-center gap-[12px] rounded-[6px] border border-black/10 bg-white px-[16px] py-[12px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]"
          >
            <div className="relative h-[33px] w-[33px] shrink-0">
              <Image
                src="/images/housekeeping/message-circle.svg"
                alt=""
                width={33}
                height={33}
                unoptimized
              />
            </div>
            <div className="flex flex-1 items-center gap-[16px]">
              <p className="flex-1 text-[15px] text-black">
                {common.availabilityCard.currentlyAvailableTo} {common.availabilityCard.chat}
              </p>
              <div className="shrink-0">
                <Image
                  src="/images/housekeeping/chevron-right.svg"
                  alt=""
                  width={18}
                  height={12}
                  unoptimized
                />
              </div>
            </div>
          </AppLink>
        </div>

        {/* Availability accordion */}
        <div className="px-[16px] pt-[8px]">
          <div className="overflow-hidden rounded-[8px] px-[8px]">
            <button className="relative flex w-full items-center gap-[6px] overflow-hidden rounded-[8px] py-[8px]">
              <span className="text-[15px] font-medium text-black/50">
                {common.availabilityCard.availability}
              </span>
              <div className="ml-auto flex items-center gap-[5px]">
                <span className="text-[15px] text-black">{common.availabilityCard.from}</span>
                <span className="rounded-[5px] border border-black/10 px-[6px] py-[2px] text-[15px] text-black">
                  {common.availabilityCard.openingFrom}
                </span>
                <span className="text-[15px] text-black">{common.availabilityCard.to}</span>
                <span className="rounded-[5px] border border-black/10 px-[6px] py-[2px] text-[15px] text-black">
                  {common.availabilityCard.openingTo}
                </span>
              </div>
              <div className="absolute right-[-5px] top-1/2 h-[24px] w-[24px] -translate-y-1/2">
                <Image
                  src="/images/housekeeping/accordion-toggle.svg"
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                />
              </div>
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center px-[48px] py-[24px]">
          <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* Nos expériences culinaires section */}
        <div className="px-[16px] pb-[16px]">
          <h2 className="text-[22px] font-medium text-black">
            {page.experiencesTitle}
          </h2>
        </div>

        {/* Restaurant cards — horizontal scroll, 150x220, Figma design */}
        {isLoadingItems && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
          </div>
        )}

        {!isLoadingItems && restaurants.length === 0 && (
          <p className="px-[16px] py-8 text-center text-[15px] text-black/40">
            {locale === "fr"
              ? "Aucun restaurant configuré pour le moment."
              : "No restaurants configured yet."}
          </p>
        )}

        {!isLoadingItems && restaurants.length > 0 && (
          <div className="flex gap-[4px] overflow-x-auto px-[16px] scrollbar-hide">
            {restaurants.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRestaurantClick(item)}
                className="group relative h-[220px] w-[150px] flex-shrink-0 overflow-hidden rounded-[6px]"
              >
                <div className="relative h-full w-full overflow-hidden border border-[rgba(0,0,0,0.1)] rounded-[6px]">
                  <Image
                    src={getRestaurantImageUrl(item)}
                    alt={item.label}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="150px"
                    unoptimized
                  />
                  {/* Bottom gradient overlay — from ~32% down */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[68%]"
                    style={{
                      background:
                        "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.098) 20%, rgba(0,0,0,0.325) 49.519%, rgba(0,0,0,0.584) 100%)",
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-[12px] py-[16px]">
                    <h3 className="text-[23px] font-normal uppercase leading-tight text-white">
                      {item.label}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Restaurant bottom sheet */}
      {selectedRestaurant && !showBookingForm && (
        <RestaurantBottomSheet
          item={selectedRestaurant}
          onBook={handleBook}
          onClose={handleClose}
        />
      )}

      {/* Booking form */}
      {selectedRestaurant && showBookingForm && session?.guestToken &&
        (() => {
          const cfg = getConfig(selectedRestaurant);
          const hoursStr = typeof cfg.hours === "string" ? cfg.hours : "";
          const [openingTime, closingTime] = hoursStr.includes("-")
            ? hoursStr.split("-").map((s: string) => s.trim())
            : [undefined, undefined];
          return (
            <RestaurantBookingForm
              restaurantName={selectedRestaurant.label}
              experienceItemId={selectedRestaurant.id}
              onClose={() => setShowBookingForm(false)}
              onBooked={handleBooked}
              guestToken={session.guestToken}
              openingTime={openingTime}
              closingTime={closingTime}
            />
          );
        })()}

      {/* Success toast */}
      {bookingSuccess && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
            {locale === "fr"
              ? "Votre réservation a été envoyée ! Consultez vos messages pour le suivi."
              : "Your booking request has been sent! Check your messages for updates."}
          </div>
        </div>
      )}
    </div>
  );
}
