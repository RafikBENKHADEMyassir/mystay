"use client";

import { AppLink } from "@/components/ui/app-link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  RefreshCw,
  Smile
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";

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

type Message = {
  id: string;
  threadId: string;
  senderType: string;
  senderName: string | null;
  bodyText: string;
  createdAt: string;
};

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
  const threadStrings = content?.pages.messages.thread;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conciergeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "concierge"),
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
          await loadMessages(conciergeThread.id, activeSession);
        }
      }
    } catch {
      // Silent fail
    }
  }

  async function loadMessages(threadId: string, activeSession = session) {
    if (!activeSession) return;

    try {
      const url = new URL(`/api/v1/threads/${encodeURIComponent(threadId)}/messages`, apiBaseUrl);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });

      if (response.ok) {
        const data = (await response.json()) as { items?: Message[] };
        setMessages(Array.isArray(data.items) ? data.items : []);
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
    if (thread) {
      void loadMessages(thread.id, session);
    }
  }, [thread?.id, session]);

  useRealtimeMessages({
    threadId: thread?.id,
    token: session?.guestToken,
    enabled: !!thread && !!session,
    onMessage: handleRealtimeMessage
  });

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
        await loadMessages(created.id, session);
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
      await loadMessages(currentThread.id, session);
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

    if (action.href) {
      router.push(withLocale(locale, action.href));
      return;
    }

    void sendMessage(action.label);
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero Header */}
      <div className="relative h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${page.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        {/* Topbar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
          <AppLink
            href={withLocale(locale, "/services")}
            className="-ml-2 rounded-full bg-white/10 p-2 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </AppLink>
          <Leaf className="h-6 w-6 text-white/80" />
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">{page.title}</h1>
        </div>
      </div>

      {/* Staff Availability Card */}
      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
                <span className="text-lg font-medium text-amber-800">{page.title.slice(0, 1).toUpperCase()}</span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">{common.availabilityCard.currentlyAvailableTo}</p>
              <p className="text-sm text-gray-500">{common.availabilityCard.chat}</p>
            </div>

            <ChevronRight className="h-5 w-5 text-gray-300" />
          </div>

          {/* Availability hours */}
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

      {/* Chat Section (if thread exists) */}
      {thread && messages.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{page.resumeConversation}</p>
            <button
              onClick={() => router.push(withLocale(locale, `/messages/${thread.id}`))}
              className="rounded-full p-1.5 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Last messages preview */}
          <div className="space-y-2">
            {messages.slice(-2).map((message) => {
              const isGuest = message.senderType === "guest";
              return (
                <MessageBubble
                  key={message.id}
                  variant={isGuest ? "outgoing" : "incoming"}
                  body={message.bodyText}
                  timestamp={new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                  compact
                  labels={
                    threadStrings
                      ? {
                          sendErrorHint: threadStrings.sendErrorHint,
                          translateAction: threadStrings.translateAction
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>

          {/* View full thread */}
          <AppLink
            href={withLocale(locale, `/messages/${thread.id}`)}
            className="mt-3 block text-center text-sm text-amber-600 hover:underline"
          >
            {page.viewFullConversation}
          </AppLink>
        </div>
      )}

      {/* Active Tickets */}
      {conciergeTickets.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
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

          <div className="space-y-3">
            {conciergeTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    {ticket.title}
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {ticket.status === "in_progress"
                    ? page.ticketStatus.inProgress
                    : ticket.status === "resolved"
                      ? page.ticketStatus.resolved
                      : page.ticketStatus.pending}
                </p>
              </div>
            ))}
          </div>

          {/* Tipping prompt */}
          {conciergeTickets.some((ticket) => ticket.status === "resolved") && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm text-gray-600">{page.tipPrompt}</p>
              <button className="mt-2 inline-flex items-center gap-2 text-amber-600">
                <Smile className="h-4 w-4" />
                <span className="text-sm">{page.leaveTip}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions (2-col grid of icon cards) */}
      <div className="flex-1 px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {page.quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={isSending}
              className="flex flex-col items-center gap-3 rounded-[6px] border border-black/[0.06] bg-white px-3 pb-5 pt-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="text-2xl">
                {action.id === "restaurant" ? "🍽️" : action.id === "transport" ? "🚗" : action.id === "ticket" ? "🎟️" : action.id === "airport" ? "✈️" : action.id === "activities" ? "🗺️" : "💬"}
              </span>
              <span className="text-[13px] font-light leading-tight text-black">{action.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>

      {/* Message Composer */}
      <div className="sticky bottom-0 border-t bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-md">
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={() => sendMessage()}
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
