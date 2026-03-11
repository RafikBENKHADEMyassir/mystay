import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cookies } from "next/headers";

import { getStaffToken } from "@/lib/staff-token";
import { adminLocaleCookieName, resolveAdminLocale, type AdminLocale } from "@/lib/admin-locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const syncCopy = {
  en: {
    title: "Data synchronization",
    subtitle: "Monitor PMS sync health and trigger manual runs.",
    syncNow: "Sync now",
    syncTriggered: "Sync triggered successfully.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` then refresh.",
    labels: {
      lastSync: "Last sync",
      lastSyncDescription: "Most recent run timestamp.",
      started: "Started",
      status: "Status",
      statusDescription: "OK / Error per run.",
      lastRunSummary: "Last run summary",
      lastRunSummaryDescription: "Counts for arrivals/departures and upserts.",
      arrivals: "Arrivals",
      departures: "Departures",
      upsertedStays: "Upserted stays",
      linkedGuests: "Linked guests",
      configuration: "Configuration",
      configurationDescription: "Resolved PMS provider configuration for this property.",
      provider: "Provider",
      resortId: "Resort ID",
      baseUrl: "Base URL",
      errorLogs: "Error logs",
      errorLogsDescription: "Visible to platform admins only.",
      recentRuns: "Recent runs",
      recentRunsDescription: "Latest 25 PMS sync attempts.",
      run: "Run",
      startedAt: "Started",
      finishedAt: "Finished",
      noRuns: "No sync runs yet.",
      tip: "Tip: start the mock PMS with",
      tipSuffix: "to see real data.",
    },
    statuses: {
      ok: "OK",
      running: "Running",
      error: "Error",
    },
    errors: {
      backend_error_401: "Unauthorized",
      backend_error_403: "Forbidden",
      backend_error_404: "Not found",
      backend_error_500: "Server error",
    },
  },
  fr: {
    title: "Synchronisation des donnees",
    subtitle: "Suivez la sante de la synchro PMS et declenchez des executions manuelles.",
    syncNow: "Synchroniser",
    syncTriggered: "Synchronisation declenchee avec succes.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` puis actualisez.",
    labels: {
      lastSync: "Derniere synchro",
      lastSyncDescription: "Horodatage de la derniere execution.",
      started: "Demarre",
      status: "Statut",
      statusDescription: "OK / Erreur par execution.",
      lastRunSummary: "Resume de la derniere execution",
      lastRunSummaryDescription: "Totaux arrivees/departs et upserts.",
      arrivals: "Arrivees",
      departures: "Departs",
      upsertedStays: "Sejours mis a jour",
      linkedGuests: "Clients lies",
      configuration: "Configuration",
      configurationDescription: "Configuration PMS resolue pour cet etablissement.",
      provider: "Fournisseur",
      resortId: "Resort ID",
      baseUrl: "URL de base",
      errorLogs: "Logs d'erreur",
      errorLogsDescription: "Visible uniquement pour les admins plateforme.",
      recentRuns: "Executions recentes",
      recentRunsDescription: "25 dernieres tentatives de synchro PMS.",
      run: "Execution",
      startedAt: "Debut",
      finishedAt: "Fin",
      noRuns: "Aucune execution de synchro pour le moment.",
      tip: "Astuce: demarrez le mock PMS avec",
      tipSuffix: "pour voir des donnees reelles.",
    },
    statuses: {
      ok: "OK",
      running: "En cours",
      error: "Erreur",
    },
    errors: {
      backend_error_401: "Non autorise",
      backend_error_403: "Interdit",
      backend_error_404: "Introuvable",
      backend_error_500: "Erreur serveur",
    },
  },
  es: {
    title: "Sincronizacion de datos",
    subtitle: "Supervisa la salud de sincronizacion PMS y ejecuta corridas manuales.",
    syncNow: "Sincronizar",
    syncTriggered: "Sincronizacion lanzada correctamente.",
    backendUnreachable: "Backend inaccesible. Inicia `npm run dev:backend` y actualiza.",
    labels: {
      lastSync: "Ultima sincronizacion",
      lastSyncDescription: "Marca temporal de la corrida mas reciente.",
      started: "Iniciada",
      status: "Estado",
      statusDescription: "OK / Error por corrida.",
      lastRunSummary: "Resumen de la ultima corrida",
      lastRunSummaryDescription: "Conteos de llegadas/salidas y upserts.",
      arrivals: "Llegadas",
      departures: "Salidas",
      upsertedStays: "Estancias actualizadas",
      linkedGuests: "Huespedes vinculados",
      configuration: "Configuracion",
      configurationDescription: "Configuracion PMS resuelta para esta propiedad.",
      provider: "Proveedor",
      resortId: "Resort ID",
      baseUrl: "URL base",
      errorLogs: "Registros de error",
      errorLogsDescription: "Visible solo para admins de plataforma.",
      recentRuns: "Corridas recientes",
      recentRunsDescription: "Ultimos 25 intentos de sincronizacion PMS.",
      run: "Corrida",
      startedAt: "Inicio",
      finishedAt: "Fin",
      noRuns: "Aun no hay corridas de sincronizacion.",
      tip: "Consejo: inicia el PMS simulado con",
      tipSuffix: "para ver datos reales.",
    },
    statuses: {
      ok: "OK",
      running: "En curso",
      error: "Error",
    },
    errors: {
      backend_error_401: "No autorizado",
      backend_error_403: "Prohibido",
      backend_error_404: "No encontrado",
      backend_error_500: "Error del servidor",
    },
  },
} as const;

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

function formatDateTime(value: string | null, locale: AdminLocale) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function statusBadge(status: string, locale: AdminLocale) {
  const t = syncCopy[locale];
  const normalized = status.trim().toLowerCase();
  if (normalized === "ok") return { label: t.statuses.ok, className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (normalized === "running") return { label: t.statuses.running, className: "border-blue-200 bg-blue-50 text-blue-800" };
  if (normalized === "error") return { label: t.statuses.error, className: "border-destructive/30 bg-destructive/10 text-destructive" };
  return { label: status || "—", className: "border-muted/40 bg-muted/20 text-muted-foreground" };
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
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
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = syncCopy[locale];
  if (!token) redirect("/login?type=platform");

  const ran = (searchParams?.ran ?? "").trim() === "1";
  const errorParam = (searchParams?.error ?? "").trim();

  let data: SyncStatusResponse | null = null;
  let error: string | null = null;

  try {
    data = await getStatus(token, hotelId);
  } catch {
    error = t.backendUnreachable;
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

  const latestStatusBadge = latest ? statusBadge(latest.status, locale) : null;
  const errorMessage = errorParam
    ? t.errors[errorParam as keyof (typeof syncCopy)[AdminLocale]["errors"]] ?? humanize(errorParam)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <form action={runSync}>
          <Button type="submit" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t.syncNow}
          </Button>
        </form>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ran ? <p className="text-sm text-emerald-700">{t.syncTriggered}</p> : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.labels.lastSync}</CardTitle>
            <CardDescription>{t.labels.lastSyncDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-semibold">{formatDateTime(latest?.finishedAt ?? null, locale)}</p>
            <p className="text-xs text-muted-foreground">
              {t.labels.started} {formatDateTime(latest?.startedAt ?? null, locale)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.labels.status}</CardTitle>
            <CardDescription>{t.labels.statusDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestStatusBadge ? <Badge className={latestStatusBadge.className}>{latestStatusBadge.label}</Badge> : <Badge variant="outline">—</Badge>}
            {latest?.errorMessage ? <p className="text-xs text-destructive">{latest.errorMessage}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.labels.lastRunSummary}</CardTitle>
            <CardDescription>{t.labels.lastRunSummaryDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              {t.labels.arrivals}: <span className="font-semibold">{latestSummary?.fetchedArrivals ?? "—"}</span>
            </p>
            <p>
              {t.labels.departures}: <span className="font-semibold">{latestSummary?.fetchedDepartures ?? "—"}</span>
            </p>
            <p>
              {t.labels.upsertedStays}: <span className="font-semibold">{latestSummary?.upsertedStays ?? "—"}</span>
            </p>
            <p>
              {t.labels.linkedGuests}: <span className="font-semibold">{latestSummary?.linkedGuests ?? "—"}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.labels.configuration}</CardTitle>
          <CardDescription>{t.labels.configurationDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{t.labels.provider}</p>
            <p className="text-sm">{latestSummary?.provider ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{t.labels.resortId}</p>
            <p className="text-sm font-mono">{latestSummary?.resortId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{t.labels.baseUrl}</p>
            <p className="text-sm font-mono">{latestSummary?.baseUrl ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {latest?.status === "error" && (latest.errorDetails || latest.errorMessage) ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">{t.labels.errorLogs}</CardTitle>
            <CardDescription className="text-destructive/80">{t.labels.errorLogsDescription}</CardDescription>
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
          <CardTitle className="text-base">{t.labels.recentRuns}</CardTitle>
          <CardDescription>{t.labels.recentRunsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.labels.run}</TableHead>
                <TableHead>{t.labels.status}</TableHead>
                <TableHead className="hidden md:table-cell">{t.labels.startedAt}</TableHead>
                <TableHead className="hidden md:table-cell">{t.labels.finishedAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const badge = statusBadge(run.status, locale);
                return (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">{run.id}</TableCell>
                    <TableCell>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDateTime(run.startedAt, locale)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDateTime(run.finishedAt ?? null, locale)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    {t.labels.noRuns}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        {t.labels.tip} <span className="font-mono">npm -w backend run mock-pms</span> {t.labels.tipSuffix}
      </p>
    </div>
  );
}
