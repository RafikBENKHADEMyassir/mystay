"use client";

import { AppLink } from "@/components/ui/app-link";
import { useSearchParams } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageSquare,
  Clock,
  Calendar,
  Dumbbell,
  Sparkles
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: "spa" | "gym";
  image?: string;
};

type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function SpaGymPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.spaGym;
  const common = content?.common;
  const [activeTab, setActiveTab] = useState<"spa" | "gym">("spa");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredServices = useMemo(
    () => (page?.services ?? []).filter((s) => s.category === activeTab),
    [activeTab, page?.services]
  );

  useEffect(() => {
    setSession(getDemoSession());

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const requested = (searchParams?.get("tab") ?? "").trim().toLowerCase();
    if (requested === "gym") {
      setActiveTab("gym");
      return;
    }
    if (requested === "spa") {
      setActiveTab("spa");
    }
  }, [searchParams]);

  // Load bookings
  async function loadBookings(activeSession = session) {
    if (!activeSession) return;

    setIsLoading(true);

    try {
      const url = new URL("/api/v1/events", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);
      url.searchParams.set("type", "spa");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });

      if (response.ok) {
        const data = (await response.json()) as { items?: Booking[] };
        setBookings(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadBookings(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  // Real-time updates
  const handleRealtimeUpdate = useCallback(() => {
    void loadBookings(session);
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["spa", "gym"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate
  });

  // Book service
  async function bookService() {
    if (!session || !selectedService || !selectedDate || !selectedTime || isBooking) return;

    setIsBooking(true);
    setError(null);

    try {
      const startAt = new Date(`${selectedDate}T${selectedTime}:00`);
      const endAt = new Date(startAt.getTime() + selectedService.duration * 60000);

      const response = await fetch(new URL("/api/v1/events", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          hotelId: session.hotelId,
          stayId: session.stayId,
          type: selectedService.category,
          title: selectedService.name,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          metadata: {
            serviceId: selectedService.id,
            price: selectedService.price,
            duration: selectedService.duration
          }
        })
      });

      if (!response.ok) {
        setError(page?.errors.couldNotBook ?? "");
        return;
      }

      // Reset selection
      setSelectedService(null);
      setSelectedTime("");
      await loadBookings(session);
    } catch {
      setError(page?.errors.serviceUnavailable ?? "");
    } finally {
      setIsBooking(false);
    }
  }

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
          <p className="text-gray-500">{common.signInToAccessSpaGym}</p>
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
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-purple-200">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">{common.availabilityCard.currentlyAvailableTo}</p>
              <p className="text-sm text-gray-500">{common.availabilityCard.chat}</p>
            </div>

            <AppLink
              href={withLocale(locale, "/messages?department=spa-gym")}
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

      {/* Tabs */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("spa")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === "spa" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <Sparkles className="h-4 w-4" />
            {page.tabs.spa}
          </button>
          <button
            onClick={() => setActiveTab("gym")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === "gym" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <Dumbbell className="h-4 w-4" />
            {page.tabs.gym}
          </button>
        </div>
      </div>

      {/* Active Bookings */}
      {bookings.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <h2 className="mb-3 text-sm font-medium text-gray-500">{page.yourBookings}</h2>
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 rounded-xl bg-purple-50 p-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{booking.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    {booking.date} {page.dateTimeSeparator} {booking.time}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {booking.status === "confirmed"
                    ? page.bookingStatus.confirmed
                    : page.bookingStatus.pending}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="flex-1 px-4 py-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {activeTab === "spa"
            ? page.sectionTitles.spa
            : page.sectionTitles.gym}
        </h2>

        <div className="space-y-3">
          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
              className={cn(
                "w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition",
                selectedService?.id === service.id ? "border-purple-500 ring-1 ring-purple-500" : "border-gray-100"
              )}
            >
              <div className="flex">
                {/* Image */}
                {service.image && (
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-1 flex-col justify-center p-3">
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{service.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration} {common.minutesLabel}
                    </span>
                    <span className="font-medium text-gray-900">
                      {service.price} {common.currencySymbol}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className={cn(
                    "m-3 h-5 w-5 transition",
                    selectedService?.id === service.id ? "rotate-90 text-purple-500" : "text-gray-300"
                  )}
                />
              </div>

              {/* Booking Panel */}
              {selectedService?.id === service.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <p className="mb-3 text-sm font-medium text-gray-700">{page.chooseTimeSlot}</p>

                  {/* Date */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />

                  {/* Time slots */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {page.timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTime(time);
                        }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm transition",
                          selectedTime === time
                            ? "bg-purple-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {/* Book button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void bookService();
                    }}
                    disabled={!selectedTime || isBooking}
                    className="w-full rounded-full bg-purple-600 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isBooking
                      ? page.bookingLoading
                      : interpolateTemplate(page.bookingAction, { price: service.price.toFixed(2) })}
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
