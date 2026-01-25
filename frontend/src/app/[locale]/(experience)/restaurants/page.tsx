"use client";

import Link from "next/link";
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
import { withLocale } from "@/lib/i18n/paths";

const HERO_IMAGE = "/images/services/restaurant_background.png";

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  cuisineFr: string;
  description: string;
  descriptionFr: string;
  image: string;
  hours: string;
  dressCode?: string;
  dressCodeFr?: string;
};

// Mock restaurant data
const restaurants: Restaurant[] = [
  {
    id: "sea_fu",
    name: "SEA FU",
    cuisine: "Asian Fusion & Seafood",
    cuisineFr: "Fusion asiatique & Fruits de mer",
    description: "Contemporary Asian cuisine with stunning ocean views",
    descriptionFr: "Cuisine asiatique contemporaine avec vue imprenable sur l'océan",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80",
    hours: "12:00 - 23:00",
    dressCode: "Smart casual",
    dressCodeFr: "Tenue élégante décontractée"
  },
  {
    id: "coya",
    name: "COYA",
    cuisine: "Peruvian",
    cuisineFr: "Péruvien",
    description: "Vibrant Peruvian flavors in an energetic atmosphere",
    descriptionFr: "Saveurs péruviennes vibrantes dans une atmosphère dynamique",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    hours: "19:00 - 02:00",
    dressCode: "Smart casual",
    dressCodeFr: "Tenue élégante décontractée"
  },
  {
    id: "la_terrasse",
    name: "La Terrasse",
    cuisine: "Mediterranean",
    cuisineFr: "Méditerranéen",
    description: "Al fresco dining with Mediterranean specialties",
    descriptionFr: "Repas en plein air avec des spécialités méditerranéennes",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
    hours: "07:00 - 22:00"
  }
];

export default function RestaurantsPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={withLocale(locale, "/services")} className="-ml-2 p-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </Link>
          <div className="text-center">
            <p className="font-medium text-gray-900">Restaurant</p>
          </div>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">
            {locale === "fr" ? "Connectez-vous pour accéder aux restaurants." : "Sign in to access restaurants."}
          </p>
          <Link
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            {locale === "fr" ? "Commencer le check-in" : "Start check-in"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      {/* Hero Header */}
      <div className="relative h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        {/* Topbar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
          <Link
            href={withLocale(locale, "/services")}
            className="-ml-2 rounded-full bg-white/10 p-2 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <Leaf className="h-6 w-6 text-white/80" />
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">Restaurant</h1>
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
                {locale === "fr" ? "Actuellement disponible pour" : "Currently available to"}
              </p>
              <p className="text-sm text-gray-500">{locale === "fr" ? "échanger." : "chat."}</p>
            </div>

            <Link
              href={withLocale(locale, "/messages")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </Link>
          </div>

          {/* Hours */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{locale === "fr" ? "Disponibilités" : "Availability"}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{locale === "fr" ? "De" : "From"}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">6h</span>
              <span className="text-gray-400">{locale === "fr" ? "à" : "to"}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">23h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants Section */}
      <div className="flex-1 px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {locale === "fr" ? "Nos expériences culinaires" : "Our culinary experiences"}
        </h2>

        {/* Restaurant Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {restaurants.map((restaurant) => (
            <Link
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
                  <p className="text-sm text-white/80">
                    {locale === "fr" ? restaurant.cuisineFr : restaurant.cuisine}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  {locale === "fr" ? restaurant.descriptionFr : restaurant.description}
                </p>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{restaurant.hours}</span>
                  </div>
                  {restaurant.dressCode && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{locale === "fr" ? restaurant.dressCodeFr : restaurant.dressCode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-600">
                    {locale === "fr" ? "Réserver une table" : "Book a table"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
