"use client";

import { useEffect, useMemo, useState } from "react";
import { Leaf } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { ServiceCard, NotificationCard } from "@/components/services";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
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

export default function ServicesPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { content } = useGuestContent(locale, session?.hotelId);

  const page = content?.pages.services;

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
    if (!page) return null;

    const conciergeTicket = tickets.find(
      (t) => t.department === "concierge" && t.status !== "resolved"
    );
    if (conciergeTicket) {
      return {
        badge: page.transportBadge,
        message: interpolateTemplate(page.transportBookedMessage, { time: "15:30" })
      };
    }
    return null;
  }, [tickets, page]);

  if (!page) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">{page.title}</h1>
        <Leaf className="h-6 w-6 text-gray-400" />
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4">
        {/* Notification Card */}
        {activeNotification ? (
          <NotificationCard
            badge={activeNotification.badge}
            message={activeNotification.message}
            href={withLocale(locale, "/concierge")}
            historyAriaLabel={page.historyAriaLabel}
          />
        ) : session ? (
          <NotificationCard
            badge={page.welcomeBadge}
            message={interpolateTemplate(page.welcomeMessage, { hotelName: session.hotelName })}
            historyAriaLabel={page.historyAriaLabel}
          />
        ) : (
          <NotificationCard
            badge={page.checkInBadge}
            message={page.checkInMessage}
            href={withLocale(locale, "/reception/check-in")}
            historyAriaLabel={page.historyAriaLabel}
          />
        )}

        {/* Service Cards */}
        <div className="space-y-3">
          {page.cards.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              href={withLocale(locale, service.href)}
              chatHref={withLocale(locale, service.chatHref)}
              backgroundImage={service.backgroundImage}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
