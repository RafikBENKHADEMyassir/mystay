import Link from "next/link";

import { requireStaffToken } from "@/lib/staff-auth";
import { LiveInboxRefresh } from "@/components/live-inbox-refresh";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Ticket = {
  id: string;
  hotelId: string;
  roomNumber: string;
  department: string;
  status: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type InboxPageProps = {
  searchParams?: {
    dept?: string;
    status?: string;
    q?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

async function getTickets(token: string): Promise<Ticket[]> {
  const response = await fetch(`${backendUrl}/api/v1/tickets`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload?.items)) return [];

  return payload.items as Ticket[];
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const token = requireStaffToken();

  let allTickets: Ticket[] = [];
  let error: string | null = null;

  try {
    allTickets = await getTickets(token);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const departmentFilter = searchParams?.dept?.trim() ?? "";
  const statusFilter = searchParams?.status?.trim() ?? "";
  const query = searchParams?.q?.trim().toLowerCase() ?? "";

  const departments = Array.from(new Set(allTickets.map((ticket) => ticket.department).filter(Boolean))).sort();
  const statuses = Array.from(new Set(allTickets.map((ticket) => ticket.status).filter(Boolean))).sort();

  const tickets = allTickets
    .filter((ticket) => (departmentFilter ? ticket.department === departmentFilter : true))
    .filter((ticket) => (statusFilter ? ticket.status === statusFilter : true))
    .filter((ticket) => {
      if (!query) return true;
      return (
        ticket.title.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.roomNumber.toLowerCase().includes(query) ||
        ticket.department.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <LiveInboxRefresh />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">All open requests across departments.</p>
        </div>
        <Badge variant="secondary">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
        </Badge>
      </header>

      <Card>
        <CardHeader className="space-y-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and narrow down the live ticket stream.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <InboxFilters departments={departments} statuses={statuses} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Tickets</CardTitle>
            <CardDescription>Sorted by most recently updated.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {departmentFilter ? <Badge variant="outline">{departmentFilter}</Badge> : null}
            {statusFilter ? <Badge variant="outline">{statusFilter.replace("_", " ")}</Badge> : null}
            {query ? (
              <Badge variant="secondary" className="font-mono">
                q={query}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead className="hidden sm:table-cell">Room</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        <Link href={`/inbox/${encodeURIComponent(ticket.id)}`} className="hover:underline">
                          {ticket.title}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Link href={`/inbox/${encodeURIComponent(ticket.id)}`} className="font-mono hover:underline">
                          {ticket.id}
                        </Link>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{ticket.roomNumber}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{ticket.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === "resolved" ? "secondary" : "outline"}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No tickets match the current filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
