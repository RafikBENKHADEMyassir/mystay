import Link from "next/link";

import { LiveInboxRefresh } from "@/components/live-inbox-refresh";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffToken } from "@/lib/staff-auth";

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

type RequestsPageProps = {
  searchParams?: {
    dept?: string;
    status?: string;
    q?: string;
    page?: string;
  };
};

const PAGE_SIZE = 15;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
};

const DEPARTMENT_COLORS: Record<string, string> = {
  concierge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  housekeeping: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  restaurants: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700",
  front_desk: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
  spa: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300 dark:border-pink-700",
};

const DEFAULT_BADGE = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600";

function statusBadgeClass(status: string) {
  return STATUS_COLORS[status] ?? DEFAULT_BADGE;
}

function departmentBadgeClass(department: string) {
  return DEPARTMENT_COLORS[department.toLowerCase()] ?? DEFAULT_BADGE;
}

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

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
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

  const filteredTickets = allTickets
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

  const currentPage = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const tickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <LiveInboxRefresh />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="text-sm text-muted-foreground">Structured service requests across departments.</p>
        </div>
        <Badge variant="secondary">
          {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
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
                        <Link href={`/requests/${encodeURIComponent(ticket.id)}`} className="hover:underline">
                          {ticket.title}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Link href={`/requests/${encodeURIComponent(ticket.id)}`} className="font-mono hover:underline">
                          {ticket.id}
                        </Link>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{ticket.roomNumber}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={departmentBadgeClass(ticket.department)}>
                      {ticket.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadgeClass(ticket.status)}>
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {safePage > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/requests?${new URLSearchParams({ ...(departmentFilter && { dept: departmentFilter }), ...(statusFilter && { status: statusFilter }), ...(searchParams?.q && { q: searchParams.q }), page: String(safePage - 1) }).toString()}`}>
                  Previous
                </Link>
              </Button>
            ) : null}
            {safePage < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/requests?${new URLSearchParams({ ...(departmentFilter && { dept: departmentFilter }), ...(statusFilter && { status: statusFilter }), ...(searchParams?.q && { q: searchParams.q }), page: String(safePage + 1) }).toString()}`}>
                  Next
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

