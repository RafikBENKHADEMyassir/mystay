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

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const statusColor: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-700"
};

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/dashboard-stats");
        if (!res.ok) { setError("Failed to load dashboard data"); return; }
        setData(await res.json());
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          <CardTitle className="text-base">Dashboard unavailable</CardTitle>
          <CardDescription>{error ?? "No data"}</CardDescription>
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
          label="Active Stays"
          value={overview.activeStays}
          sub="Guests currently in-house"
        />
        {isManager ? (
          <StatCard
            icon={LogIn}
            label="Arrivals Today"
            value={overview.arrivalsToday}
            sub={`${overview.departuresToday} departures`}
          />
        ) : userDepts.includes("reception") ? (
          <StatCard
            icon={LogIn}
            label="Arrivals Today"
            value={overview.arrivalsToday}
            sub={`${overview.departuresToday} departures`}
          />
        ) : (
          <StatCard
            icon={Ticket}
            label="Open Tickets"
            value={overview.openTickets}
            sub="Requires attention"
          />
        )}
        <StatCard
          icon={MessageSquare}
          label="Requests Today"
          value={overview.requestsToday}
          sub={`${overview.openTickets} open tickets`}
        />
        {isManager ? (
          <StatCard
            icon={DollarSign}
            label="Revenue Today"
            value={formatCurrency(overview.revenueTodayCents)}
            sub={`${overview.totalStaff} staff members`}
          />
        ) : (
          <StatCard
            icon={Bell}
            label="Pending Notifications"
            value={overview.pendingNotifications}
            sub="Awaiting delivery"
          />
        )}
      </div>

      {isManager && (
        <div className="grid gap-4 md:grid-cols-2">
          <RequestsChart data={data.requestsLast7Days} />
          <StaysChart data={data.staysLast7Days} />
        </div>
      )}

      {isManager && data.ticketsByDepartment.length > 0 && (
        <DepartmentTicketsChart data={data.ticketsByDepartment} />
      )}

      {!isManager && filteredDeptTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Department Tickets</CardTitle>
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
                  <p className="text-xs text-muted-foreground">{d.resolved + d.closed} resolved</p>
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
                <p className="text-xs font-medium text-muted-foreground capitalize">{status.replace("_", " ")}</p>
                <p className="mt-1 text-2xl font-bold">{data.ticketsByStatus[status]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest tickets and guest requests</CardDescription>
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
                            {item.status.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isManager && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Total Staff" value={overview.totalStaff} sub="Across all departments" />
          <StatCard icon={LogOut} label="Departures Today" value={overview.departuresToday} sub="Expected check-outs" />
          <StatCard icon={Bell} label="Pending Notifications" value={overview.pendingNotifications} sub="Awaiting delivery" />
        </div>
      )}
    </div>
  );
}
