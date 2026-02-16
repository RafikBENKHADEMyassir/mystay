"use client";

import { AppLink } from "@/components/ui/app-link";
/* eslint-disable @next/next/no-img-element */
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageSquare,
  Clock,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";

export default function RestaurantsPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);

  const page = content?.pages.restaurants;
  const common = content?.common;

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

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

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      {/* Hero Header */}
      <div className="relative h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${page.heroImage})` }} />
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
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">{page.title}</h1>
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
              <p className="font-medium text-gray-900">{common.availabilityCard.currentlyAvailableTo}</p>
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
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{common.availabilityCard.openingFrom}</span>
              <span className="text-gray-400">{common.availabilityCard.to}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{common.availabilityCard.openingTo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants Section */}
      <div className="flex-1 px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{page.experiencesTitle}</h2>

        {/* Restaurant Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {page.restaurants.map((restaurant) => (
            <AppLink
              key={restaurant.id}
              href={withLocale(locale, `/restaurants/${restaurant.id}`)}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-semibold text-white">{restaurant.name}</h3>
                  <p className="text-sm text-white/80">{restaurant.cuisine}</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <p className="text-sm text-gray-600">{restaurant.description}</p>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{restaurant.hours}</span>
                  </div>
                  {restaurant.dressCode && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{restaurant.dressCode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-600">{page.bookTable}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </div>
  );
}
