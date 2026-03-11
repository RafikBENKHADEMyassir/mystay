import { cookies } from "next/headers";

import { requireStaffToken } from "@/lib/staff-auth";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RoomStatus = "clean" | "cleaning" | "dirty" | "inspection" | "maintenance" | "checkout";

type Room = {
  number: string;
  status: RoomStatus;
  assignedTo: string | null;
  floor: number;
  type: string;
  guestName: string | null;
  checkOut: string | null;
  priority: "normal" | "high" | "vip";
  notes: string | null;
};

const rooms: Room[] = [
  { number: "101", status: "clean", assignedTo: "Maria Garcia", floor: 1, type: "Standard", guestName: "J. Martin", checkOut: null, priority: "normal", notes: null },
  { number: "102", status: "cleaning", assignedTo: "John Smith", floor: 1, type: "Standard", guestName: "P. Dupont", checkOut: null, priority: "normal", notes: null },
  { number: "103", status: "dirty", assignedTo: null, floor: 1, type: "Superior", guestName: null, checkOut: "14:00", priority: "high", notes: "Late check-out approved" },
  { number: "104", status: "clean", assignedTo: "Maria Garcia", floor: 1, type: "Standard", guestName: "A. Bernard", checkOut: null, priority: "normal", notes: null },
  { number: "105", status: "checkout", assignedTo: null, floor: 1, type: "Suite", guestName: null, checkOut: "11:00", priority: "vip", notes: "VIP guest — deep clean required" },
  { number: "201", status: "dirty", assignedTo: null, floor: 2, type: "Superior", guestName: null, checkOut: "11:00", priority: "normal", notes: null },
  { number: "202", status: "cleaning", assignedTo: "Sarah Chen", floor: 2, type: "Standard", guestName: "L. Moreau", checkOut: null, priority: "normal", notes: null },
  { number: "203", status: "clean", assignedTo: "Sarah Chen", floor: 2, type: "Suite", guestName: "R. Johnson", checkOut: null, priority: "vip", notes: null },
  { number: "204", status: "maintenance", assignedTo: null, floor: 2, type: "Standard", guestName: null, checkOut: null, priority: "normal", notes: "AC unit repair — ETA 16:00" },
  { number: "205", status: "inspection", assignedTo: "Maria Garcia", floor: 2, type: "Superior", guestName: null, checkOut: null, priority: "high", notes: "Arrival at 15:00" },
  { number: "301", status: "clean", assignedTo: "John Smith", floor: 3, type: "Suite", guestName: "K. Williams", checkOut: null, priority: "normal", notes: null },
  { number: "302", status: "dirty", assignedTo: null, floor: 3, type: "Standard", guestName: null, checkOut: "12:00", priority: "normal", notes: null },
];

type TeamMember = {
  name: string;
  assigned: number;
  completed: number;
  floor: string;
};

const team: TeamMember[] = [
  { name: "Maria Garcia", assigned: 4, completed: 2, floor: "1-2" },
  { name: "John Smith", assigned: 3, completed: 1, floor: "1-3" },
  { name: "Sarah Chen", assigned: 3, completed: 2, floor: "2" },
];

const housekeepingCopy = {
  en: {
    title: "Housekeeping",
    subtitle: "Room status board and task management",
    stats: {
      clean: "Clean",
      cleaning: "In Progress",
      dirty: "Dirty",
      inspection: "Inspection",
      checkout: "Check-out",
      maintenance: "Maintenance",
    },
    statusLabels: {
      clean: "Clean",
      cleaning: "In Progress",
      dirty: "Needs Cleaning",
      inspection: "Inspection",
      maintenance: "Maintenance",
      checkout: "Check-out",
    },
    priorityRooms: "Priority Rooms",
    priorityRoomsDescription: "VIP, high-priority, and pending check-outs",
    checkOutShort: "C/O",
    teamWorkload: "Team Workload",
    teamProgress: "Today's assignments and progress",
    floor: "Floor",
    rooms: "rooms",
    floorPending: "pending",
    room: "Room",
    guest: "Guest",
    assigned: "Assigned",
    checkoutAt: "Check-out at",
    updateStatus: "Update Status",
    priority: {
      vip: "VIP",
      high: "High",
      normal: "Normal",
    },
  },
  fr: {
    title: "Menage",
    subtitle: "Tableau d'etat des chambres et gestion des taches",
    stats: {
      clean: "Propre",
      cleaning: "En cours",
      dirty: "Sale",
      inspection: "Inspection",
      checkout: "Check-out",
      maintenance: "Maintenance",
    },
    statusLabels: {
      clean: "Propre",
      cleaning: "En cours",
      dirty: "Nettoyage requis",
      inspection: "Inspection",
      maintenance: "Maintenance",
      checkout: "Check-out",
    },
    priorityRooms: "Chambres prioritaires",
    priorityRoomsDescription: "VIP, haute priorite et check-outs en attente",
    checkOutShort: "C/O",
    teamWorkload: "Charge equipe",
    teamProgress: "Affectations et progression du jour",
    floor: "Etage",
    rooms: "chambres",
    floorPending: "en attente",
    room: "Chambre",
    guest: "Client",
    assigned: "Assigne",
    checkoutAt: "Check-out a",
    updateStatus: "Mettre a jour le statut",
    priority: {
      vip: "VIP",
      high: "Haute",
      normal: "Normale",
    },
  },
  es: {
    title: "Limpieza",
    subtitle: "Panel de estado de habitaciones y gestion de tareas",
    stats: {
      clean: "Limpia",
      cleaning: "En progreso",
      dirty: "Sucia",
      inspection: "Inspeccion",
      checkout: "Check-out",
      maintenance: "Mantenimiento",
    },
    statusLabels: {
      clean: "Limpia",
      cleaning: "En progreso",
      dirty: "Necesita limpieza",
      inspection: "Inspeccion",
      maintenance: "Mantenimiento",
      checkout: "Check-out",
    },
    priorityRooms: "Habitaciones prioritarias",
    priorityRoomsDescription: "VIP, alta prioridad y check-outs pendientes",
    checkOutShort: "C/O",
    teamWorkload: "Carga del equipo",
    teamProgress: "Asignaciones y progreso de hoy",
    floor: "Piso",
    rooms: "habitaciones",
    floorPending: "pendientes",
    room: "Habitacion",
    guest: "Huesped",
    assigned: "Asignado",
    checkoutAt: "Check-out a las",
    updateStatus: "Actualizar estado",
    priority: {
      vip: "VIP",
      high: "Alta",
      normal: "Normal",
    },
  },
} as const;

const statusColorConfig: Record<RoomStatus, { color: string }> = {
  clean: { color: "bg-emerald-500" },
  cleaning: { color: "bg-amber-500" },
  dirty: { color: "bg-red-500" },
  inspection: { color: "bg-blue-500" },
  maintenance: { color: "bg-slate-400" },
  checkout: { color: "bg-orange-500" },
};

const priorityBadge: Record<string, string> = {
  vip: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export default function HousekeepingDashboard() {
  requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = housekeepingCopy[locale];
  const statusConfig: Record<RoomStatus, { color: string; label: string }> = {
    clean: { color: statusColorConfig.clean.color, label: t.statusLabels.clean },
    cleaning: { color: statusColorConfig.cleaning.color, label: t.statusLabels.cleaning },
    dirty: { color: statusColorConfig.dirty.color, label: t.statusLabels.dirty },
    inspection: { color: statusColorConfig.inspection.color, label: t.statusLabels.inspection },
    maintenance: { color: statusColorConfig.maintenance.color, label: t.statusLabels.maintenance },
    checkout: { color: statusColorConfig.checkout.color, label: t.statusLabels.checkout },
  };

  const counts = {
    clean: rooms.filter((r) => r.status === "clean").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
    inspection: rooms.filter((r) => r.status === "inspection").length,
    checkout: rooms.filter((r) => r.status === "checkout").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  const urgentRooms = rooms.filter(
    (r) => r.priority !== "normal" || r.status === "checkout"
  );

  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-3 lg:grid-cols-6">
        <StatCard label={t.stats.clean} count={counts.clean} color="bg-emerald-500" />
        <StatCard label={t.stats.cleaning} count={counts.cleaning} color="bg-amber-500" />
        <StatCard label={t.stats.dirty} count={counts.dirty} color="bg-red-500" />
        <StatCard label={t.stats.inspection} count={counts.inspection} color="bg-blue-500" />
        <StatCard label={t.stats.checkout} count={counts.checkout} color="bg-orange-500" />
        <StatCard label={t.stats.maintenance} count={counts.maintenance} color="bg-slate-400" />
      </div>

      {/* Urgent / Priority Rooms */}
      {urgentRooms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.priorityRooms}</CardTitle>
            <CardDescription>{t.priorityRoomsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentRooms.map((room) => (
                <div
                  key={room.number}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusConfig[room.status].color}`} />
                    <span className="font-medium">{t.room} {room.number}</span>
                    <span className="text-sm text-muted-foreground">{room.type}</span>
                    {room.priority !== "normal" && (
                      <Badge variant="outline" className={`text-[10px] uppercase ${priorityBadge[room.priority] ?? ""}`}>
                        {room.priority === "vip" ? t.priority.vip : room.priority === "high" ? t.priority.high : t.priority.normal}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {room.notes && (
                      <span className="max-w-[240px] truncate text-xs text-muted-foreground">{room.notes}</span>
                    )}
                    {room.checkOut && (
                      <Badge variant="secondary" className="text-xs">
                        {t.checkOutShort} {room.checkOut}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {statusConfig[room.status].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Workload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.teamWorkload}</CardTitle>
          <CardDescription>{t.teamProgress}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.map((member) => {
              const pct = member.assigned > 0 ? Math.round((member.completed / member.assigned) * 100) : 0;
              return (
                <div key={member.name} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.floor} {member.floor} · {member.completed}/{member.assigned} {t.rooms}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Room Grid by Floor */}
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        return (
          <Card key={floor}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.floor} {floor}</CardTitle>
              <CardDescription>
                {floorRooms.filter((r) => r.status === "clean").length} {t.stats.clean.toLowerCase()} · {floorRooms.filter((r) => r.status !== "clean" && r.status !== "maintenance").length} {t.floorPending}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {floorRooms.map((room) => (
                  <div
                    key={room.number}
                    className="relative overflow-hidden rounded-lg border"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${statusConfig[room.status].color}`} />
                    <div className="py-3 pl-5 pr-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{t.room} {room.number}</span>
                        <div className="flex items-center gap-1.5">
                          {room.priority !== "normal" && (
                            <Badge variant="outline" className={`text-[10px] uppercase ${priorityBadge[room.priority] ?? ""}`}>
                              {room.priority === "vip" ? t.priority.vip : room.priority === "high" ? t.priority.high : t.priority.normal}
                            </Badge>
                          )}
                          <Badge
                            variant={room.status === "clean" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {statusConfig[room.status].label}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{room.type}</p>
                      {room.guestName && (
                        <p className="mt-1 text-xs text-muted-foreground">{t.guest}: {room.guestName}</p>
                      )}
                      {room.assignedTo && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.assigned}: {room.assignedTo}</p>
                      )}
                      {room.notes && (
                        <p className="mt-1 text-xs italic text-muted-foreground">{room.notes}</p>
                      )}
                      {room.checkOut && (
                        <p className="mt-1 text-xs font-medium text-orange-600">{t.checkoutAt} {room.checkOut}</p>
                      )}
                      <Button size="sm" variant="outline" className="mt-2.5 w-full text-xs">
                        {t.updateStatus}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <CardDescription className="text-xs">{label}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{count}</CardTitle>
      </CardHeader>
    </Card>
  );
}
