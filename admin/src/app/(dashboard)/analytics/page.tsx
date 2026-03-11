// admin/src/app/(dashboard)/analytics/page.tsx
import { cookies } from "next/headers";

import { requireStaffToken } from "@/lib/staff-auth";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DepartmentKey = "reception" | "housekeeping" | "roomService" | "concierge" | "spa";

const departmentMetrics: Array<{
  key: DepartmentKey;
  requests: number;
  avgResponse: string;
  satisfaction: number;
  revenue: number;
}> = [
  {
    key: "reception",
    requests: 45,
    avgResponse: "2.3 min",
    satisfaction: 4.8,
    revenue: 1250,
  },
  {
    key: "housekeeping",
    requests: 78,
    avgResponse: "15.5 min",
    satisfaction: 4.6,
    revenue: 0,
  },
  {
    key: "roomService",
    requests: 92,
    avgResponse: "8.2 min",
    satisfaction: 4.9,
    revenue: 3480,
  },
  {
    key: "concierge",
    requests: 34,
    avgResponse: "3.1 min",
    satisfaction: 4.7,
    revenue: 890,
  },
  {
    key: "spa",
    requests: 28,
    avgResponse: "12.0 min",
    satisfaction: 5.0,
    revenue: 5600,
  },
];

const analyticsCopy = {
  en: {
    title: "Analytics Dashboard",
    subtitle: "Performance metrics and KPIs across all departments",
    totalRequests: "Total Requests",
    avgSatisfaction: "Avg Satisfaction",
    revenueGenerated: "Revenue Generated",
    activeGuests: "Active Guests",
    last24Hours: "Last 24 hours",
    outOfFive: "Out of 5.0",
    today: "Today",
    currentlyInHouse: "Currently in-house",
    departmentPerformance: "Department Performance",
    detailedMetrics: "Detailed metrics by department",
    requests: "Requests",
    avgResponse: "Avg Response",
    satisfaction: "Satisfaction",
    revenue: "Revenue",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    responseTimeTrends: "Response Time Trends",
    avgResponseByHour: "Average response times by hour",
    requestVolume: "Request Volume",
    requestsOverTime: "Requests by department over time",
    chartPlaceholder: "Chart visualization would go here",
    departments: {
      reception: "Reception",
      housekeeping: "Housekeeping",
      roomService: "Room Service",
      concierge: "Concierge",
      spa: "Spa",
    },
  },
  fr: {
    title: "Tableau d'analyse",
    subtitle: "Metriques de performance et KPI sur tous les departements",
    totalRequests: "Demandes totales",
    avgSatisfaction: "Satisfaction moyenne",
    revenueGenerated: "Revenus generes",
    activeGuests: "Clients actifs",
    last24Hours: "Dernieres 24 heures",
    outOfFive: "Sur 5.0",
    today: "Aujourd'hui",
    currentlyInHouse: "Actuellement a l'hotel",
    departmentPerformance: "Performance des departements",
    detailedMetrics: "Metriques detaillees par departement",
    requests: "Demandes",
    avgResponse: "Reponse moyenne",
    satisfaction: "Satisfaction",
    revenue: "Revenus",
    excellent: "Excellent",
    good: "Bon",
    fair: "Moyen",
    responseTimeTrends: "Tendances du temps de reponse",
    avgResponseByHour: "Temps de reponse moyen par heure",
    requestVolume: "Volume de demandes",
    requestsOverTime: "Demandes par departement dans le temps",
    chartPlaceholder: "La visualisation du graphique sera affichee ici",
    departments: {
      reception: "Reception",
      housekeeping: "Menage",
      roomService: "Room service",
      concierge: "Conciergerie",
      spa: "Spa",
    },
  },
  es: {
    title: "Panel de analitica",
    subtitle: "Metricas de rendimiento y KPI en todos los departamentos",
    totalRequests: "Solicitudes totales",
    avgSatisfaction: "Satisfaccion media",
    revenueGenerated: "Ingresos generados",
    activeGuests: "Huespedes activos",
    last24Hours: "Ultimas 24 horas",
    outOfFive: "De 5.0",
    today: "Hoy",
    currentlyInHouse: "Actualmente en el hotel",
    departmentPerformance: "Rendimiento por departamento",
    detailedMetrics: "Metricas detalladas por departamento",
    requests: "Solicitudes",
    avgResponse: "Respuesta media",
    satisfaction: "Satisfaccion",
    revenue: "Ingresos",
    excellent: "Excelente",
    good: "Bueno",
    fair: "Regular",
    responseTimeTrends: "Tendencias de tiempo de respuesta",
    avgResponseByHour: "Tiempos medios de respuesta por hora",
    requestVolume: "Volumen de solicitudes",
    requestsOverTime: "Solicitudes por departamento en el tiempo",
    chartPlaceholder: "La visualizacion del grafico aparecera aqui",
    departments: {
      reception: "Recepcion",
      housekeeping: "Limpieza",
      roomService: "Room service",
      concierge: "Conserjeria",
      spa: "Spa",
    },
  },
} as const;

export default function AnalyticsDashboard() {
  requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = analyticsCopy[locale];

  const totalRequests = departmentMetrics.reduce((sum, d) => sum + d.requests, 0);
  const totalRevenue = departmentMetrics.reduce((sum, d) => sum + d.revenue, 0);
  const avgSatisfaction = (
    departmentMetrics.reduce((sum, d) => sum + d.satisfaction, 0) /
    departmentMetrics.length
  ).toFixed(1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalRequests}</CardDescription>
            <CardTitle className="text-3xl">{totalRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t.last24Hours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.avgSatisfaction}</CardDescription>
            <CardTitle className="text-3xl">{avgSatisfaction}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t.outOfFive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.revenueGenerated}</CardDescription>
            <CardTitle className="text-3xl">${totalRevenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t.today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.activeGuests}</CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t.currentlyInHouse}</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t.departmentPerformance}</CardTitle>
          <CardDescription>{t.detailedMetrics}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentMetrics.map((dept) => (
              <div
                key={dept.key}
                className="grid grid-cols-5 items-center gap-4 border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{t.departments[dept.key]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.requests}</p>
                  <p className="font-semibold">{dept.requests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.avgResponse}</p>
                  <p className="font-semibold">{dept.avgResponse}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.satisfaction}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{dept.satisfaction}</p>
                    <Badge
                      variant={dept.satisfaction >= 4.5 ? "default" : "secondary"}
                    >
                      {dept.satisfaction >= 4.8
                        ? t.excellent
                        : dept.satisfaction >= 4.5
                        ? t.good
                        : t.fair}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.revenue}</p>
                  <p className="font-semibold">
                    {dept.revenue > 0 ? `$${dept.revenue}` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Time Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.responseTimeTrends}</CardTitle>
            <CardDescription>{t.avgResponseByHour}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <p>{t.chartPlaceholder}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.requestVolume}</CardTitle>
            <CardDescription>{t.requestsOverTime}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <p>{t.chartPlaceholder}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
