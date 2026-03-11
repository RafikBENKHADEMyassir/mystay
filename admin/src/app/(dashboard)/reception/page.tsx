// admin/src/app/(dashboard)/reception/page.tsx
import { cookies } from "next/headers";

import { requireStaffToken } from "@/lib/staff-auth";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
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

const receptionCopy = {
  en: {
    title: "Reception Dashboard",
    subtitle: "Manage arrivals, departures, and guest services",
    pendingCheckIns: "Pending Check-ins",
    pendingCheckOuts: "Pending Check-outs",
    todaysArrivals: "Today's Arrivals",
    expectedCheckInsToday: "Expected check-ins for today",
    room: "Room",
    checkedIn: "Checked In",
    pending: "Pending",
    checkIn: "Check In",
    todaysDepartures: "Today's Departures",
    expectedCheckOutsToday: "Expected check-outs for today",
    checkedOut: "Checked Out",
    processCheckout: "Process Check-out",
  },
  fr: {
    title: "Tableau Reception",
    subtitle: "Gerer les arrivees, departs et services clients",
    pendingCheckIns: "Check-ins en attente",
    pendingCheckOuts: "Check-outs en attente",
    todaysArrivals: "Arrivees du jour",
    expectedCheckInsToday: "Check-ins prevus aujourd'hui",
    room: "Chambre",
    checkedIn: "Enregistre",
    pending: "En attente",
    checkIn: "Check-in",
    todaysDepartures: "Departs du jour",
    expectedCheckOutsToday: "Check-outs prevus aujourd'hui",
    checkedOut: "Sorti",
    processCheckout: "Traiter le check-out",
  },
  es: {
    title: "Panel de Recepcion",
    subtitle: "Gestionar llegadas, salidas y servicios para huespedes",
    pendingCheckIns: "Check-ins pendientes",
    pendingCheckOuts: "Check-outs pendientes",
    todaysArrivals: "Llegadas de hoy",
    expectedCheckInsToday: "Check-ins esperados para hoy",
    room: "Habitacion",
    checkedIn: "Registrado",
    pending: "Pendiente",
    checkIn: "Hacer check-in",
    todaysDepartures: "Salidas de hoy",
    expectedCheckOutsToday: "Check-outs esperados para hoy",
    checkedOut: "Salida hecha",
    processCheckout: "Procesar check-out",
  },
} as const;

export default function ReceptionDashboard() {
  requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = receptionCopy[locale];

  const pendingCheckIns = arrivals.filter((a) => a.status === "pending").length;
  const pendingCheckOuts = departures.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.pendingCheckIns}</CardDescription>
            <CardTitle className="text-3xl">{pendingCheckIns}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.pendingCheckOuts}</CardDescription>
            <CardTitle className="text-3xl">{pendingCheckOuts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.todaysArrivals}</CardDescription>
            <CardTitle className="text-3xl">{arrivals.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle>{t.todaysArrivals}</CardTitle>
          <CardDescription>{t.expectedCheckInsToday}</CardDescription>
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
                    {t.room} {arrival.room} • {arrival.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      arrival.status === "checked-in" ? "default" : "secondary"
                    }
                  >
                    {arrival.status === "checked-in" ? t.checkedIn : t.pending}
                  </Badge>
                  {arrival.status === "pending" && (
                    <Button size="sm">{t.checkIn}</Button>
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
          <CardTitle>{t.todaysDepartures}</CardTitle>
          <CardDescription>{t.expectedCheckOutsToday}</CardDescription>
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
                    {t.room} {departure.room} • {departure.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      departure.status === "checked-out" ? "default" : "secondary"
                    }
                  >
                    {departure.status === "checked-out"
                      ? t.checkedOut
                      : t.pending}
                  </Badge>
                  {departure.status === "pending" && (
                    <Button size="sm" variant="outline">
                      {t.processCheckout}
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
