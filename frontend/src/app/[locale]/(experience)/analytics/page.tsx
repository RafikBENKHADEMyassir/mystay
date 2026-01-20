"use client";

import Link from "next/link";
import { BarChart3, Gauge, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";

type Summary = {
  tickets: {
    total: number;
    byDepartment: Record<string, number>;
    byStatus: Record<string, number>;
  };
  threads: {
    total: number;
    byDepartment: Record<string, number>;
  };
  revenue: {
    totalCents: number;
    totalPoints: number;
  };
  upcomingEvents: number;
  generatedAt: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function formatCents(amountCents: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} EUR`;
  }
}

export default function AnalyticsPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingTickets = useMemo(() => summary?.tickets.byStatus.pending ?? 0, [summary]);
  const inProgressTickets = useMemo(() => summary?.tickets.byStatus.in_progress ?? 0, [summary]);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  async function loadSummary(activeSession = session) {
    if (!activeSession) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/v1/analytics/summary", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });
      if (!response.ok) {
        setError("Could not load analytics.");
        return;
      }
      setSummary((await response.json()) as Summary);
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then refresh.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadSummary(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        description="KPIs synced from the backend DB (demo slice)."
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              <Button size="sm" variant="outline" onClick={() => loadSummary()} disabled={isLoading}>
                {isLoading ? "Refreshing…" : "Refresh"}
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
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle>Performance</CardTitle>
              <Badge variant="secondary">KPIs</Badge>
            </div>
            <CardDescription>Stay-wide metrics for response times, revenue, and satisfaction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!session ? (
              <p className="text-sm text-muted-foreground">Connect a stay to load analytics.</p>
            ) : null}
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

            {summary ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Tickets</p>
                  <p className="mt-1 text-2xl font-semibold">{summary.tickets.total}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pendingTickets} pending · {inProgressTickets} in progress
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Threads</p>
                  <p className="mt-1 text-2xl font-semibold">{summary.threads.total}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Across all departments</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Revenue (invoices)</p>
                  <p className="mt-1 text-2xl font-semibold">{formatCents(summary.revenue.totalCents)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">+{summary.revenue.totalPoints} points</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Upcoming events</p>
                  <p className="mt-1 text-2xl font-semibold">{summary.upcomingEvents}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Generated {new Date(summary.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Health indicators</CardTitle>
            <CardDescription>Operational readiness and alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Gauge className="h-4 w-4" />
              <span>Capacity</span>
            </div>
            <p>Occupancy, staffing coverage, and backlog by service type.</p>
            <div className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Forecasts</span>
            </div>
            <p>Predictive cues for rush hours; suggestions for staffing and menu changes.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
