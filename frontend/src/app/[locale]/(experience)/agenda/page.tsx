"use client";

import Link from "next/link";
import { Bell, CalendarRange, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";

type EventItem = {
  id: string;
  type: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function AgendaPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  async function loadEvents(activeSession = session) {
    if (!activeSession) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/v1/events", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });
      if (!response.ok) {
        setError("Could not load agenda.");
        return;
      }

      const data = (await response.json()) as { items?: EventItem[] };
      setEvents(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then refresh.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadEvents(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Agenda"
        description="Bookings, invites, and reminders synced from the backend DB."
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? <Badge variant="outline">Room {session.roomNumber}</Badge> : null}
              <Button size="sm" variant="outline" onClick={() => loadEvents()} disabled={isLoading}>
                {isLoading ? "Refreshing…" : "Refresh"}
	              </Button>
	              <Button size="sm" variant="outline" asChild>
	                <Link href={withLocale(locale, "/messages?department=reception")}>Message staff</Link>
	              </Button>
	            </div>
	          ) : (
            <Button size="sm" asChild>
              <Link href={withLocale(locale, "/reception/check-in")}>Start check-in</Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <CardTitle>Guest calendar</CardTitle>
              <Badge variant="secondary">Cross-service</Badge>
            </div>
            <CardDescription>Bookings from spa, restaurants, transfers, and housekeeping appear together.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!session ? <p className="text-sm text-muted-foreground">Connect a stay to load your agenda.</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {session && !isLoading && events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agenda items yet.</p>
            ) : null}

            <ul className="space-y-2">
              {events.map((event) => (
                <li key={event.id} className="rounded-lg border bg-card px-4 py-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{event.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.type} · {event.status} · {new Date(event.startAt).toLocaleString()}
                        {event.endAt ? ` → ${new Date(event.endAt).toLocaleTimeString()}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Reminders and escalations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Bell className="h-4 w-4" />
              <span>Pre-event alerts</span>
            </div>
            <p>Push reminders and SMS for critical events with confirmation buttons.</p>
            <div className="flex items-center gap-2 text-foreground">
              <ListChecks className="h-4 w-4" />
              <span>Service prep</span>
            </div>
            <p>Prompt departments with prep checklists tied to bookings.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
