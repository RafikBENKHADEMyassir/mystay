"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";

import type { AdminLocale } from "@/lib/admin-locale";

const localeTag: Record<AdminLocale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

const chartsCopy = {
  en: {
    guestRequests: "Guest requests (last 7 days)",
    activeStays: "Active stays (last 7 days)",
    ticketsByDepartment: "Tickets by department",
    requestsLabel: "Requests",
    activeStaysLabel: "Active stays",
    open: "Open",
    resolved: "Resolved",
  },
  fr: {
    guestRequests: "Demandes clients (7 derniers jours)",
    activeStays: "Sejours actifs (7 derniers jours)",
    ticketsByDepartment: "Tickets par departement",
    requestsLabel: "Demandes",
    activeStaysLabel: "Sejours actifs",
    open: "Ouverts",
    resolved: "Resolus",
  },
  es: {
    guestRequests: "Solicitudes de huespedes (ultimos 7 dias)",
    activeStays: "Estancias activas (ultimos 7 dias)",
    ticketsByDepartment: "Tickets por departamento",
    requestsLabel: "Solicitudes",
    activeStaysLabel: "Estancias activas",
    open: "Abiertos",
    resolved: "Resueltos",
  },
} as const;

const dateLabel = (day: string, locale: AdminLocale) => {
  const d = new Date(day + "T12:00:00");
  return d.toLocaleDateString(localeTag[locale], { weekday: "short", month: "short", day: "numeric" });
};

type DayCount = { day: string; count: number };

type DeptTickets = {
  department: string;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
};

const DEPT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--primary) / 0.5)",
  "hsl(var(--primary) / 0.35)",
  "hsl(var(--primary) / 0.2)"
];

export function RequestsChart({ data, locale }: { data: DayCount[]; locale: AdminLocale }) {
  const t = chartsCopy[locale];
  const chartData = data.map((r) => ({ ...r, label: dateLabel(r.day, locale) }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">{t.guestRequests}</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              labelFormatter={(_, payload) => payload[0]?.payload?.label}
              formatter={(value) => [value ?? 0, t.requestsLabel]}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StaysChart({ data, locale }: { data: DayCount[]; locale: AdminLocale }) {
  const t = chartsCopy[locale];
  const chartData = data.map((s) => ({ ...s, label: dateLabel(s.day, locale) }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">{t.activeStays}</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              labelFormatter={(_, payload) => payload[0]?.payload?.label}
              formatter={(value) => [value ?? 0, t.activeStaysLabel]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DepartmentTicketsChart({ data, locale }: { data: DeptTickets[]; locale: AdminLocale }) {
  if (!data.length) return null;
  const t = chartsCopy[locale];

  const chartData = data.map((d) => ({
    name: d.department.charAt(0).toUpperCase() + d.department.slice(1),
    open: d.open + d.in_progress,
    resolved: d.resolved + d.closed
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">{t.ticketsByDepartment}</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 8, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="open" name={t.open} stackId="a" fill="hsl(var(--primary))">
              {chartData.map((_, i) => (
                <Cell key={i} fill={DEPT_COLORS[0]} />
              ))}
            </Bar>
            <Bar dataKey="resolved" name={t.resolved} stackId="a" fill="hsl(var(--primary) / 0.3)">
              {chartData.map((_, i) => (
                <Cell key={i} fill={DEPT_COLORS[2]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
