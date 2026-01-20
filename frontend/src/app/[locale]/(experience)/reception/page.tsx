"use client";

import Link from "next/link";
import { Clock, CreditCard, FileText, LogOut as CheckOut, RefreshCw, Desk } from "lucide-react";
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

export default function ReceptionPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      in_progress: "Processing",
      resolved: "Completed"
    };
    return statusMap[status] || status.replace("_", " ");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reception"
        description="Manage your check-in, check-out, and stay details."
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
            <CardDescription>Start from digital check-in to access reception services.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Current Stay Info */}
      {session ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Stay</CardTitle>
            <CardDescription>Room {session.roomNumber || "Not assigned"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hotel</span>
              <span className="font-medium">{session.hotelName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room</span>
              <span className="font-medium">{session.roomNumber || "Pending assignment"}</span>
            </div>
            <Badge className="mt-2">Check-in Complete</Badge>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Actions */}
      {session ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="h-16 flex items-center gap-3 justify-start px-4">
            <Clock className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Late Check-out</p>
              <p className="text-xs text-muted-foreground">Extend your departure</p>
            </div>
          </Button>

          <Button variant="outline" className="h-16 flex items-center gap-3 justify-start px-4">
            <FileText className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">View Invoice</p>
              <p className="text-xs text-muted-foreground">Check your charges</p>
            </div>
          </Button>

          <Button variant="outline" className="h-16 flex items-center gap-3 justify-start px-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Payment Methods</p>
              <p className="text-xs text-muted-foreground">Manage your cards</p>
            </div>
          </Button>

          <Button className="h-16 flex items-center gap-3 justify-start px-4">
            <CheckOut className="h-5 w-5" />
            <div className="text-left">
              <p className="font-medium text-sm">Digital Check-out</p>
              <p className="text-xs opacity-90">Start check-out process</p>
            </div>
          </Button>
        </div>
      ) : null}

      {/* Service Catalog */}
      {session ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Desk className="h-4 w-4 text-primary" />
              <CardTitle>Reception Services</CardTitle>
            </div>
            <CardDescription>
              Request room changes, extensions, or other reception services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceCatalog
              hotelId={session.hotelId}
              department="reception"
              guestToken={session.guestToken}
              stayId={session.stayId}
              roomNumber={session.roomNumber}
              onRequestSubmitted={handleRequestSubmitted}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Active Requests */}
      {session && receptionTickets.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Your Requests</CardTitle>
                <CardDescription>Track your reception requests.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => loadTickets()} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <ul className="space-y-2">
              {receptionTickets.map((ticket) => (
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
    </div>
  );
}
