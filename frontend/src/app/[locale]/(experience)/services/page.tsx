"use client";

import { useEffect, useMemo, useState } from "react";
import { Leaf } from "lucide-react";
import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { ServiceCard, NotificationCard } from "@/components/services";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";

type Ticket = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  updatedAt: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Service definitions with background images
const services = [
  {
    id: "concierge",
    titleFr: "Concierge",
    titleEn: "Concierge",
    href: "/concierge",
    chatHref: "/messages",
    background: "/images/services/concierge_background.png"
  },
  {
    id: "housekeeping",
    titleFr: "Housekeeping",
    titleEn: "Housekeeping",
    href: "/housekeeping",
    chatHref: "/messages",
    background: "/images/services/housekeeping_background.png"
  },
  {
    id: "room_service",
    titleFr: "Room Service",
    titleEn: "Room Service",
    href: "/room-service",
    chatHref: "/messages",
    background: "/images/services/roomservice_background.png"
  },
  {
    id: "reception",
    titleFr: "Réception",
    titleEn: "Reception",
    href: "/reception/check-in",
    chatHref: "/messages",
    background: "/images/services/reception_background.png"
  },
  {
    id: "restaurant",
    titleFr: "Restaurant",
    titleEn: "Restaurant",
    href: "/restaurants",
    chatHref: "/messages",
    background: "/images/services/restaurant_background.png"
  },
  {
    id: "spa_gym",
    titleFr: "Spa & Gym",
    titleEn: "Spa & Gym",
    href: "/spa-gym",
    chatHref: "/messages",
    background: "/images/services/spa_gym_background.png"
  }
] as const;

export default function ServicesPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  useEffect(() => {
    if (!session) return;

    async function loadTickets() {
      try {
        const url = new URL("/api/v1/tickets", apiBaseUrl);
        url.searchParams.set("stayId", session!.stayId);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${session!.guestToken}` }
        });
        if (response.ok) {
          const data = (await response.json()) as { items?: Ticket[] };
          setTickets(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        // Silent fail
      }
    }

    void loadTickets();
  }, [session?.stayId]);

  // Find active transport/concierge ticket for notification
  const activeNotification = useMemo(() => {
    const conciergeTicket = tickets.find(
      (t) => t.department === "concierge" && t.status !== "resolved"
    );
    if (conciergeTicket) {
      return {
        badge: "Transport",
        message:
          locale === "fr"
            ? `Votre trajet a été réservé pour 15:30.`
            : `Your ride has been booked for 15:30.`
      };
    }
    return null;
  }, [tickets, locale]);

  const strings = useMemo(
    () => ({
      title: locale === "fr" ? "Services" : "Services"
    }),
    [locale]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">{strings.title}</h1>
        <Leaf className="h-6 w-6 text-gray-400" />
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4">
        {/* Notification Card */}
        {activeNotification ? (
          <NotificationCard
            badge={activeNotification.badge}
            message={activeNotification.message}
            href={withLocale(locale, "/concierge")}
          />
        ) : session ? (
          <NotificationCard
            badge={locale === "fr" ? "Bienvenue" : "Welcome"}
            message={
              locale === "fr"
                ? `Bienvenue ${session.hotelName}. Comment pouvons-nous vous aider ?`
                : `Welcome to ${session.hotelName}. How can we help you?`
            }
          />
        ) : (
          <NotificationCard
            badge={locale === "fr" ? "Check-in" : "Check-in"}
            message={
              locale === "fr"
                ? "Effectuez votre check-in pour accéder à tous les services."
                : "Complete your check-in to access all services."
            }
            href={withLocale(locale, "/reception/check-in")}
          />
        )}

        {/* Service Cards */}
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              title={locale === "fr" ? service.titleFr : service.titleEn}
              href={withLocale(locale, service.href)}
              chatHref={withLocale(locale, service.chatHref)}
              backgroundImage={service.background}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
