import Link from "next/link";
import { cookies } from "next/headers";

import { LiveInboxRefresh } from "@/components/live-inbox-refresh";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminLocaleCookieName, resolveAdminLocale, type AdminLocale } from "@/lib/admin-locale";
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
    stayId?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const messagesPageCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Messages",
    subtitle: "Guest threads with live updates.",
    thread: "thread",
    threads: "threads",
    filtersTitle: "Filters",
    filtersDescription: "Search and narrow down the live thread stream.",
    threadsTitle: "Threads",
    threadsDescription: "Sorted by most recent message activity.",
    table: {
      thread: "Thread",
      department: "Department",
      status: "Status",
      updated: "Updated",
    },
    noThreads: "No threads match the current filter.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
  },
  fr: {
    appName: "MyStay Admin",
    title: "Messages",
    subtitle: "Conversations clients avec mises a jour en direct.",
    thread: "conversation",
    threads: "conversations",
    filtersTitle: "Filtres",
    filtersDescription: "Recherchez et affinez le flux de conversations.",
    threadsTitle: "Conversations",
    threadsDescription: "Trie par activite de message la plus recente.",
    table: {
      thread: "Conversation",
      department: "Departement",
      status: "Statut",
      updated: "Mis a jour",
    },
    noThreads: "Aucune conversation ne correspond aux filtres actuels.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
  },
  es: {
    appName: "MyStay Admin",
    title: "Mensajes",
    subtitle: "Conversaciones de huespedes con actualizaciones en vivo.",
    thread: "conversacion",
    threads: "conversaciones",
    filtersTitle: "Filtros",
    filtersDescription: "Busca y reduce el flujo de conversaciones en vivo.",
    threadsTitle: "Conversaciones",
    threadsDescription: "Ordenadas por actividad de mensaje mas reciente.",
    table: {
      thread: "Conversacion",
      department: "Departamento",
      status: "Estado",
      updated: "Actualizado",
    },
    noThreads: "No hay conversaciones que coincidan con el filtro actual.",
    backendUnreachable: "Backend inaccesible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y actualiza.",
  },
} as const;

const departmentLabels: Record<AdminLocale, Record<string, string>> = {
  en: {
    concierge: "Concierge",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    restaurants: "Restaurants",
    front_desk: "Front desk",
    spa: "Spa",
    general: "General",
  },
  fr: {
    concierge: "Conciergerie",
    housekeeping: "Menage",
    maintenance: "Maintenance",
    restaurants: "Restaurants",
    front_desk: "Reception",
    spa: "Spa",
    general: "General",
  },
  es: {
    concierge: "Conserjeria",
    housekeeping: "Limpieza",
    maintenance: "Mantenimiento",
    restaurants: "Restaurantes",
    front_desk: "Recepcion",
    spa: "Spa",
    general: "General",
  },
};

const statusLabels: Record<AdminLocale, Record<string, string>> = {
  en: { active: "Active", archived: "Archived", resolved: "Resolved" },
  fr: { active: "Actif", archived: "Archive", resolved: "Resolue" },
  es: { active: "Activo", archived: "Archivado", resolved: "Resuelta" },
};

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function departmentLabel(department: string, locale: AdminLocale) {
  return departmentLabels[locale][department.toLowerCase()] ?? humanize(department);
}

function statusLabel(status: string, locale: AdminLocale) {
  return statusLabels[locale][status.toLowerCase()] ?? humanize(status);
}

async function getThreads(token: string, query: URLSearchParams): Promise<Thread[]> {
  const qs = query.toString();
  const response = await fetch(qs ? `${backendUrl}/api/v1/threads?${qs}` : `${backendUrl}/api/v1/threads`, {
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
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = messagesPageCopy[locale];

  let allThreads: Thread[] = [];
  let error: string | null = null;

  try {
    const query = new URLSearchParams();
    const stayId = searchParams?.stayId?.trim() ?? "";
    if (stayId) query.set("stayId", stayId);
    const department = searchParams?.dept?.trim() ?? "";
    if (department) query.set("department", department);
    const status = searchParams?.status?.trim() ?? "";
    if (status) query.set("status", status);
    allThreads = await getThreads(token, query);
  } catch {
    error = t.backendUnreachable;
  }

  const departmentFilter = searchParams?.dept?.trim() ?? "";
  const statusFilter = searchParams?.status?.trim() ?? "";
  const query = searchParams?.q?.trim().toLowerCase() ?? "";
  const stayIdFilter = searchParams?.stayId?.trim() ?? "";

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
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Badge variant="secondary">
          {threads.length} {threads.length === 1 ? t.thread : t.threads}
        </Badge>
      </header>

      <Card>
        <CardHeader className="space-y-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{t.filtersTitle}</CardTitle>
            <CardDescription>{t.filtersDescription}</CardDescription>
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
            <CardTitle className="text-base">{t.threadsTitle}</CardTitle>
            <CardDescription>{t.threadsDescription}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stayIdFilter ? (
              <Badge variant="secondary" className="font-mono">
                stayId={stayIdFilter}
              </Badge>
            ) : null}
            {departmentFilter ? <Badge variant="outline">{departmentLabel(departmentFilter, locale)}</Badge> : null}
            {statusFilter ? <Badge variant="outline">{statusLabel(statusFilter, locale)}</Badge> : null}
            {query ? (
              <Badge variant="secondary" className="font-mono">
                q={query}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.table.thread}</TableHead>
                <TableHead className="hidden md:table-cell">{t.table.department}</TableHead>
                <TableHead>{t.table.status}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.table.updated}</TableHead>
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
                    <Badge variant="outline">{departmentLabel(thread.department, locale)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={thread.status === "resolved" ? "secondary" : "outline"}>
                      {statusLabel(thread.status, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(thread.lastMessageAt ?? thread.updatedAt).toLocaleString(locale)}
                  </TableCell>
                </TableRow>
              ))}
              {threads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    {t.noThreads}
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
