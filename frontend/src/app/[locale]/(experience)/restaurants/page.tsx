"use client";

/* eslint-disable @next/next/no-img-element */
import { AppLink } from "@/components/ui/app-link";
import {
  ChevronLeft,
  Leaf,
  MessageSquare,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { RestaurantBottomSheet } from "@/components/restaurant/restaurant-bottom-sheet";
import { RestaurantBookingForm } from "@/components/restaurant/restaurant-booking-form";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import type { ExperienceItem, ExperienceSection } from "@/types/overview";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function RestaurantsPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);

  const page = content?.pages.restaurants;
  const common = content?.common;

  const [restaurants, setRestaurants] = useState<ExperienceItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ExperienceItem | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

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

  if (!page || !common) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <AppLink href={withLocale(locale, "/services")} className="-ml-2 p-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </AppLink>
          <div className="text-center">
            <p className="font-medium text-gray-900">{page.title}</p>
          </div>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">{common.signInToAccessRestaurants}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  // Build restaurant config helpers
  function getConfig(item: ExperienceItem) {
    return (item.restaurantConfig ?? {}) as Record<string, unknown>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      {/* Hero Header */}
      <div className="relative h-48 flex-shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${page.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        {/* Topbar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
          <AppLink
            href={withLocale(locale, "/services")}
            className="-ml-2 rounded-full bg-white/10 p-2 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </AppLink>
          <Leaf className="h-6 w-6 text-white/80" />
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">
            {page.title}
          </h1>
        </div>
      </div>

      {/* Staff Availability Card */}
      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-100 to-rose-200">
                <span className="text-2xl">🍷</span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {common.availabilityCard.currentlyAvailableTo}
              </p>
              <p className="text-sm text-gray-500">{common.availabilityCard.chat}</p>
            </div>

            <AppLink
              href={withLocale(locale, "/messages?department=restaurants")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </AppLink>
          </div>

          {/* Hours */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{common.availabilityCard.availability}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{common.availabilityCard.from}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                {common.availabilityCard.openingFrom}
              </span>
              <span className="text-gray-400">{common.availabilityCard.to}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                {common.availabilityCard.openingTo}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants Section */}
      <div className="flex-1 px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{page.experiencesTitle}</h2>

        {isLoadingItems && (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
          </div>
        )}

        {!isLoadingItems && restaurants.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            {locale === "fr"
              ? "Aucun restaurant configure pour le moment."
              : "No restaurants configured yet."}
          </p>
        )}

        {/* Restaurant Cards (horizontal scroll like Figma) */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {restaurants.map((item) => {
            const config = getConfig(item);
            const coverImage = (config.coverImage as string) || item.imageUrl;
            const imageUrl = coverImage?.startsWith("/uploads/")
              ? `${apiBaseUrl}${coverImage}`
              : coverImage;

            return (
              <button
                key={item.id}
                onClick={() => handleRestaurantClick(item)}
                className="group relative w-[170px] flex-shrink-0 overflow-hidden rounded-[6px]"
              >
                <div className="relative h-[200px] w-full overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={item.label}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
      {selectedRestaurant && showBookingForm && session?.guestToken && (() => {
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
              ? "Votre reservation a ete envoyee ! Consultez vos messages pour le suivi."
              : "Your booking request has been sent! Check your messages for updates."}
          </div>
        </div>
      )}

      {/* Sticky Message Bar */}
      <div className="sticky bottom-0 border-t bg-white/90 backdrop-blur">
        <AppLink
          href={withLocale(locale, "/messages?department=restaurants")}
          className="mx-auto flex max-w-md items-center gap-3 px-4 py-3"
        >
          <span className="flex-1 text-sm text-gray-400">
            {locale === "fr" ? "Écrire un message" : "Write a message"}
          </span>
          <Send className="h-5 w-5 text-black/60" />
        </AppLink>
      </div>
    </div>
  );
}
