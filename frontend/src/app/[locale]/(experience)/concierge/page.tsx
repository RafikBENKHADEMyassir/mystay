"use client";

/* eslint-disable @next/next/no-img-element */
import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageCircle,
  ArrowRight,
  SmilePlus
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useExperienceSections } from "@/lib/hooks/use-experience-sections";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { RestaurantBottomSheet } from "@/components/restaurant/restaurant-bottom-sheet";
import { RestaurantBookingForm } from "@/components/restaurant/restaurant-booking-form";
import type { ExperienceItem } from "@/types/overview";

type Ticket = {
  id: string;
  stayId: string | null;
  hotelId: string;
  roomNumber: string | null;
  department: string;
  status: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Thread = {
  id: string;
  department: string;
  status: string;
  title: string;
};

type RestaurantConfig = {
  coverImage?: string;
  description?: string;
  hours?: string;
  dishes?: Array<{ id: string; image: string; caption?: string }>;
  menuSections?: Array<{
    id: string;
    title: string;
    price?: string;
    items?: Array<{ name: string; price?: string }>;
    subsections?: Array<{
      id: string;
      title: string;
      items?: Array<{ name: string; price?: string }>;
      linkText?: string;
      linkTarget?: string;
    }>;
  }>;
};

const QUICK_ACTION_ICONS: Record<string, string> = {
  restaurant: "/images/concierge/restaurant.png",
  transport: "/images/concierge/transport.png",
  ticket: "/images/concierge/ticket.png",
  airport: "/images/concierge/airport.png",
  activities: "/images/concierge/activities.png",
};

const VISIBLE_DEPARTMENTS = ["concierge", "restaurants"];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ConciergePage() {
  const router = useRouter();
  const locale = useLocale();
  const { overview, token: overviewToken } = useGuestOverview();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const hotelId = session?.hotelId ?? overview?.hotel.id ?? null;
  const { content } = useGuestContent(locale, hotelId);
  const page = content?.pages.concierge;
  const common = content?.common;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sections } = useExperienceSections(hotelId ?? undefined);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ExperienceItem | null>(null);
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const restaurantItems = useMemo(() => {
    return sections
      .flatMap((s) => s.items)
      .filter((item) => item.type === "restaurant");
  }, [sections]);

  const serviceTickets = useMemo(
    () => tickets.filter((ticket) => VISIBLE_DEPARTMENTS.includes(ticket.department)),
    [tickets]
  );

  useEffect(() => {
    const demo = getDemoSession();
    if (demo) {
      setSession(demo);
    } else if (overview && overviewToken) {
      setSession({
        hotelId: overview.hotel.id,
        hotelName: overview.hotel.name,
        stayId: overview.stay.id,
        confirmationNumber: overview.stay.confirmationNumber,
        guestToken: overviewToken,
        roomNumber: overview.stay.roomNumber
      });
    }
  }, [overview, overviewToken]);

  async function loadTickets(activeSession = session) {
    if (!activeSession) return;

    try {
      const url = new URL("/api/v1/tickets", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });
      if (response.ok) {
        const data = (await response.json()) as { items?: Ticket[] };
        setTickets(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // Silent fail
    }
  }

  async function loadThread(activeSession = session) {
    if (!activeSession) return;

    try {
      const threadsUrl = new URL("/api/v1/threads", apiBaseUrl);
      threadsUrl.searchParams.set("stayId", activeSession.stayId);

      const threadsRes = await fetch(threadsUrl.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });

      if (threadsRes.ok) {
        const data = (await threadsRes.json()) as { items?: Thread[] };
        const conciergeThread = data.items?.find((entry) => entry.department === "concierge");
        if (conciergeThread) {
          setThread(conciergeThread);
        }
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    if (!session) return;
    setIsLoading(true);
    Promise.all([loadTickets(session), loadThread(session)]).finally(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const handleRealtimeMessage = useCallback(() => {
    void loadTickets(session);
  }, [session]);

  useRealtimeMessages({
    threadId: thread?.id,
    token: session?.guestToken,
    enabled: !!thread && !!session,
    onMessage: handleRealtimeMessage
  });

  // Auto-hide booking success toast
  useEffect(() => {
    if (!bookingSuccess) return;
    const timer = setTimeout(() => setBookingSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [bookingSuccess]);

  async function sendMessage(initialMessage?: string) {
    if (!session || !page) return;

    const bodyText = (initialMessage ?? draft).trim();
    if (!bodyText || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      let currentThread = thread;

      if (!currentThread) {
        const createRes = await fetch(new URL("/api/v1/threads", apiBaseUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
          body: JSON.stringify({
            hotelId: session.hotelId,
            stayId: session.stayId,
            department: "concierge",
            title: page.title,
            initialMessage: bodyText
          })
        });

        if (!createRes.ok) {
          setError(page.errors.createConversation);
          return;
        }

        const created = (await createRes.json()) as Thread;
        setThread(created);
        currentThread = created;
        setDraft("");
        return;
      }

      const response = await fetch(
        new URL(`/api/v1/threads/${encodeURIComponent(currentThread.id)}/messages`, apiBaseUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
          body: JSON.stringify({ bodyText })
        }
      );

      if (!response.ok) {
        setError(page.errors.sendMessage);
        return;
      }

      setDraft("");
    } catch {
      setError(page.errors.serviceUnavailable);
    } finally {
      setIsSending(false);
    }
  }

  function handleQuickAction(actionId: string) {
    if (!page) return;
    const action = page.quickActions.find((entry) => entry.id === actionId);
    if (!action) return;

    if (actionId === "restaurant" && restaurantItems.length > 0) {
      setShowRestaurantPicker(true);
      return;
    }

    if (action.href) {
      router.push(withLocale(locale, action.href));
      return;
    }

    void sendMessage(action.label);
  }

  function handleRestaurantSelect(item: ExperienceItem) {
    setShowRestaurantPicker(false);
    setSelectedRestaurant(item);
    setShowBookingForm(false);
  }

  function handleRestaurantBook() {
    setShowBookingForm(true);
  }

  function handleRestaurantClose() {
    setSelectedRestaurant(null);
    setShowBookingForm(false);
  }

  function handleBooked() {
    setBookingSuccess(true);
    setShowBookingForm(false);
    setSelectedRestaurant(null);
    void loadTickets(session);
  }

  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("/uploads/") ? `${apiBaseUrl}${url}` : url;
  };

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
          <p className="text-gray-500">{common.signInToAccessServices}</p>
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

  const selectedConfig = (selectedRestaurant?.restaurantConfig ?? {}) as RestaurantConfig;
  const selectedHoursStr = typeof selectedConfig.hours === "string" ? selectedConfig.hours : "";
  const [selectedOpeningTime, selectedClosingTime] = selectedHoursStr.includes("-")
    ? selectedHoursStr.split("-").map((s: string) => s.trim())
    : [undefined, undefined];

  return (
    <div className="relative min-h-screen bg-white">
      <div className="flex flex-col pb-[120px]">
        {/* Hero Image */}
        <div className="relative h-[260px] w-full shrink-0 overflow-clip" style={{ marginBottom: "-24px" }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${page.heroImage})`, left: "-11.36%" }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content below hero */}
        <div className="relative flex flex-col" style={{ marginBottom: "-24px" }}>
          {/* Availability Card */}
          <div className="px-4">
            <AppLink
              href={withLocale(locale, "/messages?department=concierge")}
              className="flex items-center gap-3 rounded-[6px] border border-black/10 bg-white px-4 py-3 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]"
            >
              <MessageCircle className="h-[33px] w-[33px] shrink-0 text-black/60" strokeWidth={1.2} />
              <div className="flex flex-1 items-center gap-4">
                <p className="flex-1 text-[15px] font-normal leading-[1.2] text-black">
                  {common.availabilityCard.currentlyAvailableTo}
                </p>
                <ChevronRight className="h-3 w-3 shrink-0 text-black/30" />
              </div>
            </AppLink>
          </div>

          {/* Disponibilites */}
          <div className="px-4 pt-2">
            <div className="flex items-center justify-between overflow-clip rounded-lg px-2 py-2">
              <span className="text-[15px] font-medium text-black/50">
                {common.availabilityCard.availability}
              </span>
              <div className="flex items-center gap-[5px]">
                <div className="flex items-baseline gap-[5px]">
                  <span className="text-[15px] text-black">{common.availabilityCard.from}</span>
                  <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-[15px] text-black">
                    {common.availabilityCard.openingFrom}
                  </span>
                </div>
                <div className="flex items-baseline gap-[5px]">
                  <span className="text-[15px] text-black">{common.availabilityCard.to}</span>
                  <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-[15px] text-black">
                    {common.availabilityCard.openingTo}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 rotate-90 text-black/30" />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center justify-center px-12 py-6">
            <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
          </div>

          {/* Active Tickets (Demandes en cours) */}
          {serviceTickets.length > 0 && (
            <div className="px-3">
              <div className="overflow-clip rounded-[6px] border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                {serviceTickets.map((ticket, idx) => (
                  <div key={ticket.id}>
                    {idx > 0 && (
                      <div className="mx-3 h-px bg-black/[0.06]" />
                    )}
                    <div className="flex flex-col gap-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[15px] text-black">
                          {ticket.title}
                        </span>
                        <ChevronRight className="h-3 w-3 text-black/30" />
                      </div>
                      <p className="text-[15px] leading-[1.15] text-black/50">
                        {ticket.status === "in_progress"
                          ? page.ticketStatus.inProgress
                          : ticket.status === "resolved"
                            ? page.ticketStatus.resolved
                            : page.ticketStatus.pending}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Tip Section */}
          {serviceTickets.length > 0 && (
            <div className="px-3 pt-4">
              <div className="flex flex-col gap-3 rounded-[6px] border border-black/[0.06] bg-white px-3 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                <p className="text-center text-[15px] leading-[1.15] text-black">
                  {page.tipPrompt ?? "Remerciez le personnel pour ses services"}
                </p>
                <button
                  className="flex items-center justify-center gap-2.5 rounded-[6px] border border-black/35 px-3 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%), linear-gradient(110deg, rgba(0,0,0,0) 37%, rgba(0,0,0,0.024) 53%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.067) 81%, rgba(0,0,0,0) 91%), linear-gradient(90deg, #fff 0%, #fff 100%)"
                  }}
                >
                  <SmilePlus className="h-5 w-5 text-black/70" strokeWidth={1.5} />
                  <span className="text-[15px] text-black">
                    {page.leaveTip ?? "Laisser un pourboire"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Separator before quick actions */}
          {serviceTickets.length > 0 && (
            <div className="flex items-center justify-center px-12 py-6">
              <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
            </div>
          )}

          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 gap-2 px-4">
            {page.quickActions.map((action) => {
              const iconSrc = QUICK_ACTION_ICONS[action.id];
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isSending}
                  className="flex flex-col items-center justify-center gap-3 rounded-[6px] border border-black/[0.06] bg-white px-2 pb-6 pt-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="relative h-[60px] w-[60px] overflow-clip bg-white">
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt={action.label}
                        fill
                        className="object-contain"
                        sizes="120px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ChevronRight className="h-5 w-5 text-black/40" />
                      </div>
                    )}
                  </div>
                  <span className="text-center text-[16px] font-light leading-[1.15] text-black">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-4 text-center text-[13px] text-red-500">{error}</p>}
        </div>
      </div>

      {/* Sticky topbar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0">
        <div className="pointer-events-auto flex items-center justify-between py-2.5 pl-2 pr-4">
          <div
            className="absolute left-0 right-0 top-0 h-[90px]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.376) 25%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 79.808%, rgba(0,0,0,0) 100%)"
            }}
          />
          <AppLink
            href={withLocale(locale, "/services")}
            className="relative z-10 flex h-9 items-center justify-center rounded-lg p-2"
          >
            <ChevronLeft className="h-[26px] w-[26px] text-white" strokeWidth={1.5} />
          </AppLink>
          <Leaf className="relative z-10 h-8 w-8 text-white/80" />
        </div>
      </div>

      {/* Title over hero */}
      <div className="pointer-events-none absolute left-0 right-0 top-[104px]">
        <div className="flex h-[52px] items-center justify-center">
          <h1
            className="text-[28px] font-light leading-[1.15] tracking-[1.12px] text-white"
            style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.5)" }}
          >
            {page.title}
          </h1>
        </div>
      </div>

      {/* Bottom message bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div
          className="absolute bottom-0 left-0 right-0 h-[80px]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.9) 32%, rgb(255,255,255) 50.481%, rgb(255,255,255) 100%)"
          }}
        />
        <div className="relative flex items-center gap-2 px-3 pb-2">
          <div className="flex h-[38px] flex-1 items-center overflow-clip rounded-full border border-black/10 bg-[#f5f5f5] px-4">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={locale === "fr" ? "Écrire un message" : "Write a message"}
              disabled={isSending}
              className="flex-1 bg-transparent text-[16px] text-black placeholder:text-black/50 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={isSending || !draft.trim()}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-black/80 transition disabled:opacity-30"
          >
            <ArrowRight className="h-5 w-5 text-white" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Restaurant Picker Bottom Sheet */}
      {showRestaurantPicker && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRestaurantPicker(false)} />
          <div className="relative mt-auto flex max-h-[85vh] flex-col rounded-t-[20px] bg-white animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <button onClick={() => setShowRestaurantPicker(false)} className="rounded-full p-1">
                <ChevronLeft className="h-5 w-5 text-black/70" />
              </button>
              <h2 className="text-[17px] font-medium text-black">
                {page.quickActions.find((a) => a.id === "restaurant")?.label ?? "Réserver un restaurant"}
              </h2>
              <div className="w-7" />
            </div>

            {/* Horizontal carousel of restaurant cards */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-2">
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
                {restaurantItems.map((item) => {
                  const imgUrl = resolveImageUrl(item.imageUrl);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleRestaurantSelect(item)}
                      className="relative h-[220px] w-[160px] flex-shrink-0 snap-start overflow-hidden rounded-[14px] bg-muted/40 shadow-sm text-left"
                      style={{
                        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <p className="absolute bottom-3 left-3 right-3 text-[15px] font-semibold uppercase leading-tight tracking-[0.08em] text-white">
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>
              {restaurantItems.length === 0 && (
                <p className="py-8 text-center text-[15px] text-black/50">
                  {locale === "fr" ? "Aucun restaurant disponible" : "No restaurants available"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Detail Bottom Sheet */}
      {selectedRestaurant && !showBookingForm && (
        <RestaurantBottomSheet
          item={selectedRestaurant}
          onBook={handleRestaurantBook}
          onClose={handleRestaurantClose}
        />
      )}

      {/* Restaurant Booking Form */}
      {selectedRestaurant && showBookingForm && session?.guestToken && (
        <RestaurantBookingForm
          restaurantName={selectedRestaurant.label}
          experienceItemId={selectedRestaurant.id}
          onClose={() => setShowBookingForm(false)}
          onBooked={handleBooked}
          guestToken={session.guestToken}
          openingTime={selectedOpeningTime}
          closingTime={selectedClosingTime}
        />
      )}

      {/* Booking success toast */}
      {bookingSuccess && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
            {locale === "fr"
              ? "Votre réservation a été envoyée ! Consultez vos messages pour le suivi."
              : "Your booking request has been sent! Check your messages for updates."}
          </div>
        </div>
      )}
    </div>
  );
}
