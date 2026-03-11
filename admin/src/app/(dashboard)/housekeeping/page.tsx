import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireStaffToken } from "@/lib/staff-auth";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { getStaffPrincipal } from "@/lib/staff-token";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RoomStatus = "clean" | "cleaning" | "dirty" | "inspection" | "maintenance" | "checkout";

type HousekeepingTask = {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  status: RoomStatus;
  assignedStaffUserId: string | null;
  assignedStaffName: string | null;
  stayId: string | null;
  guestName: string | null;
  checkOut: string | null;
  priority: "normal" | "high" | "vip";
  notes: string | null;
  updatedAt: string;
};

type StaffMember = {
  id: string;
  displayName: string | null;
  email: string;
  role: string;
  departments: string[];
};

type HousekeepingResponse = {
  rooms: HousekeepingTask[];
  staff: StaffMember[];
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const housekeepingCopy = {
  en: {
    title: "Housekeeping",
    subtitle: "Room status board and task management",
    syncFromStays: "Sync rooms from stays",
    synced: "Rooms synced from stays.",
    noRooms: "No rooms found. Click \"Sync rooms from stays\" to populate from reservations.",
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
    } as Record<string, string>,
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
    unassigned: "Unassigned",
    checkoutAt: "Check-out at",
    updateStatus: "Update Status",
    assignTo: "Assign to",
    priority: {
      vip: "VIP",
      high: "High",
      normal: "Normal",
    },
    statusOptions: {
      clean: "Clean",
      cleaning: "In Progress",
      dirty: "Dirty",
      inspection: "Inspection",
      maintenance: "Maintenance",
      checkout: "Check-out",
    } as Record<string, string>,
  },
  fr: {
    title: "Menage",
    subtitle: "Tableau d'etat des chambres et gestion des taches",
    syncFromStays: "Synchroniser depuis les sejours",
    synced: "Chambres synchronisees depuis les sejours.",
    noRooms: "Aucune chambre trouvee. Cliquez sur \"Synchroniser depuis les sejours\" pour peupler depuis les reservations.",
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
    } as Record<string, string>,
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
    unassigned: "Non assigne",
    checkoutAt: "Check-out a",
    updateStatus: "Mettre a jour le statut",
    assignTo: "Assigner a",
    priority: {
      vip: "VIP",
      high: "Haute",
      normal: "Normale",
    },
    statusOptions: {
      clean: "Propre",
      cleaning: "En cours",
      dirty: "Sale",
      inspection: "Inspection",
      maintenance: "Maintenance",
      checkout: "Check-out",
    } as Record<string, string>,
  },
  es: {
    title: "Limpieza",
    subtitle: "Panel de estado de habitaciones y gestion de tareas",
    syncFromStays: "Sincronizar desde estancias",
    synced: "Habitaciones sincronizadas desde estancias.",
    noRooms: "No se encontraron habitaciones. Haga clic en \"Sincronizar desde estancias\" para poblar desde reservas.",
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
    } as Record<string, string>,
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
    unassigned: "Sin asignar",
    checkoutAt: "Check-out a las",
    updateStatus: "Actualizar estado",
    assignTo: "Asignar a",
    priority: {
      vip: "VIP",
      high: "Alta",
      normal: "Normal",
    },
    statusOptions: {
      clean: "Limpia",
      cleaning: "En progreso",
      dirty: "Sucia",
      inspection: "Inspeccion",
      maintenance: "Mantenimiento",
      checkout: "Check-out",
    } as Record<string, string>,
  },
} as const;

const statusColorConfig: Record<RoomStatus, string> = {
  clean: "bg-emerald-500",
  cleaning: "bg-amber-500",
  dirty: "bg-red-500",
  inspection: "bg-blue-500",
  maintenance: "bg-slate-400",
  checkout: "bg-orange-500",
};

const priorityBadge: Record<string, string> = {
  vip: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

type HousekeepingPageProps = {
  searchParams?: { synced?: string; error?: string; updated?: string };
};

async function fetchHousekeeping(token: string): Promise<HousekeepingResponse | null> {
  try {
    const res = await fetch(`${backendUrl}/api/v1/staff/housekeeping`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as HousekeepingResponse;
  } catch {
    return null;
  }
}

export default async function HousekeepingDashboard({ searchParams }: HousekeepingPageProps) {
  const token = requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = housekeepingCopy[locale];
  const principal = getStaffPrincipal();
  const canManage = principal?.role === "admin" || principal?.role === "manager";

  const data = await fetchHousekeeping(token);
  const rooms = data?.rooms ?? [];
  const staff = data?.staff ?? [];

  const counts: Record<string, number> = {
    clean: 0, dirty: 0, cleaning: 0, inspection: 0, checkout: 0, maintenance: 0,
  };
  for (const room of rooms) {
    counts[room.status] = (counts[room.status] ?? 0) + 1;
  }

  const urgentRooms = rooms.filter(
    (r) => r.priority !== "normal" || r.status === "checkout"
  );

  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  const teamWorkload = staff.map((member) => {
    const assigned = rooms.filter((r) => r.assignedStaffUserId === member.id);
    const completed = assigned.filter((r) => r.status === "clean").length;
    const assignedFloors = [...new Set(assigned.map((r) => r.floor))].sort((a, b) => a - b);
    return {
      id: member.id,
      name: member.displayName ?? member.email,
      assigned: assigned.length,
      completed,
      floor: assignedFloors.length > 0 ? assignedFloors.join("-") : "—",
    };
  }).filter((m) => m.assigned > 0);

  async function syncFromStays() {
    "use server";

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/staff/housekeeping/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      redirect("/housekeeping?error=sync_failed");
    }

    redirect("/housekeeping?synced=1");
  }

  async function updateRoomStatus(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const taskId = String(formData.get("taskId") ?? "").trim();
    const newStatus = String(formData.get("status") ?? "").trim();

    if (!taskId || !newStatus) {
      redirect("/housekeeping?error=invalid_input");
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/housekeeping/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
      cache: "no-store",
    });

    if (!response.ok) {
      redirect("/housekeeping?error=update_failed");
    }

    redirect("/housekeeping?updated=1");
  }

  async function assignRoom(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const taskId = String(formData.get("taskId") ?? "").trim();
    const staffUserId = String(formData.get("staffUserId") ?? "").trim();

    if (!taskId) {
      redirect("/housekeeping?error=invalid_input");
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/housekeeping/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedStaffUserId: staffUserId || null }),
      cache: "no-store",
    });

    if (!response.ok) {
      redirect("/housekeeping?error=assign_failed");
    }

    redirect("/housekeeping?updated=1");
  }

  const allStatuses: RoomStatus[] = ["clean", "cleaning", "dirty", "inspection", "maintenance", "checkout"];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {canManage ? (
          <form action={syncFromStays}>
            <Button type="submit" variant="outline">{t.syncFromStays}</Button>
          </form>
        ) : null}
      </header>

      {searchParams?.synced === "1" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t.synced}
        </p>
      ) : null}
      {searchParams?.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {searchParams.error}
        </p>
      ) : null}

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-3 lg:grid-cols-6">
        <StatCard label={t.stats.clean} count={counts.clean ?? 0} color="bg-emerald-500" />
        <StatCard label={t.stats.cleaning} count={counts.cleaning ?? 0} color="bg-amber-500" />
        <StatCard label={t.stats.dirty} count={counts.dirty ?? 0} color="bg-red-500" />
        <StatCard label={t.stats.inspection} count={counts.inspection ?? 0} color="bg-blue-500" />
        <StatCard label={t.stats.checkout} count={counts.checkout ?? 0} color="bg-orange-500" />
        <StatCard label={t.stats.maintenance} count={counts.maintenance ?? 0} color="bg-slate-400" />
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.noRooms}
          </CardContent>
        </Card>
      ) : null}

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
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColorConfig[room.status]}`} />
                    <span className="font-medium">{t.room} {room.roomNumber}</span>
                    <span className="text-sm text-muted-foreground">{room.roomType}</span>
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
                      {t.statusLabels[room.status] ?? room.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Workload */}
      {teamWorkload.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.teamWorkload}</CardTitle>
            <CardDescription>{t.teamProgress}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamWorkload.map((member) => {
                const pct = member.assigned > 0 ? Math.round((member.completed / member.assigned) * 100) : 0;
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
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
      )}

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
                    key={room.id}
                    className="relative overflow-hidden rounded-lg border"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${statusColorConfig[room.status]}`} />
                    <div className="py-3 pl-5 pr-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{t.room} {room.roomNumber}</span>
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
                            {t.statusLabels[room.status] ?? room.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{room.roomType}</p>
                      {room.guestName && (
                        <p className="mt-1 text-xs text-muted-foreground">{t.guest}: {room.guestName}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.assigned}: {room.assignedStaffName ?? t.unassigned}
                      </p>
                      {room.notes && (
                        <p className="mt-1 text-xs italic text-muted-foreground">{room.notes}</p>
                      )}
                      {room.checkOut && (
                        <p className="mt-1 text-xs font-medium text-orange-600">{t.checkoutAt} {room.checkOut}</p>
                      )}

                      {/* Status update */}
                      <form action={updateRoomStatus} className="mt-2.5">
                        <input type="hidden" name="taskId" value={room.id} />
                        <div className="flex gap-1.5">
                          <select
                            name="status"
                            defaultValue={room.status}
                            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
                          >
                            {allStatuses.map((s) => (
                              <option key={s} value={s}>{t.statusOptions[s] ?? s}</option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline" className="text-xs shrink-0">
                            {t.updateStatus}
                          </Button>
                        </div>
                      </form>

                      {/* Staff assignment */}
                      {canManage && staff.length > 0 ? (
                        <form action={assignRoom} className="mt-1.5">
                          <input type="hidden" name="taskId" value={room.id} />
                          <div className="flex gap-1.5">
                            <select
                              name="staffUserId"
                              defaultValue={room.assignedStaffUserId ?? ""}
                              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
                            >
                              <option value="">— {t.unassigned} —</option>
                              {staff.map((s) => (
                                <option key={s.id} value={s.id}>{s.displayName ?? s.email}</option>
                              ))}
                            </select>
                            <Button type="submit" size="sm" variant="outline" className="text-xs shrink-0">
                              {t.assignTo}
                            </Button>
                          </div>
                        </form>
                      ) : null}
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
