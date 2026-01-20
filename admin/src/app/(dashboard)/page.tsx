import Link from "next/link";

import { requireStaffToken } from "@/lib/staff-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tiles = [
  {
    title: "Inbox",
    href: "/inbox",
    description: "Requests across departments, with live updates."
  },
  {
    title: "Messages",
    href: "/messages",
    description: "Realtime guest conversations per department."
  },
  {
    title: "Integrations",
    href: "/integrations",
    description: "Configure PMS, digital keys, and per-hotel providers."
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
] as const;

export default function AdminHomePage() {
  requireStaffToken();

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
        {tiles.map((tile) => (
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
