"use client";

import Link from "next/link";
import { Brush, CheckSquare, Clock3, RefreshCw } from "lucide-react";
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

export default function HousekeepingPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      if (!response.ok) {
        setError("Could not load tickets.");
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
    // Reload tickets after a new request is submitted
    void loadTickets(session);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Housekeeping"
        description="Manage cleaning preferences, quick item requests, and service statuses."
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? <Badge variant="outline">Room {session.roomNumber}</Badge> : null}
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
            <CardDescription>Start from digital check-in to load your stay context.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Service Catalog */}
      {session ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brush className="h-4 w-4 text-primary" />
              <CardTitle>Request Services</CardTitle>
            </div>
            <CardDescription>
              Select a service below to make a request. Our team will respond promptly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceCatalog
              hotelId={session.hotelId}
              department="housekeeping"
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
                <CardDescription>Track the status of your housekeeping requests.</CardDescription>
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
            {!isLoading && housekeepingTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No housekeeping requests yet.</p>
            ) : null}
            <ul className="space-y-2">
              {housekeepingTickets.map((ticket) => (
                <li key={ticket.id} className="rounded-lg border bg-card px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{ticket.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.id} · {ticket.status.replace("_", " ")} · updated{" "}
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        ticket.status === "resolved" ? "default" : 
                        ticket.status === "in_progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <CardTitle>How it works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Select a service from the catalog above to make a request.</li>
              <li>Fill in the required details like quantity, time, or type.</li>
              <li>Track your request status: Pending → In Progress → Resolved.</li>
              <li>For special requests, use the message option to contact our team.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>Typical service fulfillment estimates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Clock3 className="h-4 w-4" />
              <span>Quick Items</span>
            </div>
            <p>Towels, pillows, amenities: ~15 minutes</p>
            <div className="flex items-center gap-2 text-foreground">
              <Clock3 className="h-4 w-4" />
              <span>Room Cleaning</span>
            </div>
            <p>Full cleaning service: ~45 minutes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
