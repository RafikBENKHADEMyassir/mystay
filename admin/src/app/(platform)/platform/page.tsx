import Link from "next/link";
import { cookies } from "next/headers";
import { Building2, Users, Settings, TrendingUp, Hotel } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformDashboardCharts } from "./PlatformDashboardCharts";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const platformDashboardCopy = {
  en: {
    title: "Platform Dashboard",
    subtitle: "Manage hotels, monitor performance, and configure platform settings.",
    stats: {
      totalHotels: "Total Hotels",
      activeHotelsHint: "Active partner hotels",
      activeStays: "Active Stays",
      activeStaysHint: "Guests currently staying",
      staffUsers: "Staff Users",
      staffUsersHint: "Across all hotels",
      requestsToday: "Requests Today",
      requestsTodayHint: "Total guest requests",
    },
    quickActions: {
      manageHotelsTitle: "Manage Hotels",
      manageHotelsDescription: "Add new hotels, update branding, and manage hotel settings.",
      addHotelTitle: "Add New Hotel",
      addHotelDescription: "Onboard a new partner hotel to the MyStay platform.",
      settingsTitle: "Platform Settings",
      settingsDescription: "Configure global settings and integrations.",
    },
  },
  fr: {
    title: "Tableau de bord plateforme",
    subtitle: "Gerez les hotels, suivez la performance et configurez les parametres plateforme.",
    stats: {
      totalHotels: "Total hotels",
      activeHotelsHint: "Hotels partenaires actifs",
      activeStays: "Sejours actifs",
      activeStaysHint: "Clients actuellement heberges",
      staffUsers: "Utilisateurs staff",
      staffUsersHint: "Sur l'ensemble des hotels",
      requestsToday: "Demandes du jour",
      requestsTodayHint: "Total des demandes clients",
    },
    quickActions: {
      manageHotelsTitle: "Gerer les hotels",
      manageHotelsDescription: "Ajoutez des hotels, mettez a jour le branding et gerez les parametres hotel.",
      addHotelTitle: "Ajouter un hotel",
      addHotelDescription: "Integrez un nouvel hotel partenaire sur MyStay.",
      settingsTitle: "Parametres plateforme",
      settingsDescription: "Configurez les parametres globaux et integrations.",
    },
  },
  es: {
    title: "Panel de plataforma",
    subtitle: "Gestiona hoteles, monitorea rendimiento y configura ajustes de plataforma.",
    stats: {
      totalHotels: "Hoteles totales",
      activeHotelsHint: "Hoteles socios activos",
      activeStays: "Estancias activas",
      activeStaysHint: "Huespedes alojados actualmente",
      staffUsers: "Usuarios staff",
      staffUsersHint: "En todos los hoteles",
      requestsToday: "Solicitudes de hoy",
      requestsTodayHint: "Total de solicitudes de huespedes",
    },
    quickActions: {
      manageHotelsTitle: "Gestionar hoteles",
      manageHotelsDescription: "Agrega hoteles, actualiza branding y gestiona ajustes del hotel.",
      addHotelTitle: "Agregar hotel",
      addHotelDescription: "Incorpora un nuevo hotel socio a la plataforma MyStay.",
      settingsTitle: "Configuracion de plataforma",
      settingsDescription: "Configura ajustes globales e integraciones.",
    },
  },
} as const;

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
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = platformDashboardCopy[locale];
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
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">
          {t.subtitle}
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.totalHotels}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hotelCount}</div>
            <p className="text-xs text-muted-foreground">{t.stats.activeHotelsHint}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.activeStays}</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaysCount}</div>
            <p className="text-xs text-muted-foreground">{t.stats.activeStaysHint}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.staffUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staffUsersCount}</div>
            <p className="text-xs text-muted-foreground">{t.stats.staffUsersHint}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.requestsToday}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestsTodayCount}</div>
            <p className="text-xs text-muted-foreground">{t.stats.requestsTodayHint}</p>
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
                {t.quickActions.manageHotelsTitle}
              </CardTitle>
              <CardDescription>
                {t.quickActions.manageHotelsDescription}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/platform/hotels/new">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                {t.quickActions.addHotelTitle}
              </CardTitle>
              <CardDescription>
                {t.quickActions.addHotelDescription}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/platform/settings">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t.quickActions.settingsTitle}
              </CardTitle>
              <CardDescription>
                {t.quickActions.settingsDescription}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

    </div>
  );
}
