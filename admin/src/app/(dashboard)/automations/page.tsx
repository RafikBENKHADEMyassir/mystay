import Link from "next/link";
import { redirect } from "next/navigation";

import { AutomationsFilters } from "@/components/automations/automations-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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

function statusBadge(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return { label: "Active", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  return { label: "Paused", className: "border-amber-200 bg-amber-50 text-amber-800" };
}

const triggerOptions = [
  { value: "check_in_invitation", label: "Check-in invitation" },
  { value: "reservation_confirmed", label: "Reservation confirmed" },
  { value: "unlocked_room", label: "Unlocked room" }
] as const;

export default async function AutomationsPage({ searchParams }: AutomationsPageProps) {
  const token = requireStaffToken();
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

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
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
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
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Automations</h1>
          <p className="text-sm text-muted-foreground">Manage check-in invitations, confirmations, and engagement flows.</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={openNewHref}>+ Create automation</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and status filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AutomationsFilters />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Automations</CardTitle>
            <CardDescription>Sorted by last updated.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/automations?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>Previous</Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/automations?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>Next</Link>
            </Button>
            <Badge variant="secondary">
              {data?.total ?? 0} automation{(data?.total ?? 0) === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((automation) => {
            const badge = statusBadge(automation.status);
            const triggerLabel = triggerOptions.find((opt) => opt.value === automation.trigger)?.label ?? automation.trigger.replaceAll("_", " ");

            return (
              <div key={automation.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={openDrawerHref(automation.id)} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{automation.name}</p>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {triggerLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{automation.description ?? "—"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {new Date(automation.updatedAt).toLocaleString()}
                    {automation.createdBy ? ` · ${automation.createdBy}` : ""}
                  </p>
                </Link>

                {canManage ? (
                  <form action={toggleAutomation} className="shrink-0">
                    <input type="hidden" name="automationId" value={automation.id} />
                    <Button type="submit" variant="outline">
                      {automation.status === "active" ? "Pause" : "Activate"}
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}

          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No automations found.</p> : null}
        </CardContent>
      </Card>

      {wantsNew || automationId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label="Close" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wantsNew ? "Create" : "Edit"} automation</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? "New automation" : detail?.name ?? "Automation"}</h2>
                {detail ? <p className="truncate text-xs text-muted-foreground font-mono">{detail.id}</p> : null}
              </div>
              <Button variant="outline" asChild>
                <Link href={closeDrawerHref}>Close</Link>
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
                  Saved ({searchParams.saved}).
                </p>
              ) : null}

              {wantsNew ? (
                canManage ? (
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Create automation</CardTitle>
                      <CardDescription>Name, trigger, and initial status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createAutomation} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="auto-name">Name</Label>
                          <Input id="auto-name" name="name" placeholder="Check-in invitation" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-trigger">Trigger</Label>
                          <select id="auto-trigger" name="trigger" className={nativeSelectClassName} defaultValue={triggerOptions[0].value}>
                            {triggerOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-status">Status</Label>
                          <select id="auto-status" name="status" className={nativeSelectClassName} defaultValue="active">
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-description">Description</Label>
                          <Input id="auto-description" name="description" placeholder="Optional description" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-config">Config (JSON)</Label>
                          <Textarea id="auto-config" name="config" placeholder='{"steps": []}' className="min-h-[120px]" />
                        </div>
                        <Button type="submit" className="w-full">
                          Create automation
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Read-only</CardTitle>
                      <CardDescription>Ask a manager to create or edit automations.</CardDescription>
                    </CardHeader>
                  </Card>
                )
              ) : detail ? (
                <>
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Details</CardTitle>
                      <CardDescription>Update the automation fields and config.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={updateAutomation} className="space-y-4">
                        <input type="hidden" name="automationId" value={detail.id} />
                        <div className="space-y-2">
                          <Label htmlFor="auto-name-edit">Name</Label>
                          <Input id="auto-name-edit" name="name" defaultValue={detail.name} disabled={!canManage} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-trigger-edit">Trigger</Label>
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
                          <Label htmlFor="auto-status-edit">Status</Label>
                          <select
                            id="auto-status-edit"
                            name="status"
                            className={nativeSelectClassName}
                            defaultValue={detail.status}
                            disabled={!canManage}
                          >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-description-edit">Description</Label>
                          <Input id="auto-description-edit" name="description" defaultValue={detail.description ?? ""} disabled={!canManage} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-config-edit">Config (JSON)</Label>
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
                            Save changes
                          </Button>
                        ) : null}
                      </form>
                    </CardContent>
                  </Card>
                  {canManage ? (
                    <form action={toggleAutomation}>
                      <input type="hidden" name="automationId" value={detail.id} />
                      <Button type="submit" variant="outline" className="w-full">
                        {detail.status === "active" ? "Pause automation" : "Activate automation"}
                      </Button>
                    </form>
                  ) : null}
                </>
              ) : (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">Automation not available</CardTitle>
                    <CardDescription>Refresh the list to see latest automations.</CardDescription>
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

