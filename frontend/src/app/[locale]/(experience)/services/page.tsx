"use client";

import { useEffect, useMemo, useState } from "react";
import { Leaf } from "lucide-react";
import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { ServiceCard, NotificationCard } from "@/components/services";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { useTranslations } from "@/lib/i18n/translate";

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
    titleKey: "servicesPage.cards.concierge",
    href: "/concierge",
    chatHref: "/messages?department=concierge",
    background: "/images/services/concierge_background.png"
  },
  {
    id: "housekeeping",
    titleKey: "servicesPage.cards.housekeeping",
    href: "/housekeeping",
    chatHref: "/messages?department=housekeeping",
    background: "/images/services/housekeeping_background.png"
  },
  {
    id: "room_service",
    titleKey: "servicesPage.cards.roomService",
    href: "/room-service",
    chatHref: "/messages?department=room-service",
    background: "/images/services/roomservice_background.png"
  },
  {
    id: "reception",
    titleKey: "servicesPage.cards.reception",
    href: "/reception/check-in",
    chatHref: "/messages?department=reception",
    background: "/images/services/reception_background.png"
  },
  {
    id: "restaurant",
    titleKey: "servicesPage.cards.restaurant",
    href: "/restaurants",
    chatHref: "/messages?department=restaurants",
    background: "/images/services/restaurant_background.png"
  },
  {
    id: "spa_gym",
    titleKey: "servicesPage.cards.spaGym",
    href: "/spa-gym",
    chatHref: "/messages?department=spa-gym",
    background: "/images/services/spa_gym_background.png"
  }
] as const;

export default function ServicesPage() {
  const locale = useLocale();
  const t = useTranslations();
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
        badge: t("servicesPage.transportBadge"),
        message: t("servicesPage.transportBookedMessage", { time: "15:30" })
      };
    }
    return null;
  }, [tickets, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">{t("servicesPage.title")}</h1>
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
            badge={t("servicesPage.welcomeBadge")}
            message={t("servicesPage.welcomeMessage", { hotelName: session.hotelName })}
          />
        ) : (
          <NotificationCard
            badge={t("servicesPage.checkInBadge")}
            message={t("servicesPage.checkInMessage")}
            href={withLocale(locale, "/reception/check-in")}
          />
        )}

        {/* Service Cards */}
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              title={t(service.titleKey)}
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
