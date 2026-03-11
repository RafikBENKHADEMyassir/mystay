import { Download, UserCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";

import { AudienceFilters } from "@/components/audience/audience-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
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

const audienceCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Audience",
    subtitle: "Guest contact database with opt-in status.",
    notSyncedYet: "Not synced yet",
    synced: "Synced",
    exportCsv: "Export CSV",
    total: "Total",
    contactsInDb: "Contacts in your hotel database.",
    optedInThisWeek: "Opted in this week",
    newOptInsSinceMonday: "New opt-ins since Monday.",
    skippedThisWeek: "Skipped this week",
    skippedDescription: "Guests who skipped opt-in.",
    filters: "Filters",
    filtersDescription: "Opt-in date plus name/email search.",
    contacts: "Contacts",
    contactsDescription: "Export for CRM, newsletter, or PMS sync review.",
    previous: "Previous",
    next: "Next",
    contact: "contact",
    contactsPlural: "contacts",
    table: {
      optInDate: "Opt-in date",
      name: "Name",
      email: "Email",
      channel: "Channel",
      syncedWithPms: "Synced with PMS",
    },
    yes: "Yes",
    no: "No",
    noContactsFound: "No contacts found.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
  },
  fr: {
    appName: "MyStay Admin",
    title: "Audience",
    subtitle: "Base de contacts clients avec statut d'opt-in.",
    notSyncedYet: "Pas encore synchronise",
    synced: "Synchronise",
    exportCsv: "Exporter CSV",
    total: "Total",
    contactsInDb: "Contacts dans la base de votre hotel.",
    optedInThisWeek: "Opt-in cette semaine",
    newOptInsSinceMonday: "Nouveaux opt-ins depuis lundi.",
    skippedThisWeek: "Ignore cette semaine",
    skippedDescription: "Clients qui ont ignore l'opt-in.",
    filters: "Filtres",
    filtersDescription: "Date d'opt-in plus recherche nom/email.",
    contacts: "Contacts",
    contactsDescription: "Export pour CRM, newsletter ou verification de synchro PMS.",
    previous: "Precedent",
    next: "Suivant",
    contact: "contact",
    contactsPlural: "contacts",
    table: {
      optInDate: "Date d'opt-in",
      name: "Nom",
      email: "Email",
      channel: "Canal",
      syncedWithPms: "Synchronise avec PMS",
    },
    yes: "Oui",
    no: "Non",
    noContactsFound: "Aucun contact trouve.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
  },
  es: {
    appName: "MyStay Admin",
    title: "Audiencia",
    subtitle: "Base de datos de contactos de huespedes con estado de opt-in.",
    notSyncedYet: "Aun no sincronizado",
    synced: "Sincronizado",
    exportCsv: "Exportar CSV",
    total: "Total",
    contactsInDb: "Contactos en la base de datos de tu hotel.",
    optedInThisWeek: "Opt-in esta semana",
    newOptInsSinceMonday: "Nuevos opt-ins desde el lunes.",
    skippedThisWeek: "Omitidos esta semana",
    skippedDescription: "Huespedes que omitieron el opt-in.",
    filters: "Filtros",
    filtersDescription: "Fecha de opt-in mas busqueda por nombre/email.",
    contacts: "Contactos",
    contactsDescription: "Exporta para CRM, newsletter o revision de sync PMS.",
    previous: "Anterior",
    next: "Siguiente",
    contact: "contacto",
    contactsPlural: "contactos",
    table: {
      optInDate: "Fecha de opt-in",
      name: "Nombre",
      email: "Correo",
      channel: "Canal",
      syncedWithPms: "Sincronizado con PMS",
    },
    yes: "Si",
    no: "No",
    noContactsFound: "No se encontraron contactos.",
    backendUnreachable: "Backend no disponible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y luego recarga.",
  },
} as const;

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

function formatSync(value: string | null, t: (typeof audienceCopy)[keyof typeof audienceCopy]) {
  if (!value) return t.notSyncedYet;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return t.notSyncedYet;
  return `${t.synced}: ${parsed.toLocaleString()}`;
}

export default async function AudiencePage({ searchParams }: AudiencePageProps) {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = audienceCopy[locale];
  const token = requireStaffToken();
  const page = Number(searchParams?.page ?? "1") || 1;

  const query = buildSearchParams(searchParams, { page: String(page), pageSize: "25", error: null });

  let data: AudienceResponse | null = null;
  let error: string | null = null;

  try {
    data = await getAudience(token, query);
  } catch {
    error = t.backendUnreachable;
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
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">{formatSync(stats.syncedAt, t)}</p>
          <Button asChild className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <a href={exportHref}>
              <Download className="h-4 w-4" />
              {t.exportCsv}
            </a>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.total}</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.totalContacts}</p>
            <p className="text-xs text-muted-foreground">{t.contactsInDb}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.optedInThisWeek}</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.optedInThisWeek}</p>
            <p className="text-xs text-muted-foreground">{t.newOptInsSinceMonday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.skippedThisWeek}</CardTitle>
            <UserX className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.skippedThisWeek}</p>
            <p className="text-xs text-muted-foreground">{t.skippedDescription}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.filters}</CardTitle>
          <CardDescription>{t.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AudienceFilters />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t.contacts}</CardTitle>
            <CardDescription>{t.contactsDescription}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/audience?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>{t.previous}</Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/audience?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>{t.next}</Link>
            </Button>
            <Badge variant="secondary">
              {data?.total ?? 0} {(data?.total ?? 0) === 1 ? t.contact : t.contactsPlural}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">{t.table.optInDate}</TableHead>
                <TableHead>{t.table.name}</TableHead>
                <TableHead>{t.table.email}</TableHead>
                <TableHead className="w-[160px]">{t.table.channel}</TableHead>
                <TableHead className="w-[160px]">{t.table.syncedWithPms}</TableHead>
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
                        {synced ? t.yes : t.no}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    {t.noContactsFound}
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
