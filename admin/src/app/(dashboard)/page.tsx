import Link from "next/link";

import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Tile = {
  title: string;
  href: string;
  description: string;
  roles?: string[];
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
    description: "Arrivals, in-house stays, and check-outs."
  },
  {
    title: "Pay by link",
    href: "/payment-links",
    description: "Create payment links for deposits and extras."
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
    description: "Arrivals/departures, check-in validation, check-out and keys."
  },
  {
    title: "Housekeeping",
    href: "/inbox?dept=housekeeping",
    description: "Room status board and task assignments."
  },
  {
    title: "Concierge",
    href: "/inbox?dept=concierge",
    description: "Chats with quick actions (transfers, restaurants, activities)."
  }
];

export default function AdminHomePage() {
  requireStaffToken();
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";

  const visibleTiles = tiles.filter((tile) => {
    if (!tile.roles) return true;
    return tile.roles.includes(role);
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">MyStay</p>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Staff consoles and management views for triage, fulfillment, and service SLAs.
        </p>
      </header>

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

      <Card className="bg-muted/20">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-base">Next development slice</CardTitle>
          <CardDescription>What to wire next for a working staff console.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-3 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Add auth hardening + RBAC (staff/admin) with hotel scoping everywhere.</li>
            <li>Implement real notifications delivery (Sendgrid/Twilio/FCM) + receipts on top of the outbox.</li>
            <li>Build the first real PMS connector (keep `mock` as fallback) and digital key issuance workflow.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
