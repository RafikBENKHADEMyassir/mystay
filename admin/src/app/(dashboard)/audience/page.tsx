import { Download, UserCheck, UserX, Users } from "lucide-react";
import Link from "next/link";

import { AudienceFilters } from "@/components/audience/audience-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffToken } from "@/lib/staff-auth";

type AudienceContact = {
  id: string;
  hotelId: string;
  guestId: string | null;
  status: string;
  statusAt: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  channel: string;
  syncedWithPms: boolean;
  createdAt: string;
  updatedAt: string;
};

type AudienceStats = {
  totalContacts: number;
  optedInThisWeek: number;
  skippedThisWeek: number;
  syncedAt: string | null;
};

type AudienceResponse = {
  stats: AudienceStats;
  items: AudienceContact[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AudiencePageProps = {
  searchParams?: {
    from?: string;
    to?: string;
    search?: string;
    page?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function buildSearchParams(current: AudiencePageProps["searchParams"], patch: Record<string, string | null | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(current ?? {})) {
    if (typeof value !== "string" || !value.trim()) continue;
    next.set(key, value);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, value);
  }

  return next;
}

async function getAudience(token: string, query: URLSearchParams): Promise<AudienceResponse> {
  const qs = query.toString();
  const response = await fetch(qs ? `${backendUrl}/api/v1/staff/audience?${qs}` : `${backendUrl}/api/v1/staff/audience`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as AudienceResponse;
}

function formatSync(value: string | null) {
  if (!value) return "Not synced yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not synced yet";
  return `Synced: ${parsed.toLocaleString()}`;
}

export default async function AudiencePage({ searchParams }: AudiencePageProps) {
  const token = requireStaffToken();
  const page = Number(searchParams?.page ?? "1") || 1;

  const query = buildSearchParams(searchParams, { page: String(page), pageSize: "25", error: null });

  let data: AudienceResponse | null = null;
  let error: string | null = null;

  try {
    data = await getAudience(token, query);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const items = data?.items ?? [];
  const stats = data?.stats ?? { totalContacts: 0, optedInThisWeek: 0, skippedThisWeek: 0, syncedAt: null };
  const totalPages = data?.totalPages ?? 1;

  const exportQuery = buildSearchParams(searchParams, { page: null, pageSize: null, error: null });
  const exportHref = exportQuery.toString() ? `/api/staff/audience/export?${exportQuery.toString()}` : "/api/staff/audience/export";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Audience</h1>
          <p className="text-sm text-muted-foreground">Guest contact database with opt-in status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">{formatSync(stats.syncedAt)}</p>
          <Button asChild className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <a href={exportHref}>
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.totalContacts}</p>
            <p className="text-xs text-muted-foreground">Contacts in your hotel database.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opted in this week</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.optedInThisWeek}</p>
            <p className="text-xs text-muted-foreground">New opt-ins since Monday.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skipped this week</CardTitle>
            <UserX className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.skippedThisWeek}</p>
            <p className="text-xs text-muted-foreground">Guests who skipped opt-in.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Opt-in date plus name/email search.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AudienceFilters />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Contacts</CardTitle>
            <CardDescription>Export for CRM, newsletter, or PMS sync review.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/audience?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>Previous</Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/audience?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>Next</Link>
            </Button>
            <Badge variant="secondary">
              {data?.total ?? 0} contact{(data?.total ?? 0) === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Opt-in date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[160px]">Channel</TableHead>
                <TableHead className="w-[160px]">Synced with PMS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((contact) => {
                const optInDate = new Date(contact.statusAt ?? contact.createdAt);
                const synced = contact.syncedWithPms;
                return (
                  <TableRow key={contact.id}>
                    <TableCell className="text-xs text-muted-foreground">{optInDate.toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {contact.channel.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          synced
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }
                      >
                        {synced ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No contacts found.
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
