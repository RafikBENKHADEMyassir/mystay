"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { cn } from "@/lib/utils";

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

const PRODUCT_IMAGE_POSITIONS: Record<
  string,
  { left: string; top: string; width: string; height: string }
> = {
  flowers: {
    left: "-4.11%",
    top: "-18.59%",
    width: "236.43%",
    height: "260.09%",
  },
  champagne: {
    left: "-127.93%",
    top: "-10.25%",
    width: "239.6%",
    height: "241.79%",
  },
  letter: {
    left: "6.71%",
    top: "-173.1%",
    width: "235.23%",
    height: "295.44%",
  },
  magazine: {
    left: "-83.66%",
    top: "-160.26%",
    width: "189.99%",
    height: "278.14%",
  },
};

function ProductImage({
  itemId,
  className,
}: {
  itemId: string;
  className?: string;
}) {
  const pos = PRODUCT_IMAGE_POSITIONS[itemId];
  if (!pos) return null;

  return (
    <div
      className={cn(
        "relative h-[60px] w-[60px] shrink-0 overflow-hidden bg-white",
        className
      )}
    >
      <div
        className="absolute"
        style={{
          left: pos.left,
          top: pos.top,
          width: pos.width,
          height: pos.height,
        }}
      >
        <Image
          src="/images/reception/product-illustration.png"
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

export default function ReceptionPage() {
  const locale = useLocale();
  const { overview, token: overviewToken } = useGuestOverview();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const hotelId = session?.hotelId ?? overview?.hotel.id ?? null;
  const { content } = useGuestContent(locale, hotelId);
  const page = content?.pages.reception;
  const common = content?.common;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInComplete, setCheckInComplete] = useState(false);

  const receptionTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "reception"),
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
        roomNumber: overview.stay.roomNumber,
      });
    }
  }, [overview, overviewToken]);

  async function loadTickets(activeSession = session) {
    if (!activeSession) return;

    setIsLoading(true);

    try {
      const url = new URL("/api/v1/tickets", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` },
      });
      if (response.ok) {
        const data = (await response.json()) as { items?: Ticket[] };
        setTickets(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadTickets(session);

    if (session.roomNumber) {
      setCheckInComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const handleRealtimeUpdate = useCallback(() => {
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["reception"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate,
  });

  async function submitRequest(type: string, title: string) {
    if (!session || !page || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        new URL("/api/v1/services/request", apiBaseUrl).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.guestToken}`,
          },
          body: JSON.stringify({
            hotelId: session.hotelId,
            stayId: session.stayId,
            roomNumber: session.roomNumber,
            department: "reception",
            title,
            payload: { type },
          }),
        }
      );

      if (!response.ok) {
        setError(page.errors.submitRequest);
        return;
      }

      await loadTickets(session);
    } catch {
      setError(page.errors.serviceUnavailable);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAction(action: {
    href?: string;
    action?: string;
    requestTitle?: string;
  }) {
    if (action.href) return;
    if (!action.action || !action.requestTitle) return;

    void submitRequest(action.action, action.requestTitle);
  }

  if (!page || !common) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
          <AppLink href={withLocale(locale, "/services")} className="p-2">
            <Image
              src="/images/housekeeping/arrow-back.svg"
              alt="Back"
              width={26}
              height={26}
              unoptimized
            />
          </AppLink>
          <p className="text-[16px] font-medium text-black">{page.title}</p>
          <Image
            src="/images/housekeeping/logo.svg"
            alt=""
            width={32}
            height={32}
            unoptimized
          />
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
      {/* Hero — 260px with dark overlay */}
      <div className="relative h-[260px] overflow-hidden">
        <Image
          src="/images/reception/hero-background.png"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Top bar — absolute over hero */}
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
            <Image
              src="/images/housekeeping/arrow-back.svg"
              alt="Back"
              width={26}
              height={26}
              unoptimized
            />
          </AppLink>
          <Image
            src="/images/housekeeping/logo.svg"
            alt=""
            width={32}
            height={32}
            unoptimized
          />
        </div>
      </div>

      {/* Title — centered over hero at top 104px */}
      <div className="pointer-events-none absolute left-0 right-0 top-[104px] flex items-center justify-center">
        <h1
          className="text-[28px] font-light tracking-[1.12px] text-white"
          style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.5)" }}
        >
          {page.title}
        </h1>
      </div>

      {/* Content overlapping hero by -24px */}
      <div className="-mt-[24px] relative z-10 pb-[120px]">
        {/* Chat card */}
        <div className="px-[16px]">
          <AppLink
            href={withLocale(locale, "/messages?department=reception")}
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
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-black">{page.resumeConversation}</p>
              <p className="truncate text-[14px] text-black/50">
                {page.conversationPreview}
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/images/housekeeping/chevron-right.svg"
                alt=""
                width={18}
                height={12}
                unoptimized
              />
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
                <span className="text-[15px] text-black">
                  {common.availabilityCard.from}
                </span>
                <span className="rounded-[5px] border border-black/10 px-[6px] py-[2px] text-[15px] text-black">
                  {common.availabilityCard.openingFrom}
                </span>
                <span className="text-[15px] text-black">
                  {common.availabilityCard.to}
                </span>
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

        {/* Check-in CTA card */}
        {!checkInComplete && (
          <div className="px-[12px]">
            <AppLink
              href={withLocale(locale, "/reception/check-in")}
              className="flex items-center gap-[12px] rounded-[6px] border border-[rgba(0,0,0,0.35)] px-[12px] py-[12px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%), linear-gradient(102.863deg, rgba(0,0,0,0) 37.295%, rgba(0,0,0,0.024) 53.483%, rgba(0,0,0,0.1) 69.671%, rgba(0,0,0,0.067) 80.774%, rgba(0,0,0,0) 91.254%), linear-gradient(90deg, rgb(255,255,255) 0%, rgb(255,255,255) 100%)",
              }}
            >
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full backdrop-blur-[6px] bg-white/65 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)]">
                <Image
                  src="/images/reception/check-in.svg"
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-black">
                  {content?.pages.room?.completeCheckIn}
                </p>
                <p className="text-[14px] text-black/50">
                  Profitez au maximum de votre séjour
                </p>
              </div>
              <div className="shrink-0">
                <Image
                  src="/images/reception/chevron-right.svg"
                  alt=""
                  width={5}
                  height={10}
                  unoptimized
                />
              </div>
            </AppLink>
          </div>
        )}

        {checkInComplete && (
          <div className="px-[12px]">
            <div className="flex items-center gap-[12px] rounded-[6px] border border-green-200 bg-green-50 px-[12px] py-[12px]">
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-green-100">
                <Image
                  src="/images/reception/check-in.svg"
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-green-800">
                  {page.checkInComplete}
                </p>
                <p className="text-[14px] text-green-600">
                  {interpolateTemplate(page.roomLabel, {
                    roomNumber: session.roomNumber ?? "",
                  })}
                </p>
              </div>
              <span className="text-green-600">✓</span>
            </div>
          </div>
        )}

        {/* Plaisirs sur mesure */}
        {content?.pages.room?.upsells && content.pages.room.upsells.length > 0 && (
          <>
            <div className="pt-[32px] pb-[16px] px-[16px]">
              <h2 className="text-[22px] font-medium text-black">
                {content.pages.room.tailored}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-[8px] px-[16px]">
              {content.pages.room.upsells.map((upsell) => (
                <button
                  key={upsell.id}
                  className="relative flex flex-col items-center rounded-[6px] border border-black/[0.06] bg-white px-[28px] pb-[24px] pt-[16px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]"
                >
                  <ProductImage itemId={upsell.id} />
                  <span className="mt-2 text-center text-[16px] font-light text-black">
                    {upsell.title}
                  </span>
                  <div className="absolute right-[4px] top-[4px] h-[24px] w-[24px]">
                    <Image
                      src="/images/reception/add-circle.svg"
                      alt={`Add ${upsell.title}`}
                      width={24}
                      height={24}
                      unoptimized
                    />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Quick action links */}
        <div className="pt-[24px] px-[12px]">
          <div className="space-y-[8px] rounded-[6px] border border-black/[0.06] p-[12px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]">
            {page.quickActions
              .filter((a) => a.id !== "check_in")
              .map((action) => {
                if (action.href) {
                  return (
                    <AppLink
                      key={action.id}
                      href={withLocale(locale, action.href)}
                      className="flex items-center gap-[12px] rounded-[6px] border border-black/10 p-[12px]"
                    >
                      <span className="flex-1 text-[15px] text-black">
                        {action.label}
                      </span>
                      <Image
                        src="/images/reception/chevron-right.svg"
                        alt=""
                        width={5}
                        height={10}
                        unoptimized
                      />
                    </AppLink>
                  );
                }
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={isSubmitting}
                    className="flex w-full items-center gap-[12px] rounded-[6px] border border-black/10 p-[12px] disabled:opacity-50"
                  >
                    <span className="flex-1 text-left text-[15px] text-black">
                      {action.label}
                    </span>
                    <Image
                      src="/images/reception/chevron-right.svg"
                      alt=""
                      width={5}
                      height={10}
                      unoptimized
                    />
                  </button>
                );
              })}
          </div>
        </div>

        {/* Active requests */}
        {receptionTickets.length > 0 && (
          <div className="px-[16px] pt-[24px]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-black/40">
                {page.activeRequests}
              </p>
              <button
                onClick={() => loadTickets()}
                disabled={isLoading}
                className="rounded-full p-1.5 hover:bg-black/[0.04]"
              >
                <RefreshCw
                  className={`h-4 w-4 text-black/30 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="space-y-2">
              {receptionTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 rounded-[10px] bg-black/[0.02] px-4 py-3"
                >
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

        {error && (
          <p className="px-4 pt-4 text-center text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
