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
  Area
} from "recharts";

const dateLabel = (day: string) => {
  const d = new Date(day + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
  const requestsData = requestsLast7Days.map((r) => ({
    ...r,
    label: dateLabel(r.day)
  }));
  const staysData = activeStaysLast7Days.map((s) => ({
    ...s,
    label: dateLabel(s.day)
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">Guest requests (last 7 days)</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                labelFormatter={(_, payload) => payload[0]?.payload?.label}
                formatter={(value) => [value ?? 0, "Requests"]}
              />
              <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">Active stays (last 7 days)</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={staysData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                labelFormatter={(_, payload) => payload[0]?.payload?.label}
                formatter={(value) => [value ?? 0, "Active stays"]}
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
