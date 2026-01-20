"use client";

import Link from "next/link";
import { ClipboardCheck, ConciergeBell, MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceCatalog } from "@/components/services";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";

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

export default function ConciergePage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conciergeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "concierge"),
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
      if (!response.ok) {
        setError("Could not load requests.");
        return;
      }

      const data = (await response.json()) as { items?: Ticket[] };
      setTickets(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then refresh.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const handleRequestSubmitted = () => {
    void loadTickets(session);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pending",
      in_progress: "Working on it",
      resolved: "Completed"
    };
    return statusMap[status] || status.replace("_", " ");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Concierge"
        description="Your personal assistant for reservations, transportation, and special requests."
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? <Badge variant="outline">Room {session.roomNumber}</Badge> : null}
              <Button size="sm" variant="outline" asChild>
                <Link href={withLocale(locale, "/messages")}>Open Chat</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={withLocale(locale, "/reception/check-in")}>Change reservation</Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link href={withLocale(locale, "/reception/check-in")}>Start check-in</Link>
            </Button>
          )
        }
      />

      {!session ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect a stay</CardTitle>
            <CardDescription>Start from digital check-in to access concierge services.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Service Catalog */}
      {session ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ConciergeBell className="h-4 w-4 text-primary" />
              <CardTitle>Concierge Services</CardTitle>
            </div>
            <CardDescription>
              Request transportation, restaurant reservations, tickets, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceCatalog
              hotelId={session.hotelId}
              department="concierge"
              guestToken={session.guestToken}
              stayId={session.stayId}
              roomNumber={session.roomNumber}
              onRequestSubmitted={handleRequestSubmitted}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Active Requests */}
      {session ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Your Requests</CardTitle>
                <CardDescription>Track your concierge requests.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => loadTickets()} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {!isLoading && conciergeTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No concierge requests yet.</p>
            ) : null}
            <ul className="space-y-2">
              {conciergeTickets.map((ticket) => (
                <li key={ticket.id} className="rounded-lg border bg-card px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{ticket.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.id} · {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        ticket.status === "resolved" ? "default" : 
                        ticket.status === "in_progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <CardTitle>What we can help with</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Airport and city transfers</li>
              <li>Restaurant reservations</li>
              <li>Event and show tickets</li>
              <li>Tours and excursions</li>
              <li>Special occasions and celebrations</li>
              <li>Local recommendations</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <CardTitle>Direct Messaging</CardTitle>
            </div>
            <CardDescription>Chat with our concierge team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              For complex requests or special arrangements, our concierge team is available 
              via direct message. We support multiple languages and typically respond within minutes.
            </p>
            {session && (
              <Button variant="outline" asChild className="w-full">
                <Link href={withLocale(locale, "/messages")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Start a Conversation
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
