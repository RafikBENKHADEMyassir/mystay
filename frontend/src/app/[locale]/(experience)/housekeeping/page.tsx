"use client";

import { AppLink } from "@/components/ui/app-link";
import { ChevronLeft, ChevronRight, Leaf, RefreshCw, Sparkles, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { MessageComposer } from "@/components/chat/message-composer";
import { getDemoSession } from "@/lib/demo-session";
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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function HousekeepingPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.housekeeping;
  const common = content?.common;
  const threadStrings = content?.pages.messages.thread;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cleaningEnabled, setCleaningEnabled] = useState(true);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const housekeepingTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "housekeeping"),
    [tickets]
  );

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

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
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["housekeeping"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate
  });

  async function submitQuickRequest(itemId: string) {
    if (!session || !page || isSending) return;

    const item = page.quickItems.find((entry) => entry.id === itemId);
    if (!item) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(new URL("/api/v1/services/request", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          hotelId: session.hotelId,
          stayId: session.stayId,
          roomNumber: session.roomNumber,
          department: "housekeeping",
          title: item.label,
          payload: { itemId, quantity: 1 }
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
      setIsSending(false);
    }
  }

  async function sendMessage() {
    if (!session || !page || !draft.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(new URL("/api/v1/services/request", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          hotelId: session.hotelId,
          stayId: session.stayId,
          roomNumber: session.roomNumber,
          department: "housekeeping",
          title: draft.trim().slice(0, 50),
          payload: { message: draft.trim() }
        })
      });

      if (!response.ok) {
        setError(page.errors.sendMessage);
        return;
      }

      setDraft("");
      await loadTickets(session);
    } catch {
      setError(page.errors.serviceUnavailable);
    } finally {
      setIsSending(false);
    }
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
    <div className="flex min-h-screen flex-col bg-white">
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
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">{common.availabilityCard.currentlyAvailableTo}</p>
              <p className="text-sm text-gray-500">{common.availabilityCard.chat}</p>
            </div>

            <AppLink
              href={withLocale(locale, "/messages?department=housekeeping")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </AppLink>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{common.availabilityCard.availability}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{common.availabilityCard.from}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{common.availabilityCard.openingFrom}</span>
              <span className="text-gray-400">{common.availabilityCard.to}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{common.availabilityCard.openingTo}</span>
              <ChevronRight className="h-4 w-4 rotate-90 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Cleaning Toggle */}
      <div className="px-4 py-6">
        <div className="rounded-[6px] border border-black/[0.06] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-gray-700">{page.cleaningPrompt}</p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setCleaningEnabled(false)}
              className={cn(
                "flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                !cleaningEnabled
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-gray-500"
              )}
            >
              {page.noLabel}
            </button>
            <button
              onClick={() => setCleaningEnabled(true)}
              className={cn(
                "flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                cleaningEnabled
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-gray-500"
              )}
            >
              {page.yesLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Requests */}
      <div className="px-4 pb-6">
        <h2 className="mb-4 text-lg font-medium text-black">{page.quickRequestsTitle}</h2>

        <div className="grid grid-cols-2 gap-3">
          {page.quickItems.map((item) => (
            <div
              key={item.id}
              className="relative rounded-[6px] border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
            >
              <button
                onClick={() => submitQuickRequest(item.id)}
                disabled={isSending}
                className="flex w-full flex-col items-center gap-2 px-4 pb-4 pt-6 disabled:opacity-50"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-[13px] font-light text-black">{item.label}</span>
              </button>
              <button
                onClick={() => submitQuickRequest(item.id)}
                disabled={isSending}
                className="absolute -right-1.5 -top-1.5 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-black/10 bg-white shadow-sm disabled:opacity-50"
                aria-label={`Add ${item.label}`}
              >
                <span className="text-sm font-light text-black">+</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {housekeepingTickets.length > 0 && (
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
            {housekeepingTickets.map((ticket) => (
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

      {error && <p className="px-4 text-center text-sm text-red-500">{error}</p>}

      <div className="sticky bottom-0 mt-auto border-t bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-md">
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={sendMessage}
            disabled={isSending}
            placeholder={page.composerPlaceholder}
            labels={
              threadStrings
                ? {
                    removeAttachmentAria: threadStrings.removeAttachmentAria,
                    addAttachmentAria: threadStrings.addAttachmentAria,
                    quickActionAria: threadStrings.quickActionAria,
                    sendAria: threadStrings.sendAria,
                    writePlaceholder: threadStrings.writePlaceholder
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
