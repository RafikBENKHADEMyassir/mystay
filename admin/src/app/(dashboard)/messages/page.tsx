import Link from "next/link";

import { LiveInboxRefresh } from "@/components/live-inbox-refresh";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffToken } from "@/lib/staff-auth";

type Thread = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
};

type MessagesPageProps = {
  searchParams?: {
    dept?: string;
    status?: string;
    q?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

async function getThreads(token: string): Promise<Thread[]> {
  const response = await fetch(`${backendUrl}/api/v1/threads`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload?.items)) return [];

  return payload.items as Thread[];
}

function preview(text: string | null, maxLen = 120) {
  const value = (text ?? "").trim();
  if (!value) return "";
  return value.length > maxLen ? `${value.slice(0, maxLen - 1)}…` : value;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const token = requireStaffToken();

  let allThreads: Thread[] = [];
  let error: string | null = null;

  try {
    allThreads = await getThreads(token);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const departmentFilter = searchParams?.dept?.trim() ?? "";
  const statusFilter = searchParams?.status?.trim() ?? "";
  const query = searchParams?.q?.trim().toLowerCase() ?? "";

  const departments = Array.from(new Set(allThreads.map((thread) => thread.department).filter(Boolean))).sort();
  const statuses = Array.from(new Set(allThreads.map((thread) => thread.status).filter(Boolean))).sort();

  const threads = allThreads
    .filter((thread) => (departmentFilter ? thread.department === departmentFilter : true))
    .filter((thread) => (statusFilter ? thread.status === statusFilter : true))
    .filter((thread) => {
      if (!query) return true;
      return (
        thread.title.toLowerCase().includes(query) ||
        thread.id.toLowerCase().includes(query) ||
        thread.department.toLowerCase().includes(query) ||
        (thread.lastMessage ?? "").toLowerCase().includes(query) ||
        (thread.stayId ?? "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aTime = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
      const bTime = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
      return bTime - aTime;
    });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <LiveInboxRefresh />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">Guest threads with live updates.</p>
        </div>
        <Badge variant="secondary">
          {threads.length} thread{threads.length === 1 ? "" : "s"}
        </Badge>
      </header>

      <Card>
        <CardHeader className="space-y-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and narrow down the live thread stream.</CardDescription>
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
            <CardTitle className="text-base">Threads</CardTitle>
            <CardDescription>Sorted by most recent message activity.</CardDescription>
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
                <TableHead>Thread</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {threads.map((thread) => (
                <TableRow key={thread.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        <Link href={`/messages/${encodeURIComponent(thread.id)}`} className="hover:underline">
                          {thread.title}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Link href={`/messages/${encodeURIComponent(thread.id)}`} className="font-mono hover:underline">
                          {thread.id}
                        </Link>
                        {thread.lastMessage ? <span> · {preview(thread.lastMessage)}</span> : null}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{thread.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={thread.status === "resolved" ? "secondary" : "outline"}>
                      {thread.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(thread.lastMessageAt ?? thread.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {threads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No threads match the current filter.
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

