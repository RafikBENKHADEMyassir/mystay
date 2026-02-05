import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type SyncRun = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  summary: unknown;
  errorMessage: string | null;
  errorDetails?: string | null;
};

type SyncStatusResponse = {
  hotel: { id: string; name: string };
  latest: SyncRun | null;
  runs: SyncRun[];
};

type SyncPageProps = {
  params: Promise<{ hotelId: string }>;
  searchParams?: {
    ran?: string;
    error?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function getString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function getSummary(summary: unknown) {
  if (!isRecord(summary)) return null;

  const fetched = isRecord(summary.fetched) ? summary.fetched : null;
  const upserted = isRecord(summary.upserted) ? summary.upserted : null;

  return {
    provider: getString(summary.provider),
    resortId: getString(summary.resortId),
    baseUrl: getString(summary.baseUrl),
    fetchedArrivals: fetched ? getNumber(fetched.arrivals) : null,
    fetchedDepartures: fetched ? getNumber(fetched.departures) : null,
    upsertedStays: upserted ? getNumber(upserted.stays) : null,
    linkedGuests: upserted ? getNumber(upserted.linkedGuests) : null
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function statusBadge(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "ok") return { label: "OK", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (normalized === "running") return { label: "Running", className: "border-blue-200 bg-blue-50 text-blue-800" };
  if (normalized === "error") return { label: "Error", className: "border-destructive/30 bg-destructive/10 text-destructive" };
  return { label: status || "—", className: "border-muted/40 bg-muted/20 text-muted-foreground" };
}

async function getStatus(token: string, hotelId: string): Promise<SyncStatusResponse | null> {
  const response = await fetch(`${backendUrl}/api/v1/admin/hotels/${encodeURIComponent(hotelId)}/pms-sync`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as SyncStatusResponse;
}

export default async function DataSynchronizationPage({ params, searchParams }: SyncPageProps) {
  const { hotelId } = await params;
  const token = getStaffToken();
  if (!token) redirect("/login?type=platform");

  const ran = (searchParams?.ran ?? "").trim() === "1";
  const errorParam = (searchParams?.error ?? "").trim();

  let data: SyncStatusResponse | null = null;
  let error: string | null = null;

  try {
    data = await getStatus(token, hotelId);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` then refresh.";
  }

  async function runSync() {
    "use server";

    const token = getStaffToken();
    if (!token) redirect("/login?type=platform");

    const response = await fetch(`${backendUrl}/api/v1/admin/hotels/${encodeURIComponent(hotelId)}/pms-sync/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    const ok = Boolean(payload?.ok && response.ok);
    if (!ok) {
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/platform/hotels/${encodeURIComponent(hotelId)}/setup/sync?error=${encodeURIComponent(code)}`);
    }

    redirect(`/platform/hotels/${encodeURIComponent(hotelId)}/setup/sync?ran=1`);
  }

  const latest = data?.latest ?? null;
  const runs = data?.runs ?? [];
  const latestSummary = latest ? getSummary(latest.summary) : null;

  const latestStatusBadge = latest ? statusBadge(latest.status) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Data synchronization</h2>
          <p className="text-sm text-muted-foreground">Monitor PMS sync health and trigger manual runs.</p>
        </div>
        <form action={runSync}>
          <Button type="submit" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync now
          </Button>
        </form>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ran ? <p className="text-sm text-emerald-700">Sync triggered successfully.</p> : null}
      {errorParam ? <p className="text-sm text-destructive">{errorParam.replaceAll("_", " ")}</p> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Last sync</CardTitle>
            <CardDescription>Most recent run timestamp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-semibold">{formatDateTime(latest?.finishedAt ?? null)}</p>
            <p className="text-xs text-muted-foreground">Started {formatDateTime(latest?.startedAt ?? null)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>OK / Error per run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestStatusBadge ? <Badge className={latestStatusBadge.className}>{latestStatusBadge.label}</Badge> : <Badge variant="outline">—</Badge>}
            {latest?.errorMessage ? <p className="text-xs text-destructive">{latest.errorMessage}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Last run summary</CardTitle>
            <CardDescription>Counts for arrivals/departures and upserts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Arrivals: <span className="font-semibold">{latestSummary?.fetchedArrivals ?? "—"}</span>
            </p>
            <p>
              Departures: <span className="font-semibold">{latestSummary?.fetchedDepartures ?? "—"}</span>
            </p>
            <p>
              Upserted stays: <span className="font-semibold">{latestSummary?.upsertedStays ?? "—"}</span>
            </p>
            <p>
              Linked guests: <span className="font-semibold">{latestSummary?.linkedGuests ?? "—"}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>Resolved PMS provider configuration for this property.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Provider</p>
            <p className="text-sm">{latestSummary?.provider ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Resort ID</p>
            <p className="text-sm font-mono">{latestSummary?.resortId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Base URL</p>
            <p className="text-sm font-mono">{latestSummary?.baseUrl ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {latest?.status === "error" && (latest.errorDetails || latest.errorMessage) ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Error logs</CardTitle>
            <CardDescription className="text-destructive/80">Visible to platform admins only.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-md border bg-background p-3 text-xs">
              {(latest.errorDetails ?? latest.errorMessage ?? "").trim()}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent runs</CardTitle>
          <CardDescription>Latest 25 PMS sync attempts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Started</TableHead>
                <TableHead className="hidden md:table-cell">Finished</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const badge = statusBadge(run.status);
                return (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">{run.id}</TableCell>
                    <TableCell>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDateTime(run.startedAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDateTime(run.finishedAt ?? null)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No sync runs yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Tip: start the mock PMS with <span className="font-mono">npm -w backend run mock-pms</span> to see real data.
      </p>
    </div>
  );
}

