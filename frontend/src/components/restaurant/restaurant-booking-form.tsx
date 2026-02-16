"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { AppLink } from "@/components/ui/app-link";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";

type Props = {
  restaurantName: string;
  experienceItemId: string;
  onClose: () => void;
  onBooked: (result: { ticketId: string; threadId: string; eventId: string }) => void;
  guestToken: string;
  /** Opening time e.g. "12:00" - parsed from restaurant config hours like "12:00 - 23:00" */
  openingTime?: string;
  /** Closing time e.g. "23:00" */
  closingTime?: string;
};

/** Parse an hour string like "12:00" into total minutes since midnight */
function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function generateTimeOptions(openingTime?: string, closingTime?: string) {
  // Parse bounds from props, default to 11:00 - 23:30
  const openMin = openingTime ? parseTimeToMinutes(openingTime) : 11 * 60;
  const closeMin = closingTime ? parseTimeToMinutes(closingTime) : 23 * 60 + 30;

  const options: string[] = [];
  for (let h = 0; h <= 23; h++) {
    for (const m of [0, 30]) {
      const totalMin = h * 60 + m;
      if (totalMin >= openMin && totalMin <= closeMin) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
  }
  return options;
}

function generateDateOptions(locale: string) {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const value = date.toISOString().slice(0, 10);
    const label =
      i === 0
        ? locale === "fr" ? "Aujourd'hui" : "Today"
        : i === 1
          ? locale === "fr" ? "Demain" : "Tomorrow"
          : date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
    options.push({ value, label });
  }
  return options;
}

export function RestaurantBookingForm({
  restaurantName,
  experienceItemId,
  onClose,
  onBooked,
  guestToken,
  openingTime,
  closingTime,
}: Props) {
  const locale = useLocale();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  const dateOptions = useMemo(() => generateDateOptions(locale), [locale]);
  const timeOptions = useMemo(() => generateTimeOptions(openingTime, closingTime), [openingTime, closingTime]);

  // Default time: pick the first available time slot at or after the current hour
  const defaultTime = useMemo(() => {
    if (timeOptions.length === 0) return "19:00";
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const firstFuture = timeOptions.find((t) => parseTimeToMinutes(t) >= nowMin);
    return firstFuture ?? timeOptions[0];
  }, [timeOptions]);

  const [date, setDate] = useState(dateOptions[0]?.value ?? "");
  const [time, setTime] = useState(defaultTime);
  const [guests, setGuests] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (guests < 1) {
      setError(locale === "fr" ? "Veuillez indiquer le nombre de personnes." : "Please specify the number of guests.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const resp = await fetch(`${apiBaseUrl}/api/v1/restaurant-bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          restaurantName,
          date,
          time,
          guests,
          specialRequests,
          experienceItemId,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || `Error ${resp.status}`);
      }

      const result = await resp.json();
      onBooked(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Derive available hours and minutes for the current selection
  const availableHours = useMemo(() => {
    const hours = [...new Set(timeOptions.map((t) => t.split(":")[0]))];
    return hours;
  }, [timeOptions]);

  const hourValue = time.split(":")[0] ?? "19";
  const minuteValue = time.split(":")[1] ?? "00";

  const availableMinutes = useMemo(() => {
    return timeOptions
      .filter((t) => t.startsWith(hourValue + ":"))
      .map((t) => t.split(":")[1]);
  }, [timeOptions, hourValue]);

  // When hour changes, snap minute to first available for that hour
  const handleHourChange = (newHour: string) => {
    const slotsForHour = timeOptions.filter((t) => t.startsWith(newHour + ":"));
    if (slotsForHour.length > 0) {
      setTime(slotsForHour[0]);
    } else {
      setTime(`${newHour}:00`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <button onClick={onClose} className="-ml-2 p-2">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {/* Title */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {locale === "fr" ? "Réserver une table à" : "Book a table at"}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-light uppercase tracking-widest text-gray-900">
            {restaurantName}
          </h1>
          {(openingTime || closingTime) && (
            <p className="mt-1 text-xs text-gray-400">
              {locale === "fr" ? "Ouvert de" : "Open"}{" "}
              {openingTime ?? "?"} – {closingTime ?? "?"}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="mt-8 flex items-center gap-4">
          <label className="w-16 text-sm text-gray-500">
            {locale === "fr" ? "Date :" : "Date:"}
          </label>
          <div className="relative flex-1">
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="mt-4 flex items-center gap-4">
          <label className="w-16 text-sm text-gray-500">
            {locale === "fr" ? "Pour :" : "Time:"}
          </label>
          <div className="flex items-center gap-2">
            <select
              value={hourValue}
              onChange={(e) => handleHourChange(e.target.value)}
              className="w-20 appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            >
              {availableHours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-gray-400">:</span>
            <select
              value={minuteValue}
              onChange={(e) => setTime(`${hourValue}:${e.target.value}`)}
              className="w-20 appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            >
              {availableMinutes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guests */}
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-sm text-gray-400">
              {locale === "fr" ? "Nombre de personnes" : "Number of guests"}
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(0, g - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-lg font-medium text-gray-900">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => g + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Special requests */}
        <div className="mt-6">
          <p className="mb-2 text-sm text-gray-500">
            {locale === "fr"
              ? "Vous avez des demandes spéciales ?"
              : "Any special requests?"}
          </p>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder={locale === "fr" ? "Votre demande" : "Your request"}
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            rows={3}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="border-t border-gray-100 px-6 py-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex h-[50px] w-full items-center justify-center rounded-[8px] bg-gray-900 text-base font-semibold text-white disabled:opacity-50 active:scale-[0.99]"
        >
          {submitting
            ? locale === "fr" ? "Réservation en cours..." : "Booking..."
            : locale === "fr" ? "Réserver" : "Book"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          {locale === "fr"
            ? "En réservant, vous acceptez les "
            : "By booking, you agree to the "}
          <AppLink
            href={withLocale(locale, "/terms")}
            className="underline"
          >
            {locale === "fr" ? "Conditions d'utilisation" : "Terms of use"}
          </AppLink>
          .
        </p>
      </div>
    </div>
  );
}
