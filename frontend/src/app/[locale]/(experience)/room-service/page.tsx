"use client";

import Link from "next/link";
import { Clock3, CookingPot, RefreshCw, UtensilsCrossed } from "lucide-react";
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

export default function RoomServicePage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomServiceTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "room-service"),
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
        setError("Could not load orders.");
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
      pending: "Order Received",
      in_progress: "Being Prepared",
      resolved: "Delivered"
    };
    return statusMap[status] || status.replace("_", " ");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Room Service"
        description="Order meals, snacks, and beverages delivered to your room."
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
            <CardDescription>Start from digital check-in to access room service.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Menu / Service Catalog */}
      {session ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <CardTitle>Menu</CardTitle>
            </div>
            <CardDescription>
              Browse our menu and place your order. Delivery time depends on kitchen load.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceCatalog
              hotelId={session.hotelId}
              department="room-service"
              guestToken={session.guestToken}
              stayId={session.stayId}
              roomNumber={session.roomNumber}
              onRequestSubmitted={handleRequestSubmitted}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Active Orders */}
      {session ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>Track your room service orders in real-time.</CardDescription>
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
            {!isLoading && roomServiceTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No room service orders yet.</p>
            ) : null}
            <ul className="space-y-2">
              {roomServiceTickets.map((ticket) => (
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
              <CookingPot className="h-4 w-4 text-primary" />
              <CardTitle>How it works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Browse our menu and select items you&apos;d like to order.</li>
              <li>Customize your order with quantities and special requests.</li>
              <li>Track your order: Received → Being Prepared → Delivered.</li>
              <li>Payment will be added to your room folio.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <CardTitle>Service Hours</CardTitle>
            </div>
            <CardDescription>Room service availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Breakfast</span>
                <span className="font-medium text-foreground">6:30 AM - 11:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span>All-Day Dining</span>
                <span className="font-medium text-foreground">11:00 AM - 11:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Night Menu</span>
                <span className="font-medium text-foreground">11:00 PM - 6:30 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
