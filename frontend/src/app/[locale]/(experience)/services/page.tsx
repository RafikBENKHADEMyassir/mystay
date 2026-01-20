"use client";

import Link from "next/link";
import { ChevronRight, ConciergeBell, ReceiptText, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  updatedAt: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function serviceTitle(locale: string) {
  return locale === "fr" ? "Nos services" : "Our services";
}

function serviceIntro(locale: string) {
  return locale === "fr"
    ? "Vous êtes tenu au courant de toutes vos demandes et des routines de nos services."
    : "Stay updated on your requests and daily service routines.";
}

function serviceList(locale: string) {
  if (locale === "fr") {
    return [
      { id: "reception", label: "RÉCEPTION", href: "/reception/check-in" },
      { id: "concierge", label: "CONCIERGE", href: "/concierge" },
      { id: "housekeeping", label: "HOUSEKEEPING", href: "/housekeeping" },
      { id: "restaurants", label: "RESTAURANT", href: "/restaurants" },
      { id: "room_service", label: "ROOM SERVICE", href: "/room-service" },
      { id: "spa", label: "SPA & GYM", href: "/spa-gym" }
    ] as const;
  }

  return [
    { id: "reception", label: "RECEPTION", href: "/reception/check-in" },
    { id: "concierge", label: "CONCIERGE", href: "/concierge" },
    { id: "housekeeping", label: "HOUSEKEEPING", href: "/housekeeping" },
    { id: "restaurants", label: "RESTAURANT", href: "/restaurants" },
    { id: "room_service", label: "ROOM SERVICE", href: "/room-service" },
    { id: "spa", label: "SPA & GYM", href: "/spa-gym" }
  ] as const;
}

type StatusLineProps = {
  icon: React.ReactNode;
  title: string;
  detail: string;
};

function StatusLine({ icon, title, detail }: StatusLineProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-muted/40 text-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function ServiceTile({ label, href, ctaLabel }: { label: string; href: string; ctaLabel: string }) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-[22px] border bg-muted/30 shadow-sm">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.05))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_55%)] opacity-70" />
      <div className="relative flex h-24 items-end justify-between gap-3 px-4 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[0.14em] text-foreground/80">{label}</p>
          <p className="mt-1 text-xs font-medium text-foreground/70 group-hover:text-foreground">{ctaLabel}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/60 text-foreground shadow-sm">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export default function ServicesPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(locale === "fr" ? "Impossible de charger vos demandes." : "Could not load your requests.");
        return;
      }

      const data = (await response.json()) as { items?: Ticket[] };
      setTickets(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(locale === "fr" ? "Backend inaccessible. Démarrez le backend puis réessayez." : "Backend unreachable.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const activeConcierge = useMemo(() => tickets.find((t) => t.department === "concierge") ?? null, [tickets]);
  const activeHousekeeping = useMemo(() => tickets.find((t) => t.department === "housekeeping") ?? null, [tickets]);

  const lines = useMemo(() => {
    const items: Array<StatusLineProps & { href: string }> = [];
    if (activeConcierge) {
      items.push({
        href: withLocale(locale, "/concierge"),
        icon: <ConciergeBell className="h-4 w-4" />,
        title: activeConcierge.title,
        detail:
          activeConcierge.status === "resolved"
            ? locale === "fr"
              ? "Demande terminée."
              : "Request completed."
            : activeConcierge.status === "in_progress"
              ? locale === "fr"
                ? "Votre demande est en cours de traitement."
                : "Your request is in progress."
              : locale === "fr"
                ? "Le concierge est en train de traiter votre demande."
                : "Concierge is processing your request."
      });
    }
    if (activeHousekeeping) {
      items.push({
        href: withLocale(locale, "/housekeeping"),
        icon: <Sparkles className="h-4 w-4" />,
        title: activeHousekeeping.title,
        detail:
          activeHousekeeping.status === "resolved"
            ? locale === "fr"
              ? "Demande terminée."
              : "Request completed."
            : activeHousekeeping.status === "in_progress"
              ? locale === "fr"
                ? "Votre demande est en cours de traitement."
                : "Your request is in progress."
              : locale === "fr"
                ? "Le personnel a bien reçu votre demande."
                : "Staff has received your request."
      });
    }
    items.push({
      href: withLocale(locale, "/profile"),
      icon: <ReceiptText className="h-4 w-4" />,
      title: locale === "fr" ? "Factures" : "Invoices",
      detail: locale === "fr" ? "Voir votre historique de séjour et factures." : "See stay history & invoices."
    });
    return items;
  }, [activeConcierge, activeHousekeeping, locale]);

  const services = useMemo(() => serviceList(locale).map((s) => ({ ...s, href: withLocale(locale, s.href) })), [locale]);
  const serviceCtaLabel = locale === "fr" ? "Voir le service" : "View service";

  return (
    <div>
      <Topbar title={serviceTitle(locale)} subtitle={session?.hotelName ?? "Hôtel Four Seasons"} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        <section className="space-y-3">
          <p className="text-xs text-muted-foreground">{serviceIntro(locale)}</p>
          {session ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? <Badge variant="outline">Room {session.roomNumber}</Badge> : null}
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => loadTickets()} disabled={isLoading}>
                {isLoading ? (locale === "fr" ? "Chargement…" : "Loading…") : locale === "fr" ? "Actualiser" : "Refresh"}
              </Button>
            </div>
          ) : (
            <Button asChild className="w-full rounded-2xl">
              <Link href={withLocale(locale, "/reception/check-in")}>
                {locale === "fr" ? "Démarrer le check‑in" : "Start check-in"}
              </Link>
            </Button>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </section>

        <section className="space-y-2">
          {lines.map((line) => (
            <Link key={line.href} href={line.href} className="block">
              <StatusLine icon={line.icon} title={line.title} detail={line.detail} />
            </Link>
          ))}
        </section>

        <section className={cn("grid grid-cols-1 gap-3", "sm:grid-cols-2")}>
          {services.map((service) => (
            <ServiceTile key={service.id} label={service.label} href={service.href} ctaLabel={serviceCtaLabel} />
          ))}
        </section>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{locale === "fr" ? "Demandes récentes" : "Recent requests"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!session ? (
              <p className="text-sm text-muted-foreground">
                {locale === "fr" ? "Connectez une réservation pour voir vos demandes." : "Connect a stay to see your requests."}
              </p>
            ) : null}
            {session && tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === "fr" ? "Aucune demande pour le moment." : "No requests yet."}
              </p>
            ) : null}
            <ul className="space-y-2">
              {tickets.slice(0, 6).map((ticket) => (
                <li key={ticket.id} className="rounded-2xl border bg-background px-4 py-3 text-sm shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{ticket.title}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {ticket.department} · {ticket.status.replaceAll("_", " ")} ·{" "}
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
