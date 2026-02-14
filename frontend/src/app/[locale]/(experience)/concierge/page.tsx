"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageSquare,
  RefreshCw,
  Smile,
  Car,
  Ticket,
  MapPin,
  Plane,
  UtensilsCrossed
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";

const HERO_IMAGE = "/images/services/concierge_background.png";

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

// Quick action definitions
const quickActions = [
  { id: "restaurant", labelFr: "Réserver un restaurant", labelEn: "Book a restaurant", icon: UtensilsCrossed },
  { id: "transport", labelFr: "Organiser un transport", labelEn: "Arrange transport", icon: Car },
  { id: "ticket", labelFr: "Réserver un billet (spectacle, musée, événement)", labelEn: "Book tickets (show, museum, event)", icon: Ticket },
  { id: "airport", labelFr: "Organiser un transfert aéroport", labelEn: "Arrange airport transfer", icon: Plane },
  { id: "activities", labelFr: "Demander des recommandations d'activités", labelEn: "Request activity recommendations", icon: MapPin }
] as const;

export default function ConciergePage() {
  const router = useRouter();
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
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
    setSession(getDemoSession());
  }, []);

  // Load tickets
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

  // Load or create concierge thread
  async function loadThread(activeSession = session) {
    if (!activeSession) return;

    try {
      // First try to find existing concierge thread
      const threadsUrl = new URL("/api/v1/threads", apiBaseUrl);
      threadsUrl.searchParams.set("stayId", activeSession.stayId);

      const threadsRes = await fetch(threadsUrl.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });

      if (threadsRes.ok) {
        const data = (await threadsRes.json()) as { items?: Thread[] };
        const conciergeThread = data.items?.find((t) => t.department === "concierge");

        if (conciergeThread) {
          setThread(conciergeThread);
          await loadMessages(conciergeThread.id, activeSession);
          return;
        }
      }
    } catch {
      // Silent fail
    }
  }

  // Load messages for thread
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

  // Real-time message updates
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

  // Create thread and send message
  async function sendMessage(initialMessage?: string) {
    if (!session) return;

    const bodyText = (initialMessage ?? draft).trim();
    if (!bodyText || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      let currentThread = thread;

      // Create thread if doesn't exist
      if (!currentThread) {
        const createRes = await fetch(new URL("/api/v1/threads", apiBaseUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
          body: JSON.stringify({
            hotelId: session.hotelId,
            stayId: session.stayId,
            department: "concierge",
            title: "Concierge",
            initialMessage: bodyText
          })
        });

        if (!createRes.ok) {
          setError(locale === "fr" ? "Impossible de créer la conversation." : "Could not create conversation.");
          return;
        }

        const created = (await createRes.json()) as Thread;
        setThread(created);
        currentThread = created;
        setDraft("");
        await loadMessages(created.id, session);
        return;
      }

      // Send message to existing thread
      const response = await fetch(
        new URL(`/api/v1/threads/${encodeURIComponent(currentThread.id)}/messages`, apiBaseUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
          body: JSON.stringify({
            bodyText
          })
        }
      );

      if (!response.ok) {
        setError(locale === "fr" ? "Impossible d'envoyer le message." : "Could not send message.");
        return;
      }

      setDraft("");
      await loadMessages(currentThread.id, session);
    } catch {
      setError(locale === "fr" ? "Service indisponible." : "Service unavailable.");
    } finally {
      setIsSending(false);
    }
  }

  // Handle quick action click
  function handleQuickAction(actionId: string) {
    const action = quickActions.find((a) => a.id === actionId);
    if (!action) return;

    const message = locale === "fr" ? action.labelFr : action.labelEn;
    void sendMessage(message);
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={withLocale(locale, "/services")} className="-ml-2 p-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </Link>
          <div className="text-center">
            <p className="font-medium text-gray-900">Concierge</p>
          </div>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">
            {locale === "fr" ? "Connectez-vous pour accéder aux services." : "Sign in to access services."}
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
    <div className="flex min-h-screen flex-col bg-white">
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
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">Concierge</h1>
        </div>
      </div>

      {/* Staff Availability Card */}
      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
                <span className="text-lg font-medium text-amber-800">M</span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {locale === "fr" ? "Actuellement disponible pour" : "Currently available to"}
              </p>
              <p className="text-sm text-gray-500">{locale === "fr" ? "échanger." : "chat."}</p>
            </div>

            <ChevronRight className="h-5 w-5 text-gray-300" />
          </div>

          {/* Availability hours */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{locale === "fr" ? "Disponibilités" : "Availability"}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{locale === "fr" ? "De" : "From"}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">6h</span>
              <span className="text-gray-400">{locale === "fr" ? "à" : "to"}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">23h</span>
              <ChevronRight className="h-4 w-4 rotate-90 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section (if thread exists) */}
      {thread && messages.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              {locale === "fr" ? "Reprenez votre discussion :" : "Resume your conversation:"}
            </p>
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
                />
              );
            })}
          </div>

          {/* View full thread */}
          <Link
            href={withLocale(locale, `/messages/${thread.id}`)}
            className="mt-3 block text-center text-sm text-amber-600 hover:underline"
          >
            {locale === "fr" ? "Voir la conversation complète" : "View full conversation"}
          </Link>
        </div>
      )}

      {/* Active Tickets */}
      {conciergeTickets.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
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
                    ? locale === "fr"
                      ? "Le concierge est en train de traiter votre demande."
                      : "The concierge is processing your request."
                    : ticket.status === "resolved"
                      ? locale === "fr"
                        ? "Demande terminée."
                        : "Request completed."
                      : locale === "fr"
                        ? "En attente."
                        : "Pending."}
                </p>
              </div>
            ))}
          </div>

          {/* Tipping prompt */}
          {conciergeTickets.some((t) => t.status === "resolved") && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm text-gray-600">
                {locale === "fr" ? "Remerciez votre concierge pour ses services" : "Thank your concierge for their service"}
              </p>
              <button className="mt-2 inline-flex items-center gap-2 text-amber-600">
                <Smile className="h-4 w-4" />
                <span className="text-sm">{locale === "fr" ? "Laisser un pourboire" : "Leave a tip"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={isSending}
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="text-sm text-gray-700">
                {locale === "fr" ? action.labelFr : action.labelEn}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
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
            placeholder={locale === "fr" ? "Écrire au concierge..." : "Write to concierge..."}
          />
        </div>
      </div>
    </div>
  );
}
