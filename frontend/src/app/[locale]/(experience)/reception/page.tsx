"use client";

import Link from "next/link";
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
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/images/services/reception_background.png";

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

// Quick actions
const quickActions = [
  {
    id: "check_in",
    labelFr: "Complétez votre check-in",
    labelEn: "Complete your check-in",
    icon: ClipboardCheck,
    href: "/reception/check-in"
  },
  {
    id: "info",
    labelFr: "Demander un renseignement",
    labelEn: "Request information",
    icon: HelpCircle,
    action: "info_request"
  },
  {
    id: "late_checkout",
    labelFr: "Late check-out",
    labelEn: "Late check-out",
    icon: Clock,
    action: "late_checkout"
  }
] as const;

export default function ReceptionPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
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

    // Check if check-in is already complete (has room number)
    if (session.roomNumber) {
      setCheckInComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  // Real-time updates
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

  // Submit a request
  async function submitRequest(type: string, title: string) {
    if (!session || isSubmitting) return;

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
        setError(locale === "fr" ? "Impossible d'envoyer la demande." : "Could not submit request.");
        return;
      }

      await loadTickets(session);
    } catch {
      setError(locale === "fr" ? "Service indisponible." : "Service unavailable.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle quick action click
  function handleAction(action: (typeof quickActions)[number]) {
    if ("href" in action && action.href) {
      // Navigation handled by Link
      return;
    }
    if ("action" in action && action.action) {
      const title =
        action.action === "late_checkout"
          ? locale === "fr"
            ? "Demande de late check-out"
            : "Late check-out request"
          : locale === "fr"
            ? "Demande de renseignement"
            : "Information request";
      void submitRequest(action.action, title);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={withLocale(locale, "/services")} className="-ml-2 p-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </Link>
          <div className="text-center">
            <p className="font-medium text-gray-900">{locale === "fr" ? "Réception" : "Reception"}</p>
          </div>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">
            {locale === "fr" ? "Connectez-vous pour accéder à la réception." : "Sign in to access reception."}
          </p>
          <Link
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            {locale === "fr" ? "Commencer le check-in" : "Start check-in"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      {/* Hero Header */}
      <div className="relative h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        {/* Topbar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
          <Link
            href={withLocale(locale, "/services")}
            className="-ml-2 rounded-full bg-white/10 p-2 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <Leaf className="h-6 w-6 text-white/80" />
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">
            {locale === "fr" ? "Réception" : "Reception"}
          </h1>
        </div>
      </div>

      {/* Staff Availability Card */}
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
              <p className="font-medium text-gray-900">
                {locale === "fr" ? "Reprenez votre discussion :" : "Resume your conversation:"}
              </p>
              <p className="text-sm text-gray-500">
                {locale === "fr"
                  ? "Ceci est un message d'exemple qui..."
                  : "This is an example message that..."}
              </p>
            </div>

            <Link
              href={withLocale(locale, "/messages?department=reception")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </Link>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </div>

          {/* Hours */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{locale === "fr" ? "Disponibilités" : "Availability"}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{locale === "fr" ? "De" : "From"}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">6h</span>
              <span className="text-gray-400">{locale === "fr" ? "à" : "to"}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">23h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isCheckIn = action.id === "check_in";

            // Show check-in completed state
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
                    <p className="text-sm font-medium text-green-800">
                      {locale === "fr" ? "Check-in complété" : "Check-in complete"}
                    </p>
                    <p className="text-xs text-green-600">
                      {locale === "fr" ? `Chambre ${session.roomNumber}` : `Room ${session.roomNumber}`}
                    </p>
                  </div>
                  <span className="text-green-600">✓</span>
                </div>
              );
            }

            if ("href" in action && action.href) {
              return (
                <Link
                  key={action.id}
                  href={withLocale(locale, action.href)}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">
                    {locale === "fr" ? action.labelFr : action.labelEn}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </Link>
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
                <span className="flex-1 text-left text-sm font-medium text-gray-700">
                  {locale === "fr" ? action.labelFr : action.labelEn}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>

      {/* Active Requests */}
      {receptionTickets.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              {locale === "fr" ? "Demandes en cours" : "Active requests"}
            </p>
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
                    ? locale === "fr"
                      ? "Terminé"
                      : "Done"
                    : ticket.status === "in_progress"
                      ? locale === "fr"
                        ? "En cours"
                        : "In progress"
                      : locale === "fr"
                        ? "En attente"
                        : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
