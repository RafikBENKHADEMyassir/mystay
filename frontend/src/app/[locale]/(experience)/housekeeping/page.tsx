"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { cn } from "@/lib/utils";
import { CleaningBookingSheet } from "@/components/cleaning/cleaning-booking-sheet";
import { QuickRequestSheet } from "@/components/housekeeping/quick-request-sheet";

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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const ITEM_IMAGE_POSITIONS: Record<string, { left: string; right: string; top: string }> = {
  shampoo: { left: "-67.5%", right: "-220.2%", top: "calc(50% + 42.32px)" },
  pillows: { left: "-158.68%", right: "-57.02%", top: "calc(50% + 33.58px)" },
  toilet_paper: { left: "-56.97%", right: "-202.39%", top: "calc(50% - 25.3px)" },
  towels: { left: "-160.97%", right: "-58.59%", top: "calc(50% - 24.79px)" },
};

function ProductImage({ itemId, className }: { itemId: string; className?: string }) {
  const pos = ITEM_IMAGE_POSITIONS[itemId];
  if (!pos) return null;

  return (
    <div className={cn("relative h-[60px] w-[60px] shrink-0 overflow-hidden bg-white", className)}>
      <div
        className="absolute"
        style={{
          aspectRatio: "1536/1024",
          left: pos.left,
          right: pos.right,
          top: pos.top,
          transform: "translateY(-50%)",
        }}
      >
        <Image
          src="/images/housekeeping/items-photo.png"
          alt=""
          fill
          className="max-w-none object-cover pointer-events-none"
          sizes="240px"
          unoptimized
        />
      </div>
    </div>
  );
}

export default function HousekeepingPage() {
  const locale = useLocale();
  const { overview, token: overviewToken } = useGuestOverview();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const hotelId = session?.hotelId ?? overview?.hotel.id ?? null;
  const { content } = useGuestContent(locale, hotelId);
  const page = content?.pages.housekeeping;
  const common = content?.common;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cleaningAnswer, setCleaningAnswer] = useState<"no" | "yes">("no");
  const [showCleaningSheet, setShowCleaningSheet] = useState(false);
  const [requestItem, setRequestItem] = useState<{ id: string; label: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const housekeepingTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "housekeeping"),
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

    setIsLoading(true);
    setError(null);

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
      if (page) {
        setError(page.errors.serviceUnavailable);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const handleRealtimeUpdate = useCallback(() => {
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["housekeeping"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate
  });

  async function handleQuickRequestSubmit(itemId: string, quantity: number, notes: string) {
    if (!session || !page) return;

    const item = page.quickItems.find((entry) => entry.id === itemId);
    if (!item) return;

    const response = await fetch(new URL("/api/v1/services/request", apiBaseUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
      body: JSON.stringify({
        hotelId: session.hotelId,
        stayId: session.stayId,
        roomNumber: session.roomNumber,
        department: "housekeeping",
        title: item.label,
        payload: { itemId, quantity, notes: notes || undefined }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to submit request");
    }

    await loadTickets(session);
  }

  if (!page || !common) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
          <AppLink href={withLocale(locale, "/services")} className="p-2">
            <Image src="/images/housekeeping/arrow-back.svg" alt="Back" width={26} height={26} unoptimized />
          </AppLink>
          <p className="text-[16px] font-medium text-black">{page.title}</p>
          <Image src="/images/housekeeping/logo.svg" alt="" width={32} height={32} unoptimized />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-black/40">{page.signInToAccess}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Hero — 260px with negative margin overlap for the card below */}
      <div className="relative h-[260px] overflow-hidden">
        <Image
          src="/images/housekeeping/hero-background.png"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Top bar — sticky over the hero */}
      <div className="pointer-events-none absolute left-0 right-0 top-0">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-[10px] pr-4"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.376) 25%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 79.808%, rgba(0,0,0,0) 100%)",
          }}
        >
          <AppLink
            href={withLocale(locale, "/services")}
            className="flex h-[36px] items-center justify-center rounded-[8px] p-[8px]"
          >
            <Image src="/images/housekeeping/arrow-back.svg" alt="Back" width={26} height={26} unoptimized />
          </AppLink>
          <Image src="/images/housekeeping/logo.svg" alt="" width={32} height={32} unoptimized />
        </div>
      </div>

      {/* Title — centered over the hero */}
      <div className="pointer-events-none absolute left-0 right-0 top-[104px] flex items-center justify-center">
        <h1
          className="text-[28px] font-light tracking-[1.12px] text-white"
          style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.5)" }}
        >
          {page.title}
        </h1>
      </div>

      {/* Content overlapping the hero */}
      <div className="-mt-[24px] relative z-10 pb-[120px]">
        {/* Chat availability card */}
        <div className="px-[16px]">
          <AppLink
            href={withLocale(locale, "/messages?department=housekeeping")}
            className="flex items-center gap-[12px] rounded-[6px] border border-black/10 bg-white px-[16px] py-[12px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]"
          >
            <div className="relative h-[33px] w-[33px] shrink-0">
              <Image
                src="/images/housekeeping/message-circle.svg"
                alt=""
                width={33}
                height={33}
                unoptimized
              />
            </div>
            <div className="flex flex-1 items-center gap-[16px]">
              <p className="flex-1 text-[15px] text-black">
                {common.availabilityCard.currentlyAvailableTo}
              </p>
              <div className="shrink-0">
                <Image
                  src="/images/housekeeping/chevron-right.svg"
                  alt=""
                  width={18}
                  height={12}
                  unoptimized
                />
              </div>
            </div>
          </AppLink>
        </div>

        {/* Availability accordion */}
        <div className="px-[16px] pt-[8px]">
          <div className="overflow-hidden rounded-[8px] px-[8px]">
            <button className="relative flex w-full items-center gap-[6px] overflow-hidden rounded-[8px] py-[8px]">
              <span className="text-[15px] font-medium text-black/50">
                {common.availabilityCard.availability}
              </span>
              <div className="ml-auto flex items-center gap-[5px]">
                <span className="text-[15px] text-black">{common.availabilityCard.from}</span>
                <span className="rounded-[5px] border border-black/10 px-[6px] py-[2px] text-[15px] text-black">
                  {common.availabilityCard.openingFrom}
                </span>
                <span className="text-[15px] text-black">{common.availabilityCard.to}</span>
                <span className="rounded-[5px] border border-black/10 px-[6px] py-[2px] text-[15px] text-black">
                  {common.availabilityCard.openingTo}
                </span>
              </div>
              <div className="absolute right-[-5px] top-1/2 h-[24px] w-[24px] -translate-y-1/2">
                <Image
                  src="/images/housekeeping/accordion-toggle.svg"
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                />
              </div>
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center px-[48px] py-[24px]">
          <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* Cleaning toggle card */}
        <div className="px-[16px] pb-[32px]">
          <div className="rounded-[6px] border border-black/[0.06] bg-white px-[12px] py-[16px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]">
            <p className="text-[15px] font-medium leading-[1.25] text-black">
              {page.cleaningPrompt}
            </p>
            <div className="mt-[16px] flex w-full items-center rounded-[10px] bg-[#f5f5f5] p-[4px]">
              <button
                onClick={() => setCleaningAnswer("no")}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-[6px] px-[16px] py-[8px] text-[15px] transition-colors",
                  cleaningAnswer === "no"
                    ? "border border-black bg-black font-medium text-white"
                    : "font-normal text-black"
                )}
              >
                {page.noLabel}
              </button>
              <button
                onClick={() => {
                  setCleaningAnswer("yes");
                  setShowCleaningSheet(true);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-[6px] px-[16px] py-[8px] text-[15px] transition-colors",
                  cleaningAnswer === "yes"
                    ? "border border-black bg-black font-medium text-white"
                    : "font-normal text-black"
                )}
              >
                {page.yesLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Quick requests title */}
        <div className="px-[16px] pb-[16px]">
          <h2 className="text-[22px] font-medium text-black">
            {page.quickRequestsTitle}
          </h2>
        </div>

        {/* Quick request cards — 2×2 grid */}
        <div className="grid grid-cols-2 gap-[8px] px-[16px]">
          {page.quickItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setRequestItem({ id: item.id, label: item.label })}
              disabled={isSending}
              className="relative flex flex-col items-center justify-center gap-[12px] rounded-[6px] border border-black/[0.06] bg-white px-[28px] pb-[24px] pt-[16px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)] disabled:opacity-50"
            >
              <ProductImage itemId={item.id} />
              <span className="text-[16px] font-light text-black">
                {item.label}
              </span>
              {/* Circle plus icon */}
              <div className="absolute right-[4px] top-[4px] h-[24px] w-[24px]">
                <Image
                  src="/images/housekeeping/circle-plus.svg"
                  alt={`Add ${item.label}`}
                  width={24}
                  height={24}
                  unoptimized
                />
              </div>
            </button>
          ))}
        </div>

        {/* Separator after quick requests */}
        <div className="flex items-center justify-center px-[48px] py-[24px]">
          <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* Active requests */}
        {housekeepingTickets.length > 0 && (
          <div className="px-[16px]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-black/40">{page.activeRequests}</p>
              <button
                onClick={() => loadTickets()}
                disabled={isLoading}
                className="rounded-full p-1.5 hover:bg-black/[0.04]"
              >
                <RefreshCw className={`h-4 w-4 text-black/30 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-2">
              {housekeepingTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 rounded-[10px] bg-black/[0.02] px-4 py-3">
                  <span className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] font-medium text-black/70">
                    {ticket.title}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[11px]",
                      ticket.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : ticket.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-black/[0.05] text-black/50"
                    )}
                  >
                    {ticket.status === "resolved"
                      ? page.ticketStatus.resolved
                      : ticket.status === "in_progress"
                        ? page.ticketStatus.inProgress
                        : page.ticketStatus.pending}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="px-4 pt-4 text-center text-sm text-red-500">{error}</p>}
      </div>

      {/* Cleaning Booking Sheet */}
      {showCleaningSheet && session && (
        <CleaningBookingSheet
          hotelId={session.hotelId}
          stayId={session.stayId}
          guestName="Guest"
          guestToken={session.guestToken}
          onClose={() => {
            setShowCleaningSheet(false);
            void loadTickets(session);
          }}
        />
      )}

      {/* Quick Request Sheet */}
      {requestItem && (
        <QuickRequestSheet
          itemId={requestItem.id}
          itemLabel={requestItem.label}
          onClose={() => setRequestItem(null)}
          onSubmit={handleQuickRequestSubmit}
        />
      )}
    </div>
  );
}
