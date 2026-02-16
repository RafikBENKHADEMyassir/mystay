"use client";

import { AppLink } from "@/components/ui/app-link";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageSquare,
  ClipboardCheck,
  Clock,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
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

const quickActionIcons = {
  "clipboard-check": ClipboardCheck,
  "help-circle": HelpCircle,
  clock: Clock
} as const;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ReceptionPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);
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
    setSession(getDemoSession());
  }, []);

  async function loadTickets(activeSession = session) {
    if (!activeSession) return;

    setIsLoading(true);

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
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["reception"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate
  });

  async function submitRequest(type: string, title: string) {
    if (!session || !page || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(new URL("/api/v1/services/request", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          hotelId: session.hotelId,
          stayId: session.stayId,
          roomNumber: session.roomNumber,
          department: "reception",
          title,
          payload: { type }
        })
      });

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

  function handleAction(action: { href?: string; action?: string; requestTitle?: string }) {
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
          <p className="text-gray-500">{page.signInToAccess}</p>
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
      <div className="relative h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${page.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
          <AppLink
            href={withLocale(locale, "/services")}
            className="-ml-2 rounded-full bg-white/10 p-2 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </AppLink>
          <Leaf className="h-6 w-6 text-white/80" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">{page.title}</h1>
        </div>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-100 to-teal-200">
                <span className="text-2xl">🛎️</span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">{page.resumeConversation}</p>
              <p className="text-sm text-gray-500">{page.conversationPreview}</p>
            </div>

            <AppLink
              href={withLocale(locale, "/messages?department=reception")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </AppLink>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </div>

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

      <div className="flex-1 px-4 py-6">
        <div className="space-y-3">
          {page.quickActions.map((action) => {
            const Icon = quickActionIcons[action.icon as keyof typeof quickActionIcons] ?? HelpCircle;
            const isCheckIn = action.id === "check_in";

            if (isCheckIn && checkInComplete) {
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">{page.checkInComplete}</p>
                    <p className="text-xs text-green-600">
                      {interpolateTemplate(page.roomLabel, { roomNumber: session.roomNumber ?? "" })}
                    </p>
                  </div>
                  <span className="text-green-600">✓</span>
                </div>
              );
            }

            if (action.href) {
              return (
                <AppLink
                  key={action.id}
                  href={withLocale(locale, action.href)}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{action.label}</span>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </AppLink>
              );
            }

            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={isSubmitting}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-700">{action.label}</span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>

      {receptionTickets.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{page.activeRequests}</p>
            <button
              onClick={() => loadTickets()}
              disabled={isLoading}
              className="rounded-full p-1.5 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-2">
            {receptionTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  {ticket.title}
                </span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs",
                    ticket.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : ticket.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
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
    </div>
  );
}
