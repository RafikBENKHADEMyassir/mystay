// admin/src/app/(dashboard)/housekeeping/page.tsx
import { requireStaffToken } from "@/lib/staff-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const rooms = [
  { number: "101", status: "clean", assignedTo: "Maria Garcia", floor: 1 },
  { number: "102", status: "cleaning", assignedTo: "John Smith", floor: 1 },
  { number: "103", status: "dirty", assignedTo: null, floor: 1 },
  { number: "104", status: "clean", assignedTo: "Maria Garcia", floor: 1 },
  { number: "201", status: "dirty", assignedTo: null, floor: 2 },
  { number: "202", status: "cleaning", assignedTo: "Sarah Chen", floor: 2 },
  { number: "203", status: "clean", assignedTo: "Sarah Chen", floor: 2 },
  { number: "204", status: "maintenance", assignedTo: null, floor: 2 },
];

const statusColors = {
  clean: "bg-green-500",
  cleaning: "bg-yellow-500",
  dirty: "bg-red-500",
  maintenance: "bg-gray-500",
};

const statusLabels = {
  clean: "Clean",
  cleaning: "In Progress",
  dirty: "Needs Cleaning",
  maintenance: "Maintenance",
};

export default function HousekeepingDashboard() {
  requireStaffToken();

  const cleanRooms = rooms.filter((r) => r.status === "clean").length;
  const dirtyRooms = rooms.filter((r) => r.status === "dirty").length;
  const inProgressRooms = rooms.filter((r) => r.status === "cleaning").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Housekeeping Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Room status board and task management
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clean</CardDescription>
            <CardTitle className="text-3xl">{cleanRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{inProgressRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Needs Cleaning</CardDescription>
            <CardTitle className="text-3xl">{dirtyRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle className="text-3xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Room Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Room Status Grid</CardTitle>
          <CardDescription>Real-time view of all rooms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rooms.map((room) => (
              <Card key={room.number} className="relative overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full w-2 ${statusColors[room.status as keyof typeof statusColors]}`}
                />
                <CardHeader className="pb-2 pl-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Room {room.number}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Floor {room.floor}
                    </Badge>
                  </div>
                  <Badge
                    variant={room.status === "clean" ? "default" : "outline"}
                    className="w-fit"
                  >
                    {statusLabels[room.status as keyof typeof statusLabels]}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-3 pl-4">
                  {room.assignedTo && (
                    <p className="text-xs text-muted-foreground">
                      Assigned: {room.assignedTo}
                    </p>
                  )}
                  <Button size="sm" variant="outline" className="mt-2 w-full">
                    Update Status
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
