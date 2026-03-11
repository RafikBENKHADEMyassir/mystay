import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AutomationsFilters } from "@/components/automations/automations-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";

type AutomationListItem = {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  trigger: string;
  status: string;
  config: unknown;
  createdByStaffUserId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type AutomationsResponse = {
  items: AutomationListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AutomationsPageProps = {
  searchParams?: {
    search?: string;
    status?: string;
    page?: string;
    automationId?: string;
    new?: string;
    saved?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const triggerValues = ["check_in_invitation", "reservation_confirmed", "unlocked_room"] as const;

const automationsCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Automations",
    subtitle: "Manage check-in invitations, confirmations, and engagement flows.",
    createAutomation: "Create automation",
    filtersTitle: "Filters",
    filtersDescription: "Search and status filters.",
    automationsTitle: "Automations",
    automationsDescription: "Sorted by last updated.",
    previous: "Previous",
    next: "Next",
    automation: "automation",
    automations: "automations",
    updated: "Updated",
    pause: "Pause",
    activate: "Activate",
    noAutomations: "No automations found.",
    close: "Close",
    createLabel: "Create automation",
    editLabel: "Edit automation",
    newAutomation: "New automation",
    automationFallback: "Automation",
    saved: "Saved",
    createCardTitle: "Create automation",
    createCardDescription: "Name, trigger, and initial status.",
    name: "Name",
    namePlaceholder: "Check-in invitation",
    trigger: "Trigger",
    status: "Status",
    active: "Active",
    paused: "Paused",
    description: "Description",
    descriptionPlaceholder: "Optional description",
    configJson: "Config (JSON)",
    createAutomationAction: "Create automation",
    readOnly: "Read-only",
    readOnlyDescription: "Ask a manager to create or edit automations.",
    detailsTitle: "Details",
    detailsDescription: "Update the automation fields and config.",
    saveChanges: "Save changes",
    pauseAutomation: "Pause automation",
    activateAutomation: "Activate automation",
    unavailableTitle: "Automation not available",
    unavailableDescription: "Refresh the list to see latest automations.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
    triggers: {
      check_in_invitation: "Check-in invitation",
      reservation_confirmed: "Reservation confirmed",
      unlocked_room: "Unlocked room",
    },
  },
  fr: {
    appName: "MyStay Admin",
    title: "Automatisations",
    subtitle: "Gerer les invitations de check-in, confirmations et parcours d'engagement.",
    createAutomation: "Creer automatisation",
    filtersTitle: "Filtres",
    filtersDescription: "Recherche et filtres de statut.",
    automationsTitle: "Automatisations",
    automationsDescription: "Triees par derniere mise a jour.",
    previous: "Precedent",
    next: "Suivant",
    automation: "automatisation",
    automations: "automatisations",
    updated: "Mis a jour",
    pause: "Mettre en pause",
    activate: "Activer",
    noAutomations: "Aucune automatisation trouvee.",
    close: "Fermer",
    createLabel: "Creer automatisation",
    editLabel: "Modifier automatisation",
    newAutomation: "Nouvelle automatisation",
    automationFallback: "Automatisation",
    saved: "Enregistre",
    createCardTitle: "Creer automatisation",
    createCardDescription: "Nom, declencheur et statut initial.",
    name: "Nom",
    namePlaceholder: "Invitation check-in",
    trigger: "Declencheur",
    status: "Statut",
    active: "Actif",
    paused: "En pause",
    description: "Description",
    descriptionPlaceholder: "Description optionnelle",
    configJson: "Config (JSON)",
    createAutomationAction: "Creer automatisation",
    readOnly: "Lecture seule",
    readOnlyDescription: "Demandez a un manager de creer ou modifier les automatisations.",
    detailsTitle: "Details",
    detailsDescription: "Mettre a jour les champs et la config de l'automatisation.",
    saveChanges: "Enregistrer modifications",
    pauseAutomation: "Mettre en pause l'automatisation",
    activateAutomation: "Activer l'automatisation",
    unavailableTitle: "Automatisation indisponible",
    unavailableDescription: "Actualisez la liste pour voir les dernieres automatisations.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
    triggers: {
      check_in_invitation: "Invitation check-in",
      reservation_confirmed: "Reservation confirmee",
      unlocked_room: "Chambre deverrouillee",
    },
  },
  es: {
    appName: "MyStay Admin",
    title: "Automatizaciones",
    subtitle: "Gestiona invitaciones de check-in, confirmaciones y flujos de interaccion.",
    createAutomation: "Crear automatizacion",
    filtersTitle: "Filtros",
    filtersDescription: "Busqueda y filtros de estado.",
    automationsTitle: "Automatizaciones",
    automationsDescription: "Ordenadas por ultima actualizacion.",
    previous: "Anterior",
    next: "Siguiente",
    automation: "automatizacion",
    automations: "automatizaciones",
    updated: "Actualizado",
    pause: "Pausar",
    activate: "Activar",
    noAutomations: "No se encontraron automatizaciones.",
    close: "Cerrar",
    createLabel: "Crear automatizacion",
    editLabel: "Editar automatizacion",
    newAutomation: "Nueva automatizacion",
    automationFallback: "Automatizacion",
    saved: "Guardado",
    createCardTitle: "Crear automatizacion",
    createCardDescription: "Nombre, disparador y estado inicial.",
    name: "Nombre",
    namePlaceholder: "Invitacion de check-in",
    trigger: "Disparador",
    status: "Estado",
    active: "Activo",
    paused: "Pausado",
    description: "Descripcion",
    descriptionPlaceholder: "Descripcion opcional",
    configJson: "Config (JSON)",
    createAutomationAction: "Crear automatizacion",
    readOnly: "Solo lectura",
    readOnlyDescription: "Pide a un manager que cree o edite automatizaciones.",
    detailsTitle: "Detalles",
    detailsDescription: "Actualiza campos y configuracion de la automatizacion.",
    saveChanges: "Guardar cambios",
    pauseAutomation: "Pausar automatizacion",
    activateAutomation: "Activar automatizacion",
    unavailableTitle: "Automatizacion no disponible",
    unavailableDescription: "Actualiza la lista para ver las automatizaciones mas recientes.",
    backendUnreachable: "Backend no disponible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y luego recarga.",
    triggers: {
      check_in_invitation: "Invitacion de check-in",
      reservation_confirmed: "Reserva confirmada",
      unlocked_room: "Habitacion desbloqueada",
    },
  },
} as const;

function buildSearchParams(current: AutomationsPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
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

async function getAutomations(token: string, query: URLSearchParams): Promise<AutomationsResponse> {
  const qs = query.toString();
  const response = await fetch(qs ? `${backendUrl}/api/v1/staff/automations?${qs}` : `${backendUrl}/api/v1/staff/automations`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as AutomationsResponse;
}

async function getAutomation(token: string, id: string): Promise<AutomationListItem | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/automations/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { automation?: AutomationListItem };
  return payload.automation ?? null;
}

function statusBadge(status: string, t: (typeof automationsCopy)[keyof typeof automationsCopy]) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return { label: t.active, className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  return { label: t.paused, className: "border-amber-200 bg-amber-50 text-amber-800" };
}

function triggerLabel(trigger: string, t: (typeof automationsCopy)[keyof typeof automationsCopy]) {
  const normalized = trigger.trim().toLowerCase() as keyof (typeof automationsCopy)[keyof typeof automationsCopy]["triggers"];
  return t.triggers[normalized] ?? trigger.replaceAll("_", " ");
}

export default async function AutomationsPage({ searchParams }: AutomationsPageProps) {
  const token = requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = automationsCopy[locale];
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";
  const triggerOptions = triggerValues.map((value) => ({ value, label: t.triggers[value] }));

  const automationId = (searchParams?.automationId ?? "").trim();
  const wantsNew = (searchParams?.new ?? "").trim() === "1";

  const page = Number(searchParams?.page ?? "1") || 1;
  const query = buildSearchParams(searchParams, {
    page: String(page),
    pageSize: "25",
    automationId: null,
    new: null,
    saved: null,
    error: null
  });

  let data: AutomationsResponse | null = null;
  let detail: AutomationListItem | null = null;
  let error: string | null = null;

  try {
    data = await getAutomations(token, query);
    if (automationId) detail = await getAutomation(token, automationId);
  } catch {
    error = t.backendUnreachable;
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const openNewHref = (() => {
    const next = buildSearchParams(searchParams, { new: "1", automationId: null, saved: null, error: null });
    return `/automations?${next.toString()}`;
  })();

  const openDrawerHref = (id: string) => {
    const next = buildSearchParams(searchParams, { automationId: id, new: null, saved: null, error: null });
    return `/automations?${next.toString()}`;
  };

  const closeDrawerHref = (() => {
    const next = buildSearchParams(searchParams, { automationId: null, new: null, saved: null, error: null });
    const value = next.toString();
    return value ? `/automations?${value}` : "/automations";
  })();

  async function createAutomation(formData: FormData) {
    "use server";

    const token = requireStaffToken();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const trigger = String(formData.get("trigger") ?? "").trim();
    const status = String(formData.get("status") ?? "active").trim();
    const configRaw = String(formData.get("config") ?? "").trim();

    let config: unknown = {};
    try {
      config = configRaw ? JSON.parse(configRaw) : {};
    } catch {
      config = {};
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/automations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description: description || null, trigger, status, config }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, new: "1" });
      redirect(`/automations?${next.toString()}`);
    }

    const id = typeof payload?.automation?.id === "string" ? payload.automation.id : "";
    if (!id) redirect("/automations?error=invalid_automation");

    const next = buildSearchParams(searchParams, { automationId: id, new: null, saved: "created", error: null });
    redirect(`/automations?${next.toString()}`);
  }

  async function updateAutomation(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const automationId = String(formData.get("automationId") ?? "").trim();
    if (!automationId) redirect("/automations");

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const trigger = String(formData.get("trigger") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const configRaw = String(formData.get("config") ?? "").trim();

    let config: unknown = {};
    try {
      config = configRaw ? JSON.parse(configRaw) : {};
    } catch {
      config = {};
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/automations/${encodeURIComponent(automationId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description: description || null, trigger, status, config }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { automationId, error: errorCode, saved: null });
      redirect(`/automations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { automationId, saved: "updated", error: null });
    redirect(`/automations?${next.toString()}`);
  }

  async function toggleAutomation(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const automationId = String(formData.get("automationId") ?? "").trim();
    if (!automationId) redirect("/automations");

    const response = await fetch(`${backendUrl}/api/v1/staff/automations/${encodeURIComponent(automationId)}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { automationId, error: errorCode, saved: null });
      redirect(`/automations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { automationId, saved: "toggled", error: null });
    redirect(`/automations?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={openNewHref}>+ {t.createAutomation}</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.filtersTitle}</CardTitle>
          <CardDescription>{t.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AutomationsFilters />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t.automationsTitle}</CardTitle>
            <CardDescription>{t.automationsDescription}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/automations?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>
                {t.previous}
              </Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/automations?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>
                {t.next}
              </Link>
            </Button>
            <Badge variant="secondary">
              {data?.total ?? 0} {(data?.total ?? 0) === 1 ? t.automation : t.automations}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((automation) => {
            const badge = statusBadge(automation.status, t);
            const currentTriggerLabel = triggerOptions.find((opt) => opt.value === automation.trigger)?.label ?? triggerLabel(automation.trigger, t);

            return (
              <div key={automation.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={openDrawerHref(automation.id)} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{automation.name}</p>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {currentTriggerLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{automation.description ?? "—"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.updated} {new Date(automation.updatedAt).toLocaleString()}
                    {automation.createdBy ? ` · ${automation.createdBy}` : ""}
                  </p>
                </Link>

                {canManage ? (
                  <form action={toggleAutomation} className="shrink-0">
                    <input type="hidden" name="automationId" value={automation.id} />
                    <Button type="submit" variant="outline">
                      {automation.status === "active" ? t.pause : t.activate}
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}

          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t.noAutomations}</p> : null}
        </CardContent>
      </Card>

      {wantsNew || automationId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label={t.close} />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wantsNew ? t.createLabel : t.editLabel}</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? t.newAutomation : detail?.name ?? t.automationFallback}</h2>
                {detail ? <p className="truncate text-xs text-muted-foreground font-mono">{detail.id}</p> : null}
              </div>
              <Button variant="outline" asChild>
                <Link href={closeDrawerHref}>{t.close}</Link>
              </Button>
            </div>

            <div className="space-y-6 p-6">
              {searchParams?.error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {searchParams.error}
                </p>
              ) : null}

              {searchParams?.saved ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {t.saved} ({searchParams.saved}).
                </p>
              ) : null}

              {wantsNew ? (
                canManage ? (
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">{t.createCardTitle}</CardTitle>
                      <CardDescription>{t.createCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createAutomation} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="auto-name">{t.name}</Label>
                          <Input id="auto-name" name="name" placeholder={t.namePlaceholder} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-trigger">{t.trigger}</Label>
                          <select id="auto-trigger" name="trigger" className={nativeSelectClassName} defaultValue={triggerOptions[0].value}>
                            {triggerOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-status">{t.status}</Label>
                          <select id="auto-status" name="status" className={nativeSelectClassName} defaultValue="active">
                            <option value="active">{t.active}</option>
                            <option value="paused">{t.paused}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-description">{t.description}</Label>
                          <Input id="auto-description" name="description" placeholder={t.descriptionPlaceholder} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-config">{t.configJson}</Label>
                          <Textarea id="auto-config" name="config" placeholder='{"steps": []}' className="min-h-[120px]" />
                        </div>
                        <Button type="submit" className="w-full">
                          {t.createAutomationAction}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">{t.readOnly}</CardTitle>
                      <CardDescription>{t.readOnlyDescription}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              ) : detail ? (
                <>
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">{t.detailsTitle}</CardTitle>
                      <CardDescription>{t.detailsDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={updateAutomation} className="space-y-4">
                        <input type="hidden" name="automationId" value={detail.id} />
                        <div className="space-y-2">
                          <Label htmlFor="auto-name-edit">{t.name}</Label>
                          <Input id="auto-name-edit" name="name" defaultValue={detail.name} disabled={!canManage} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-trigger-edit">{t.trigger}</Label>
                          <select
                            id="auto-trigger-edit"
                            name="trigger"
                            className={nativeSelectClassName}
                            defaultValue={detail.trigger}
                            disabled={!canManage}
                          >
                            {triggerOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-status-edit">{t.status}</Label>
                          <select
                            id="auto-status-edit"
                            name="status"
                            className={nativeSelectClassName}
                            defaultValue={detail.status}
                            disabled={!canManage}
                          >
                            <option value="active">{t.active}</option>
                            <option value="paused">{t.paused}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-description-edit">{t.description}</Label>
                          <Input id="auto-description-edit" name="description" defaultValue={detail.description ?? ""} disabled={!canManage} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-config-edit">{t.configJson}</Label>
                          <Textarea
                            id="auto-config-edit"
                            name="config"
                            defaultValue={JSON.stringify(detail.config ?? {}, null, 2)}
                            className="min-h-[180px] font-mono text-xs"
                            disabled={!canManage}
                          />
                        </div>
                        {canManage ? (
                          <Button type="submit" className="w-full">
                            {t.saveChanges}
                          </Button>
                        ) : null}
                      </form>
                    </CardContent>
                  </Card>
                  {canManage ? (
                    <form action={toggleAutomation}>
                      <input type="hidden" name="automationId" value={detail.id} />
                      <Button type="submit" variant="outline" className="w-full">
                        {detail.status === "active" ? t.pauseAutomation : t.activateAutomation}
                      </Button>
                    </form>
                  ) : null}
                </>
              ) : (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">{t.unavailableTitle}</CardTitle>
                    <CardDescription>{t.unavailableDescription}</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
