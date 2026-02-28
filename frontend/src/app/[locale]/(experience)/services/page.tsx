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
          headers: { Authorization: `Bearer ${session!.guestToken}` },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const notificationSlides = useMemo(() => {
    if (!page) return [];

    const slides: Array<{ badge: string; message: string; href?: string }> = [];

    const conciergeTicket = tickets.find(
      (t) => t.department === "concierge" && t.status !== "resolved"
    );
    if (conciergeTicket) {
      slides.push({
        badge: page.transportBadge,
        message: interpolateTemplate(page.transportBookedMessage, { time: "15:30" }),
        href: withLocale(locale, "/concierge"),
      });
    }

    if (slides.length === 0 && session) {
      slides.push({
        badge: page.welcomeBadge,
        message: interpolateTemplate(page.welcomeMessage, { hotelName: session.hotelName }),
      });
    }

    if (slides.length === 0) {
      slides.push({
        badge: page.checkInBadge,
        message: page.checkInMessage,
        href: withLocale(locale, "/reception/check-in"),
      });
    }

    return slides;
  }, [tickets, page, session, locale]);

  if (!page) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[90px]"
          style={{
            background:
              "linear-gradient(white 0%, rgba(255,255,255,0.75) 25%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.1) 80%, transparent 100%)",
          }}
        />
        <h1 className="relative text-xl font-normal tracking-[-0.2px] text-black">
          {page.title}
        </h1>
        <Leaf className="relative h-8 w-8 text-black/70" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md space-y-0 px-3 pb-24 pt-8 lg:max-w-lg">
        {/* Notification Card */}
        <div className="pb-8 px-0">
          <NotificationCard
            slides={notificationSlides}
            historyAriaLabel={page.historyAriaLabel}
          />
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-2 gap-3 px-1">
          {page.cards.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              href={withLocale(locale, service.href)}
              chatHref={withLocale(locale, service.chatHref)}
              iconImage={service.iconImage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
