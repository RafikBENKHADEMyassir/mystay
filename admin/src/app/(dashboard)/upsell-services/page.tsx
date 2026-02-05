import Link from "next/link";
import { redirect } from "next/navigation";

import { UpsellServicesFilters } from "@/components/upsell/upsell-services-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";
import { cn } from "@/lib/utils";

type UpsellService = {
  id: string;
  hotelId: string;
  category: string;
  name: string;
  touchpoint: string;
  priceCents: number;
  currency: string;
  availabilityWeekdays: string[];
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type UpsellServicesResponse = {
  items: UpsellService[];
};

type UpsellServicesPageProps = {
  searchParams?: {
    search?: string;
    category?: string;
    serviceId?: string;
    new?: string;
    saved?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function buildSearchParams(current: UpsellServicesPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
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

async function getUpsellServices(token: string, query: URLSearchParams): Promise<UpsellServicesResponse> {
  const qs = query.toString();
  const response = await fetch(qs ? `${backendUrl}/api/v1/staff/upsell-services?${qs}` : `${backendUrl}/api/v1/staff/upsell-services`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as UpsellServicesResponse;
}

async function getUpsellService(token: string, id: string): Promise<UpsellService | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { service?: UpsellService };
  return payload.service ?? null;
}

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

const touchpoints = [
  { value: "before_stay", label: "Before stay" },
  { value: "during_stay", label: "During stay" },
  { value: "before_and_during", label: "Before & during stay" }
] as const;

const weekdayChips = [
  { value: "mon", label: "M" },
  { value: "tue", label: "T" },
  { value: "wed", label: "W" },
  { value: "thu", label: "T" },
  { value: "fri", label: "F" },
  { value: "sat", label: "S" },
  { value: "sun", label: "S" }
] as const;

export default async function UpsellServicesPage({ searchParams }: UpsellServicesPageProps) {
  const token = requireStaffToken();
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

  const serviceId = (searchParams?.serviceId ?? "").trim();
  const wantsNew = (searchParams?.new ?? "").trim() === "1";

  const query = buildSearchParams(searchParams, { serviceId: null, new: null, saved: null, error: null });

  let data: UpsellServicesResponse | null = null;
  let detail: UpsellService | null = null;
  let error: string | null = null;

  try {
    data = await getUpsellServices(token, query);
    if (serviceId) detail = await getUpsellService(token, serviceId);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const items = data?.items ?? [];
  const categories = items.map((item) => item.category).filter(Boolean);
  categories.sort((a, b) => a.localeCompare(b));

  const grouped = new Map<string, UpsellService[]>();
  for (const item of items) {
    const key = item.category || "Uncategorized";
    const bucket = grouped.get(key) ?? [];
    bucket.push(item);
    grouped.set(key, bucket);
  }

  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

  const openNewHref = (() => {
    const next = buildSearchParams(searchParams, { new: "1", serviceId: null, saved: null, error: null });
    return `/upsell-services?${next.toString()}`;
  })();

  const openDrawerHref = (id: string) => {
    const next = buildSearchParams(searchParams, { serviceId: id, new: null, saved: null, error: null });
    return `/upsell-services?${next.toString()}`;
  };

  const closeDrawerHref = (() => {
    const next = buildSearchParams(searchParams, { serviceId: null, new: null, saved: null, error: null });
    const value = next.toString();
    return value ? `/upsell-services?${value}` : "/upsell-services";
  })();

  async function createService(formData: FormData) {
    "use server";

    const token = requireStaffToken();

    const category = String(formData.get("category") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const touchpoint = String(formData.get("touchpoint") ?? "").trim();
    const currency = String(formData.get("currency") ?? "EUR").trim().toUpperCase();
    const enabled = String(formData.get("enabled") ?? "on") === "on";

    const amountRaw = String(formData.get("price") ?? "").trim();
    const amountNumber = Number(amountRaw);
    const priceCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : NaN;

    const availabilityWeekdays = weekdayChips
      .map((day) => day.value)
      .filter((day) => String(formData.get(`weekday_${day}`) ?? "") === "on");

    const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, name, touchpoint, priceCents, currency, availabilityWeekdays, enabled }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, new: "1" });
      redirect(`/upsell-services?${next.toString()}`);
    }

    const id = typeof payload?.service?.id === "string" ? payload.service.id : "";
    if (!id) redirect("/upsell-services?error=invalid_service");

    const next = buildSearchParams(searchParams, { serviceId: id, new: null, saved: "created", error: null });
    redirect(`/upsell-services?${next.toString()}`);
  }

  async function updateService(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    if (!serviceId) redirect("/upsell-services");

    const category = String(formData.get("category") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const touchpoint = String(formData.get("touchpoint") ?? "").trim();
    const currency = String(formData.get("currency") ?? "EUR").trim().toUpperCase();
    const enabled = String(formData.get("enabled") ?? "") === "on";

    const amountRaw = String(formData.get("price") ?? "").trim();
    const amountNumber = Number(amountRaw);
    const priceCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : NaN;

    const availabilityWeekdays = weekdayChips
      .map((day) => day.value)
      .filter((day) => String(formData.get(`weekday_${day}`) ?? "") === "on");

    const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services/${encodeURIComponent(serviceId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, name, touchpoint, priceCents, currency, availabilityWeekdays, enabled }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { serviceId, error: errorCode, saved: null });
      redirect(`/upsell-services?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { serviceId, saved: "updated", error: null });
    redirect(`/upsell-services?${next.toString()}`);
  }

  async function toggleService(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const enabled = String(formData.get("enabled") ?? "").trim() === "1";
    if (!serviceId) redirect("/upsell-services");

    const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services/${encodeURIComponent(serviceId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enabled: !enabled }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, saved: null });
      redirect(`/upsell-services?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { saved: "toggled", error: null });
    redirect(`/upsell-services?${next.toString()}`);
  }

  async function deleteService(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    if (!serviceId) redirect("/upsell-services");

    const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services/${encodeURIComponent(serviceId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { serviceId, error: errorCode, saved: null });
      redirect(`/upsell-services?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { serviceId: null, new: null, saved: "deleted", error: null });
    redirect(`/upsell-services?${next.toString()}`);
  }

  const detailPrice = detail ? Number((detail.priceCents / 100).toFixed(2)) : 0;
  const detailWeekdays = new Set((detail?.availabilityWeekdays ?? []).map((day) => day.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Upselling</h1>
          <p className="text-sm text-muted-foreground">Configure upsell services offered to guests before or during the stay.</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={openNewHref}>+ Add service</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search services and filter by category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <UpsellServicesFilters categories={categories} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const services = grouped.get(category) ?? [];
          const categoryTotal = services.length;

          return (
            <Card key={category}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{category}</CardTitle>
                  <CardDescription>{categoryTotal} service{categoryTotal === 1 ? "" : "s"}</CardDescription>
                </div>
                <Badge variant="secondary">{categoryTotal}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[1.4fr,160px,140px,1fr,140px] gap-0 border-t text-sm">
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Name</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Touchpoint</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Price</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Availability</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Enabled</div>
                </div>

                <div className="divide-y">
                  {services.map((service) => {
                    const touchpointLabel = touchpoints.find((tp) => tp.value === service.touchpoint)?.label ?? service.touchpoint;
                    const available = new Set((service.availabilityWeekdays ?? []).map((day) => day.toLowerCase()));

                    return (
                      <div key={service.id} className="grid grid-cols-[1.4fr,160px,140px,1fr,140px] items-center gap-0 py-3">
                        <div className="px-4">
                          <Link href={openDrawerHref(service.id)} className="truncate font-semibold hover:underline">
                            {service.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{service.id}</p>
                        </div>
                        <div className="px-4 text-sm">{touchpointLabel}</div>
                        <div className="px-4 font-mono text-sm">{formatMoney(service.priceCents, service.currency)}</div>
                        <div className="px-4">
                          <div className="flex flex-wrap items-center gap-1">
                            {weekdayChips.map((day, index) => {
                              const on = available.has(day.value);
                              return (
                                <Badge
                                  key={`${service.id}-${day.value}-${index}`}
                                  variant="outline"
                                  className={cn(
                                    "h-6 w-6 justify-center rounded-full p-0 text-[11px]",
                                    on ? "border-blue-200 bg-blue-50 text-blue-800" : "border-muted/40 bg-muted/10 text-muted-foreground"
                                  )}
                                >
                                  {day.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className="px-4">
                          {canManage ? (
                            <form action={toggleService}>
                              <input type="hidden" name="serviceId" value={service.id} />
                              <input type="hidden" name="enabled" value={service.enabled ? "1" : "0"} />
                              <button
                                type="submit"
                                role="switch"
                                aria-checked={service.enabled}
                                className={cn(
                                  "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
                                  service.enabled ? "border-emerald-200 bg-emerald-500" : "border-muted/40 bg-muted/20"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                                    service.enabled ? "translate-x-6" : "translate-x-1"
                                  )}
                                />
                              </button>
                            </form>
                          ) : (
                            <Badge
                              variant="outline"
                              className={
                                service.enabled
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-muted/40 bg-muted/20 text-muted-foreground"
                              }
                            >
                              {service.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {services.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground">No services in this category.</div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedCategories.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No services found.</p> : null}
      </div>

      {wantsNew || serviceId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label="Close" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wantsNew ? "Create" : "Edit"} upsell service</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? "New service" : detail?.name ?? "Upsell service"}</h2>
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
                      <CardTitle className="text-base">Create service</CardTitle>
                      <CardDescription>Category, price, availability, and touchpoint.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createService} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="up-category">Category</Label>
                          <Input id="up-category" name="category" placeholder="Category 1" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-name">Name</Label>
                          <Input id="up-name" name="name" placeholder="Parking" required />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="up-touchpoint">Touchpoint</Label>
                            <select id="up-touchpoint" name="touchpoint" className={nativeSelectClassName} defaultValue="before_and_during">
                              {touchpoints.map((tp) => (
                                <option key={tp.value} value={tp.value}>
                                  {tp.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-currency">Currency</Label>
                            <select id="up-currency" name="currency" className={nativeSelectClassName} defaultValue="EUR">
                              <option value="EUR">EUR</option>
                              <option value="CHF">CHF</option>
                              <option value="DKK">DKK</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-price">Price</Label>
                          <Input id="up-price" name="price" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Availability</Label>
                          <div className="flex flex-wrap items-center gap-2">
                            {weekdayChips.map((day, index) => (
                              <label
                                key={`${day.value}-${index}`}
                                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium"
                              >
                                <input type="checkbox" name={`weekday_${day.value}`} defaultChecked />
                                {day.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="enabled" defaultChecked />
                          Enabled
                        </label>
                        <Button type="submit" className="w-full">
                          Create service
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Read-only</CardTitle>
                      <CardDescription>Ask a manager to configure upsell services.</CardDescription>
                    </CardHeader>
                  </Card>
                )
              ) : detail ? (
                <>
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Details</CardTitle>
                      <CardDescription>Edit the service configuration.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={updateService} className="space-y-4">
                        <input type="hidden" name="serviceId" value={detail.id} />
                        <div className="space-y-2">
                          <Label htmlFor="up-category-edit">Category</Label>
                          <Input id="up-category-edit" name="category" defaultValue={detail.category} disabled={!canManage} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-name-edit">Name</Label>
                          <Input id="up-name-edit" name="name" defaultValue={detail.name} disabled={!canManage} required />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="up-touchpoint-edit">Touchpoint</Label>
                            <select
                              id="up-touchpoint-edit"
                              name="touchpoint"
                              className={nativeSelectClassName}
                              defaultValue={detail.touchpoint}
                              disabled={!canManage}
                            >
                              {touchpoints.map((tp) => (
                                <option key={tp.value} value={tp.value}>
                                  {tp.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-currency-edit">Currency</Label>
                            <select
                              id="up-currency-edit"
                              name="currency"
                              className={nativeSelectClassName}
                              defaultValue={detail.currency}
                              disabled={!canManage}
                            >
                              <option value="EUR">EUR</option>
                              <option value="CHF">CHF</option>
                              <option value="DKK">DKK</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-price-edit">Price</Label>
                          <Input
                            id="up-price-edit"
                            name="price"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            defaultValue={String(detailPrice)}
                            disabled={!canManage}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Availability</Label>
                          <div className="flex flex-wrap items-center gap-2">
                            {weekdayChips.map((day, index) => (
                              <label
                                key={`${detail.id}-${day.value}-${index}`}
                                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium"
                              >
                                <input type="checkbox" name={`weekday_${day.value}`} defaultChecked={detailWeekdays.has(day.value)} disabled={!canManage} />
                                {day.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="enabled" defaultChecked={detail.enabled} disabled={!canManage} />
                          Enabled
                        </label>
                        {canManage ? (
                          <Button type="submit" className="w-full">
                            Save changes
                          </Button>
                        ) : null}
                      </form>
                    </CardContent>
                  </Card>

                  {canManage ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={toggleService} className="flex-1">
                        <input type="hidden" name="serviceId" value={detail.id} />
                        <input type="hidden" name="enabled" value={detail.enabled ? "1" : "0"} />
                        <Button type="submit" variant="outline" className="w-full">
                          {detail.enabled ? "Disable" : "Enable"}
                        </Button>
                      </form>
                      <form action={deleteService} className="flex-1">
                        <input type="hidden" name="serviceId" value={detail.id} />
                        <Button type="submit" variant="destructive" className="w-full">
                          Delete
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </>
              ) : (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">Service not available</CardTitle>
                    <CardDescription>Refresh the list to see latest services.</CardDescription>
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

