"use client";

import { usePathname } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { defaultAdminLocale, getAdminLocaleFromPathname, type AdminLocale } from "@/lib/admin-locale";

const platformChartsCopy = {
  en: {
    requestsTitle: "Guest requests (last 7 days)",
    requestsLabel: "Requests",
    staysTitle: "Active stays (last 7 days)",
    staysLabel: "Active stays",
  },
  fr: {
    requestsTitle: "Demandes clients (7 derniers jours)",
    requestsLabel: "Demandes",
    staysTitle: "Sejours actifs (7 derniers jours)",
    staysLabel: "Sejours actifs",
  },
  es: {
    requestsTitle: "Solicitudes de huespedes (ultimos 7 dias)",
    requestsLabel: "Solicitudes",
    staysTitle: "Estancias activas (ultimos 7 dias)",
    staysLabel: "Estancias activas",
  },
} as const;

const dateLabel = (day: string, locale: AdminLocale) => {
  const d = new Date(day + "T12:00:00");
  return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
};

type RequestsDay = { day: string; requests: number };
type StaysDay = { day: string; stays: number };

export function PlatformDashboardCharts({
  requestsLast7Days,
  activeStaysLast7Days
}: {
  requestsLast7Days: RequestsDay[];
  activeStaysLast7Days: StaysDay[];
}) {
  const pathname = usePathname() ?? "/platform";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = platformChartsCopy[locale];
  const requestsData = requestsLast7Days.map((r) => ({
    ...r,
    label: dateLabel(r.day, locale)
  }));
  const staysData = activeStaysLast7Days.map((s) => ({
    ...s,
    label: dateLabel(s.day, locale)
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">{t.requestsTitle}</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                labelFormatter={(_, payload) => payload[0]?.payload?.label}
                formatter={(value) => [value ?? 0, t.requestsLabel]}
              />
              <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">{t.staysTitle}</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={staysData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                labelFormatter={(_, payload) => payload[0]?.payload?.label}
                formatter={(value) => [value ?? 0, t.staysLabel]}
              />
              <Area
                type="monotone"
                dataKey="stays"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
