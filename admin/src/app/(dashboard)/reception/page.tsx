// admin/src/app/(dashboard)/reception/page.tsx
import { requireStaffToken } from "@/lib/staff-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const arrivals = [
  {
    id: "1",
    guestName: "John Doe",
    room: "204",
    time: "14:00",
    status: "pending",
  },
  {
    id: "2",
    guestName: "Jane Smith",
    room: "305",
    time: "15:30",
    status: "checked-in",
  },
  {
    id: "3",
    guestName: "Bob Johnson",
    room: "102",
    time: "16:00",
    status: "pending",
  },
];

const departures = [
  {
    id: "4",
    guestName: "Alice Brown",
    room: "201",
    time: "11:00",
    status: "pending",
  },
  {
    id: "5",
    guestName: "Charlie Wilson",
    room: "103",
    time: "10:30",
    status: "checked-out",
  },
];

export default function ReceptionDashboard() {
  requireStaffToken();

  const pendingCheckIns = arrivals.filter((a) => a.status === "pending").length;
  const pendingCheckOuts = departures.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reception Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage arrivals, departures, and guest services
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Check-ins</CardDescription>
            <CardTitle className="text-3xl">{pendingCheckIns}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Check-outs</CardDescription>
            <CardTitle className="text-3xl">{pendingCheckOuts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Arrivals</CardDescription>
            <CardTitle className="text-3xl">{arrivals.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Arrivals</CardTitle>
          <CardDescription>Expected check-ins for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {arrivals.map((arrival) => (
              <div
                key={arrival.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{arrival.guestName}</p>
                  <p className="text-sm text-muted-foreground">
                    Room {arrival.room} • {arrival.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      arrival.status === "checked-in" ? "default" : "secondary"
                    }
                  >
                    {arrival.status === "checked-in" ? "Checked In" : "Pending"}
                  </Badge>
                  {arrival.status === "pending" && (
                    <Button size="sm">Check In</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Departures */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Departures</CardTitle>
          <CardDescription>Expected check-outs for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {departures.map((departure) => (
              <div
                key={departure.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{departure.guestName}</p>
                  <p className="text-sm text-muted-foreground">
                    Room {departure.room} • {departure.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      departure.status === "checked-out" ? "default" : "secondary"
                    }
                  >
                    {departure.status === "checked-out"
                      ? "Checked Out"
                      : "Pending"}
                  </Badge>
                  {departure.status === "pending" && (
                    <Button size="sm" variant="outline">
                      Process Check-out
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
