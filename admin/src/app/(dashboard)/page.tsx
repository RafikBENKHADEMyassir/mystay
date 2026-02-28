import Link from "next/link";

import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "./DashboardStats";

type Tile = {
  title: string;
  href: string;
  description: string;
  roles?: string[];
  departments?: string[];
};

const tiles: Tile[] = [
  {
    title: "Inbox",
    href: "/inbox",
    description: "Unified guest conversations, with live updates."
  },
  {
    title: "Reservations",
    href: "/reservations",
    description: "Arrivals, in-house stays, and check-outs.",
    departments: ["reception"]
  },
  {
    title: "Pay by link",
    href: "/payment-links",
    description: "Create payment links for deposits and extras.",
    roles: ["admin", "manager"],
    departments: ["reception"]
  },
  {
    title: "Requests",
    href: "/requests",
    description: "Structured service requests and handover notes."
  },
  {
    title: "Integrations",
    href: "/integrations",
    description: "Configure PMS, digital keys, and per-hotel providers.",
    roles: ["admin", "manager"]
  },
  {
    title: "Reception",
    href: "/inbox?dept=reception",
    description: "Arrivals/departures, check-in validation, check-out and keys.",
    departments: ["reception"]
  },
  {
    title: "Housekeeping",
    href: "/housekeeping",
    description: "Room status board and task assignments.",
    departments: ["housekeeping"]
  },
  {
    title: "Concierge",
    href: "/inbox?dept=concierge",
    description: "Chats with quick actions (transfers, restaurants, activities).",
    departments: ["concierge"]
  }
];

export default function AdminHomePage() {
  requireStaffToken();
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const departments = principal?.departments ?? [];
  const isAdminOrManager = role === "admin" || role === "manager";

  const visibleTiles = tiles.filter((tile) => {
    if (tile.roles && !tile.roles.includes(role)) return false;
    if (isAdminOrManager) return true;
    if (!tile.departments) return true;
    return tile.departments.some((d) => departments.includes(d));
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">MyStay</p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Hotel performance at a glance. Metrics update in real time.
        </p>
      </header>

      <DashboardStats />

      <section className="grid gap-3 sm:grid-cols-2">
        {visibleTiles.map((tile) => (
          <Link key={tile.title} href={tile.href}>
            <Card className="transition hover:bg-accent/20">
              <CardHeader className="p-5">
                <CardTitle className="text-base">{tile.title}</CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
