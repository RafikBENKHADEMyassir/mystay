"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BedDouble,
  LogIn,
  LogOut,
  MessageSquare,
  Ticket,
  Bell,
  DollarSign,
  Clock
} from "lucide-react";

import type { AdminLocale } from "@/lib/admin-locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestsChart, StaysChart, DepartmentTicketsChart } from "./DashboardCharts";

type Overview = {
  activeStays: number;
  arrivalsToday: number;
  departuresToday: number;
  totalStaff: number;
  requestsToday: number;
  openTickets: number;
  pendingNotifications: number;
  revenueTodayCents: number;
};

type DayCount = { day: string; count: number };
type DeptTickets = { department: string; open: number; in_progress: number; resolved: number; closed: number };
type TicketsByStatus = { open: number; in_progress: number; resolved: number; closed: number };
type ActivityItem = { type: string; id: string; summary: string; department?: string; status?: string; createdAt: string };

type DashboardData = {
  hotelName: string;
  role: string;
  departments: string[];
  overview: Overview;
  requestsLast7Days: DayCount[];
  staysLast7Days: DayCount[];
  ticketsByDepartment: DeptTickets[];
  ticketsByStatus: TicketsByStatus;
  recentActivity: ActivityItem[];
};

const localeTag: Record<AdminLocale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

const dashboardStatsCopy = {
  en: {
    failedToLoad: "Failed to load dashboard data",
    networkError: "Network error",
    dashboardUnavailable: "Dashboard unavailable",
    noData: "No data",
    activeStays: "Active Stays",
    guestsCurrentlyInHouse: "Guests currently in-house",
    arrivalsToday: "Arrivals Today",
    departuresTodaySuffix: "departures",
    openTickets: "Open Tickets",
    requiresAttention: "Requires attention",
    requestsToday: "Requests Today",
    openTicketsSuffix: "open tickets",
    revenueToday: "Revenue Today",
    staffMembersSuffix: "staff members",
    pendingNotifications: "Pending Notifications",
    awaitingDelivery: "Awaiting delivery",
    yourDepartmentTickets: "Your Department Tickets",
    resolvedSuffix: "resolved",
    recentActivity: "Recent Activity",
    latestTicketsAndRequests: "Latest tickets and guest requests",
    totalStaff: "Total Staff",
    acrossAllDepartments: "Across all departments",
    departuresTodayStat: "Departures Today",
    expectedCheckouts: "Expected check-outs",
    justNow: "just now",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
    daysAgo: "d ago",
    status: {
      open: "Open",
      in_progress: "In progress",
      resolved: "Resolved",
      closed: "Closed",
    },
  },
  fr: {
    failedToLoad: "Impossible de charger les donnees du tableau de bord",
    networkError: "Erreur reseau",
    dashboardUnavailable: "Tableau de bord indisponible",
    noData: "Aucune donnee",
    activeStays: "Sejours actifs",
    guestsCurrentlyInHouse: "Clients actuellement a l'hotel",
    arrivalsToday: "Arrivees aujourd'hui",
    departuresTodaySuffix: "departs",
    openTickets: "Tickets ouverts",
    requiresAttention: "Necessite une attention",
    requestsToday: "Demandes aujourd'hui",
    openTicketsSuffix: "tickets ouverts",
    revenueToday: "Revenus aujourd'hui",
    staffMembersSuffix: "membres du personnel",
    pendingNotifications: "Notifications en attente",
    awaitingDelivery: "En attente d'envoi",
    yourDepartmentTickets: "Tickets de votre departement",
    resolvedSuffix: "resolus",
    recentActivity: "Activite recente",
    latestTicketsAndRequests: "Derniers tickets et demandes clients",
    totalStaff: "Personnel total",
    acrossAllDepartments: "Tous departements confondus",
    departuresTodayStat: "Departs aujourd'hui",
    expectedCheckouts: "Check-outs prevus",
    justNow: "a l'instant",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "j",
    status: {
      open: "Ouvert",
      in_progress: "En cours",
      resolved: "Resolu",
      closed: "Ferme",
    },
  },
  es: {
    failedToLoad: "No se pudieron cargar los datos del panel",
    networkError: "Error de red",
    dashboardUnavailable: "Panel no disponible",
    noData: "Sin datos",
    activeStays: "Estancias activas",
    guestsCurrentlyInHouse: "Huespedes actualmente en el hotel",
    arrivalsToday: "Llegadas hoy",
    departuresTodaySuffix: "salidas",
    openTickets: "Tickets abiertos",
    requiresAttention: "Requiere atencion",
    requestsToday: "Solicitudes hoy",
    openTicketsSuffix: "tickets abiertos",
    revenueToday: "Ingresos de hoy",
    staffMembersSuffix: "miembros del personal",
    pendingNotifications: "Notificaciones pendientes",
    awaitingDelivery: "Esperando envio",
    yourDepartmentTickets: "Tickets de tu departamento",
    resolvedSuffix: "resueltos",
    recentActivity: "Actividad reciente",
    latestTicketsAndRequests: "Ultimos tickets y solicitudes de huespedes",
    totalStaff: "Personal total",
    acrossAllDepartments: "En todos los departamentos",
    departuresTodayStat: "Salidas hoy",
    expectedCheckouts: "Check-outs esperados",
    justNow: "justo ahora",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "d",
    status: {
      open: "Abierto",
      in_progress: "En progreso",
      resolved: "Resuelto",
      closed: "Cerrado",
    },
  },
} as const;

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function formatCurrency(cents: number, locale: AdminLocale) {
  return new Intl.NumberFormat(localeTag[locale], { style: "currency", currency: "USD" }).format(cents / 100);
}

function timeAgo(dateStr: string, locale: AdminLocale) {
  const t = dashboardStatsCopy[locale];
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return `${mins}${t.minutesAgo}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t.hoursAgo}`;
  return `${Math.floor(hrs / 24)}${t.daysAgo}`;
}

function statusLabel(status: string, locale: AdminLocale) {
  const t = dashboardStatsCopy[locale];
  if (status === "open") return t.status.open;
  if (status === "in_progress") return t.status.in_progress;
  if (status === "resolved") return t.status.resolved;
  if (status === "closed") return t.status.closed;
  return status.replace("_", " ");
}

const statusColor: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-700"
};

type DashboardStatsProps = {
  locale: AdminLocale;
};

export function DashboardStats({ locale }: DashboardStatsProps) {
  const t = dashboardStatsCopy[locale];
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/dashboard-stats");
        if (!res.ok) { setError(t.failedToLoad); return; }
        setData(await res.json());
      } catch {
        setError(t.networkError);
      } finally {
        setLoading(false);
      }
    })();
  }, [t.failedToLoad, t.networkError]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></CardHeader>
              <CardContent><div className="h-8 w-16 animate-pulse rounded bg-muted" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-[280px] animate-pulse rounded-lg bg-muted" />
          <div className="h-[280px] animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base">{t.dashboardUnavailable}</CardTitle>
          <CardDescription>{error ?? t.noData}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { overview, role, departments } = data;
  const isManager = role === "admin" || role === "manager";

  const userDepts = departments ?? [];
  const filteredDeptTickets = isManager
    ? data.ticketsByDepartment
    : data.ticketsByDepartment.filter((d) => userDepts.includes(d.department));

  const filteredActivity = isManager
    ? data.recentActivity
    : data.recentActivity.filter((a) => !a.department || userDepts.includes(a.department));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BedDouble}
          label={t.activeStays}
          value={overview.activeStays}
          sub={t.guestsCurrentlyInHouse}
        />
        {isManager ? (
          <StatCard
            icon={LogIn}
            label={t.arrivalsToday}
            value={overview.arrivalsToday}
            sub={`${overview.departuresToday} ${t.departuresTodaySuffix}`}
          />
        ) : userDepts.includes("reception") ? (
          <StatCard
            icon={LogIn}
            label={t.arrivalsToday}
            value={overview.arrivalsToday}
            sub={`${overview.departuresToday} ${t.departuresTodaySuffix}`}
          />
        ) : (
          <StatCard
            icon={Ticket}
            label={t.openTickets}
            value={overview.openTickets}
            sub={t.requiresAttention}
          />
        )}
        <StatCard
          icon={MessageSquare}
          label={t.requestsToday}
          value={overview.requestsToday}
          sub={`${overview.openTickets} ${t.openTicketsSuffix}`}
        />
        {isManager ? (
          <StatCard
            icon={DollarSign}
            label={t.revenueToday}
            value={formatCurrency(overview.revenueTodayCents, locale)}
            sub={`${overview.totalStaff} ${t.staffMembersSuffix}`}
          />
        ) : (
          <StatCard
            icon={Bell}
            label={t.pendingNotifications}
            value={overview.pendingNotifications}
            sub={t.awaitingDelivery}
          />
        )}
      </div>

      {isManager && (
        <div className="grid gap-4 md:grid-cols-2">
          <RequestsChart data={data.requestsLast7Days} locale={locale} />
          <StaysChart data={data.staysLast7Days} locale={locale} />
        </div>
      )}

      {isManager && data.ticketsByDepartment.length > 0 && (
        <DepartmentTicketsChart data={data.ticketsByDepartment} locale={locale} />
      )}

      {!isManager && filteredDeptTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.yourDepartmentTickets}</CardTitle>
            <CardDescription>
              {filteredDeptTickets.map((d) => d.department).join(", ")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredDeptTickets.map((d) => (
                <div key={d.department} className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{d.department}</p>
                  <p className="mt-1 text-lg font-bold">{d.open + d.in_progress}</p>
                  <p className="text-xs text-muted-foreground">{d.resolved + d.closed} {t.resolvedSuffix}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isManager && (
        <div className="grid gap-4 sm:grid-cols-4">
          {(["open", "in_progress", "resolved", "closed"] as const).map((status) => (
            <Card key={status}>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground capitalize">{statusLabel(status, locale)}</p>
                <p className="mt-1 text-2xl font-bold">{data.ticketsByStatus[status]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.recentActivity}</CardTitle>
            <CardDescription>{t.latestTicketsAndRequests}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredActivity.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      {item.type === "ticket" ? (
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.summary || item.id}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {item.department && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.department}
                          </Badge>
                        )}
                        {item.status && (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[item.status] ?? "bg-muted text-muted-foreground"}`}>
                            {statusLabel(item.status, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(item.createdAt, locale)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isManager && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label={t.totalStaff} value={overview.totalStaff} sub={t.acrossAllDepartments} />
          <StatCard icon={LogOut} label={t.departuresTodayStat} value={overview.departuresToday} sub={t.expectedCheckouts} />
          <StatCard icon={Bell} label={t.pendingNotifications} value={overview.pendingNotifications} sub={t.awaitingDelivery} />
        </div>
      )}
    </div>
  );
}
