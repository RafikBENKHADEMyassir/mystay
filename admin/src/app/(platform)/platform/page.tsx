import Link from "next/link";
import { Building2, Users, Settings, TrendingUp, Hotel } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformDashboardCharts } from "./PlatformDashboardCharts";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type DashboardStats = {
  hotelCount: number;
  activeStaysCount: number;
  staffUsersCount: number;
  requestsTodayCount: number;
  requestsLast7Days: { day: string; requests: number }[];
  activeStaysLast7Days: { day: string; stays: number }[];
};

async function getDashboardStats(token: string): Promise<DashboardStats> {
  const fallback: DashboardStats = {
    hotelCount: 0,
    activeStaysCount: 0,
    staffUsersCount: 0,
    requestsTodayCount: 0,
    requestsLast7Days: [],
    activeStaysLast7Days: []
  };
  try {
    const response = await fetch(`${backendUrl}/api/v1/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    return {
      hotelCount: data.hotelCount ?? 0,
      activeStaysCount: data.activeStaysCount ?? 0,
      staffUsersCount: data.staffUsersCount ?? 0,
      requestsTodayCount: data.requestsTodayCount ?? 0,
      requestsLast7Days: Array.isArray(data.requestsLast7Days) ? data.requestsLast7Days : [],
      activeStaysLast7Days: Array.isArray(data.activeStaysLast7Days) ? data.activeStaysLast7Days : []
    };
  } catch {
    return fallback;
  }
}

export default async function PlatformDashboardPage() {
  const token = getStaffToken();
  const stats = token
    ? await getDashboardStats(token)
    : {
        hotelCount: 0,
        activeStaysCount: 0,
        staffUsersCount: 0,
        requestsTodayCount: 0,
        requestsLast7Days: [],
        activeStaysLast7Days: []
      };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-muted-foreground">
          Manage hotels, monitor performance, and configure platform settings.
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hotelCount}</div>
            <p className="text-xs text-muted-foreground">Active partner hotels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stays</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaysCount}</div>
            <p className="text-xs text-muted-foreground">Guests currently staying</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staffUsersCount}</div>
            <p className="text-xs text-muted-foreground">Across all hotels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestsTodayCount}</div>
            <p className="text-xs text-muted-foreground">Total guest requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <PlatformDashboardCharts
        requestsLast7Days={stats.requestsLast7Days}
        activeStaysLast7Days={stats.activeStaysLast7Days}
      />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/platform/hotels">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Manage Hotels
              </CardTitle>
              <CardDescription>
                Add new hotels, update branding, and manage hotel settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/platform/hotels/new">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Add New Hotel
              </CardTitle>
              <CardDescription>
                Onboard a new partner hotel to the MyStay platform.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/platform/settings">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Settings
              </CardTitle>
              <CardDescription>
                Configure global settings and integrations.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

    </div>
  );
}
