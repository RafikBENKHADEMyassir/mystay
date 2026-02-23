"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CleaningService = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
  timeSlots: string[];
  availabilityWeekdays: string[];
};

type Props = {
  hotelId: string;
  stayId?: string | null;
  guestName: string;
  guestToken: string;
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const weekdayMap: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

const dayLabels: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mer",
  thu: "Jeu",
  fri: "Ven",
  sat: "Sam",
  sun: "Dim",
};

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function getNextDays(count: number, availableWeekdays: string[]): Date[] {
  const days: Date[] = [];
  const today = new Date();
  let offset = 0;

  while (days.length < count && offset < 30) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const wd = weekdayMap[date.getDay()];
    if (availableWeekdays.length === 0 || availableWeekdays.includes(wd)) {
      days.push(date);
    }
    offset++;
  }
  return days;
}

function formatDateISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type BookingState = "form" | "loading" | "success";

export function CleaningBookingSheet({ hotelId, stayId, guestName, guestToken, onClose }: Props) {
  const [service, setService] = useState<CleaningService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [bookingState, setBookingState] = useState<BookingState>("form");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/hotels/${hotelId}/cleaning/service`);
        if (!res.ok) return;
        const data = await res.json();
        setService(data.service);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [hotelId]);

  const availableDays = useMemo(() => {
    if (!service) return [];
    return getNextDays(6, service.availabilityWeekdays);
  }, [service]);

  useEffect(() => {
    if (availableDays.length > 0 && !selectedDate) {
      setSelectedDate(availableDays[0]);
    }
  }, [availableDays, selectedDate]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  const handleBook = useCallback(async () => {
    if (!service || !selectedDate || !selectedSlot) return;

    setBookingState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/v1/hotels/${hotelId}/cleaning/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          serviceId: service.id,
          bookingDate: formatDateISO(selectedDate),
          timeSlot: selectedSlot,
        }),
      });
      if (res.ok) {
        setBookingState("success");
      } else {
        setBookingState("form");
      }
    } catch {
      setBookingState("form");
    }
  }, [service, selectedDate, selectedSlot, hotelId, guestToken]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" data-testid="cleaning-booking-sheet">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative z-[101] mt-auto flex max-h-[92vh] flex-col rounded-t-[20px] bg-white transition-transform duration-300 ease-out",
          isClosing ? "translate-y-full" : "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="h-1 w-9 rounded-full bg-gray-300" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        )}

        {!isLoading && !service && (
          <p className="py-16 text-center text-sm text-gray-400">
            Service non disponible.
          </p>
        )}

        {!isLoading && service && bookingState === "success" && (
          <SuccessView onClose={handleClose} />
        )}

        {!isLoading && service && bookingState !== "success" && (
          <div className="flex-1 overflow-y-auto" data-testid="cleaning-booking-form">
            {/* Header image */}
            {service.imageUrl && (
              <div className="relative mx-5 mt-1 h-40 overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={service.imageUrl}
                  alt={service.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Title + description */}
            <div className="px-5 pt-4 pb-2 text-center">
              <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
              {service.description && (
                <p className="mt-1.5 text-[13px] leading-tight text-gray-400">
                  {service.description}
                </p>
              )}
            </div>

            {/* Day picker */}
            <div className="px-5 pt-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Sélectionnez le jour</p>
              <div className="flex gap-2" data-testid="cleaning-day-picker">
                {availableDays.map((day) => {
                  const iso = formatDateISO(day);
                  const selected = selectedDate && formatDateISO(selectedDate) === iso;
                  const wd = weekdayMap[day.getDay()];
                  const label = dayLabels[wd] ?? wd;

                  return (
                    <button
                      key={iso}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                      data-testid={`cleaning-day-${iso}`}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border px-3 py-2 min-w-[52px] transition-colors",
                        selected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      )}
                    >
                      <span className="text-lg font-semibold leading-tight">{day.getDate()}</span>
                      <span className="text-[11px] leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slot picker */}
            <div className="px-5 pt-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Sélectionnez votre créneau</p>
              <div className="grid grid-cols-2 gap-2.5" data-testid="cleaning-slot-picker">
                {service.timeSlots.map((slot) => {
                  const selected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      data-testid={`cleaning-slot-${slot.replace(/\s/g, "")}`}
                      className={cn(
                        "rounded-full border py-2.5 px-4 text-sm font-medium transition-colors",
                        selected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div className="mx-5 mt-6 flex items-center justify-between border-t border-gray-100 py-4">
              <span className="text-sm text-gray-500">Prix</span>
              <span className="text-xl font-semibold text-gray-900" data-testid="cleaning-price">
                {formatPrice(service.priceCents, service.currency)}
              </span>
            </div>

            {/* Book button */}
            <div className="px-5 pb-3">
              <button
                onClick={handleBook}
                disabled={!selectedDate || !selectedSlot || bookingState === "loading"}
                data-testid="cleaning-book-btn"
                className={cn(
                  "w-full rounded-lg py-3.5 text-sm font-semibold transition-colors",
                  selectedDate && selectedSlot && bookingState !== "loading"
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {bookingState === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Réservation...
                  </span>
                ) : (
                  "Réserver"
                )}
              </button>
            </div>

            {/* Terms */}
            <p className="px-5 pb-6 text-center text-[11px] text-gray-400">
              En réservant, vous acceptez les{" "}
              <span className="underline">Conditions d&apos;utilisation</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12" data-testid="cleaning-booking-success">
      {/* Check icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500">
        <Check className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-gray-900">Parfait !</h2>
      <p className="mt-1 text-base text-gray-900">Votre session a été réservée.</p>

      <p className="mt-3 text-center text-[13px] leading-tight text-gray-400">
        Vous pouvez consulter ou modifier à tout moment auprès de nous ou dans l&apos;agenda.
      </p>

      <button
        onClick={onClose}
        data-testid="cleaning-booking-done"
        className="mt-8 w-full rounded-lg border border-gray-200 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        C&apos;est compris
      </button>
    </div>
  );
}
