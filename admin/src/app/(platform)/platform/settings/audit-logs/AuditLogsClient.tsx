"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { defaultAdminLocale, getAdminLocaleFromPathname, type AdminLocale } from "@/lib/admin-locale";

type AuditLog = {
  id: string;
  actorType: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  "hotel.create": "default",
  "hotel.update": "secondary",
  "notification.email.update": "default",
  "notification.sms.update": "default",
  "notification.push.update": "default",
  "platform_setting.update": "secondary",
  "staff.create": "default",
  "staff.delete": "destructive"
};

function actionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  return (ACTION_COLORS[action] as "default" | "secondary" | "destructive") ?? "outline";
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " > ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const auditLogsCopy = {
  en: {
    allActions: "All actions",
    allResources: "All resources",
    resources: {
      hotel: "Hotels",
      hotel_notifications: "Notifications",
      platform_settings: "Platform Settings",
      staff_user: "Staff Users",
    },
    refresh: "Refresh",
    total: "total",
    entry: "entry",
    entries: "entries",
    activityLog: "Activity Log",
    loading: "Loading...",
    noLogs: "No audit logs found. Actions performed by platform admins will appear here.",
    headers: {
      action: "Action",
      actor: "Actor",
      resource: "Resource",
      time: "Time",
    },
    system: "System",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
  },
  fr: {
    allActions: "Toutes les actions",
    allResources: "Toutes les ressources",
    resources: {
      hotel: "Hotels",
      hotel_notifications: "Notifications",
      platform_settings: "Parametres plateforme",
      staff_user: "Utilisateurs staff",
    },
    refresh: "Actualiser",
    total: "total",
    entry: "entree",
    entries: "entrees",
    activityLog: "Journal d'activite",
    loading: "Chargement...",
    noLogs: "Aucun log d'audit trouve. Les actions des admins plateforme apparaitront ici.",
    headers: {
      action: "Action",
      actor: "Acteur",
      resource: "Ressource",
      time: "Heure",
    },
    system: "Systeme",
    previous: "Precedent",
    next: "Suivant",
    page: "Page",
    of: "sur",
  },
  es: {
    allActions: "Todas las acciones",
    allResources: "Todos los recursos",
    resources: {
      hotel: "Hoteles",
      hotel_notifications: "Notificaciones",
      platform_settings: "Configuracion de plataforma",
      staff_user: "Usuarios staff",
    },
    refresh: "Actualizar",
    total: "total",
    entry: "registro",
    entries: "registros",
    activityLog: "Registro de actividad",
    loading: "Cargando...",
    noLogs: "No se encontraron logs de auditoria. Las acciones de admins de plataforma apareceran aqui.",
    headers: {
      action: "Accion",
      actor: "Actor",
      resource: "Recurso",
      time: "Hora",
    },
    system: "Sistema",
    previous: "Anterior",
    next: "Siguiente",
    page: "Pagina",
    of: "de",
  },
} as const;

function formatDate(iso: string, locale: AdminLocale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function AuditLogsClient() {
  const pathname = usePathname() ?? "/platform/settings/audit-logs";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = auditLogsCopy[locale];
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (actionFilter) params.set("action", actionFilter);
      if (resourceFilter) params.set("resourceType", resourceFilter);

      const res = await fetch(`/api/platform/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">{t.allActions}</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
        >
          <option value="">{t.allResources}</option>
          <option value="hotel">{t.resources.hotel}</option>
          <option value="hotel_notifications">{t.resources.hotel_notifications}</option>
          <option value="platform_settings">{t.resources.platform_settings}</option>
          <option value="staff_user">{t.resources.staff_user}</option>
        </select>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          {t.refresh}
        </button>
        <span className="text-sm text-muted-foreground">
          {total} {t.total} {total === 1 ? t.entry : t.entries}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.activityLog}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">{t.loading}</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t.noLogs}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="hidden grid-cols-[1fr_1fr_1fr_140px] gap-4 border-b px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
                <span>{t.headers.action}</span>
                <span>{t.headers.actor}</span>
                <span>{t.headers.resource}</span>
                <span>{t.headers.time}</span>
              </div>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-1 gap-1 rounded-md px-3 py-3 transition-colors hover:bg-muted/50 md:grid-cols-[1fr_1fr_1fr_140px] md:gap-4 md:py-2"
                >
                  <div>
                    <Badge variant={actionBadgeVariant(log.action)}>
                      {formatAction(log.action)}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span>{log.actorEmail ?? log.actorId ?? t.system}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({log.actorType})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {log.resourceType && (
                      <span>{log.resourceType}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ""}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt, locale)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.previous}
          </button>
          <span className="text-sm text-muted-foreground">
            {t.page} {page} {t.of} {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            {t.next}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
