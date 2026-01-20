// admin/src/app/(dashboard)/analytics/page.tsx
import { requireStaffToken } from "@/lib/staff-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const departmentMetrics = [
  {
    name: "Reception",
    requests: 45,
    avgResponse: "2.3 min",
    satisfaction: 4.8,
    revenue: 1250,
  },
  {
    name: "Housekeeping",
    requests: 78,
    avgResponse: "15.5 min",
    satisfaction: 4.6,
    revenue: 0,
  },
  {
    name: "Room Service",
    requests: 92,
    avgResponse: "8.2 min",
    satisfaction: 4.9,
    revenue: 3480,
  },
  {
    name: "Concierge",
    requests: 34,
    avgResponse: "3.1 min",
    satisfaction: 4.7,
    revenue: 890,
  },
  {
    name: "Spa",
    requests: 28,
    avgResponse: "12.0 min",
    satisfaction: 5.0,
    revenue: 5600,
  },
];

export default function AnalyticsDashboard() {
  requireStaffToken();

  const totalRequests = departmentMetrics.reduce((sum, d) => sum + d.requests, 0);
  const totalRevenue = departmentMetrics.reduce((sum, d) => sum + d.revenue, 0);
  const avgSatisfaction = (
    departmentMetrics.reduce((sum, d) => sum + d.satisfaction, 0) /
    departmentMetrics.length
  ).toFixed(1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Performance metrics and KPIs across all departments
        </p>
      </header>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{totalRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Satisfaction</CardDescription>
            <CardTitle className="text-3xl">{avgSatisfaction}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue Generated</CardDescription>
            <CardTitle className="text-3xl">${totalRevenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Guests</CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently in-house</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Detailed metrics by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentMetrics.map((dept) => (
              <div
                key={dept.name}
                className="grid grid-cols-5 items-center gap-4 border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{dept.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requests</p>
                  <p className="font-semibold">{dept.requests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="font-semibold">{dept.avgResponse}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{dept.satisfaction}</p>
                    <Badge
                      variant={dept.satisfaction >= 4.5 ? "default" : "secondary"}
                    >
                      {dept.satisfaction >= 4.8
                        ? "Excellent"
                        : dept.satisfaction >= 4.5
                        ? "Good"
                        : "Fair"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
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
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>Average response times by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <p>Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Request Volume</CardTitle>
            <CardDescription>Requests by department over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <p>Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
