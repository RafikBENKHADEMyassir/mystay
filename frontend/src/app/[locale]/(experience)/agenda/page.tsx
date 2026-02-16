"use client";

import { AppLink } from "@/components/ui/app-link";
import { Bell, CalendarRange, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
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
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.agenda;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  async function loadEvents(activeSession = session) {
    if (!activeSession || !page) return;
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
        setError(page.errors.loadAgenda);
        return;
      }

      const data = (await response.json()) as { items?: EventItem[] };
      setEvents(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(page.errors.backendUnreachable);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session || !page) return;
    void loadEvents(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId, page?.title]);

  if (!page) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? (
                <Badge variant="outline">
                  {interpolateTemplate(page.roomLabel, { roomNumber: session.roomNumber })}
                </Badge>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => loadEvents()} disabled={isLoading}>
                {isLoading ? page.refreshing : page.refresh}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <AppLink href={withLocale(locale, "/messages?department=reception")}>{page.messageStaff}</AppLink>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <AppLink href={withLocale(locale, "/reception/check-in")}>{page.startCheckIn}</AppLink>
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <CardTitle>{page.guestCalendarTitle}</CardTitle>
              <Badge variant="secondary">{page.guestCalendarBadge}</Badge>
            </div>
            <CardDescription>{page.guestCalendarDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!session ? <p className="text-sm text-muted-foreground">{page.connectStay}</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">{page.loading}</p> : null}
            {session && !isLoading && events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{page.noItems}</p>
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
            <CardTitle>{page.notifications.title}</CardTitle>
            <CardDescription>{page.notifications.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Bell className="h-4 w-4" />
              <span>{page.notifications.preEventTitle}</span>
            </div>
            <p>{page.notifications.preEventText}</p>
            <div className="flex items-center gap-2 text-foreground">
              <ListChecks className="h-4 w-4" />
              <span>{page.notifications.servicePrepTitle}</span>
            </div>
            <p>{page.notifications.servicePrepText}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
