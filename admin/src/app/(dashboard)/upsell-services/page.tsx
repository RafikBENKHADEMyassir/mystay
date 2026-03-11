import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { UpsellServicesFilters } from "@/components/upsell/upsell-services-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
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
  description: string | null;
  imageUrl: string | null;
  timeSlots: string[];
  bookable: boolean;
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

const touchpointValues = ["before_stay", "during_stay", "before_and_during"] as const;

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

const upsellServicesCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Upselling",
    subtitle: "Configure upsell services offered to guests before or during the stay.",
    addService: "Add service",
    filtersTitle: "Filters",
    filtersDescription: "Search services and filter by category.",
    uncategorized: "Uncategorized",
    service: "service",
    services: "services",
    table: {
      name: "Name",
      touchpoint: "Touchpoint",
      price: "Price",
      availability: "Availability",
      enabled: "Enabled",
    },
    bookable: "Bookable",
    enabled: "Enabled",
    disabled: "Disabled",
    noServicesInCategory: "No services in this category.",
    noServicesFound: "No services found.",
    close: "Close",
    createLabel: "Create upsell service",
    editLabel: "Edit upsell service",
    newService: "New service",
    upsellService: "Upsell service",
    saved: "Saved",
    createServiceTitle: "Create service",
    createServiceDescription: "Category, price, availability, and touchpoint.",
    category: "Category",
    name: "Name",
    touchpoint: "Touchpoint",
    currency: "Currency",
    price: "Price",
    availability: "Availability",
    bookableOptions: "Bookable service options",
    bookableHint: "Bookable (guests can pick date & time)",
    description: "Description",
    imageUrl: "Image URL",
    timeSlots: "Time slots (comma-separated)",
    createServiceAction: "Create service",
    readOnly: "Read-only",
    readOnlyDescription: "Ask a manager to configure upsell services.",
    detailsTitle: "Details",
    detailsDescription: "Edit the service configuration.",
    saveChanges: "Save changes",
    disable: "Disable",
    enable: "Enable",
    delete: "Delete",
    unavailableTitle: "Service not available",
    unavailableDescription: "Refresh the list to see latest services.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
    placeholders: {
      category: "Category 1",
      name: "Parking",
      description: "Service description...",
      imageUrl: "/images/room/nettoyage.png",
      timeSlots: "10:00 - 11:00, 12:00 - 13:00",
    },
    touchpoints: {
      before_stay: "Before stay",
      during_stay: "During stay",
      before_and_during: "Before & during stay",
    },
  },
  fr: {
    appName: "MyStay Admin",
    title: "Vente additionnelle",
    subtitle: "Configurer les services additionnels proposes aux clients avant ou pendant le sejour.",
    addService: "Ajouter service",
    filtersTitle: "Filtres",
    filtersDescription: "Rechercher des services et filtrer par categorie.",
    uncategorized: "Sans categorie",
    service: "service",
    services: "services",
    table: {
      name: "Nom",
      touchpoint: "Point de contact",
      price: "Prix",
      availability: "Disponibilite",
      enabled: "Actif",
    },
    bookable: "Reservable",
    enabled: "Active",
    disabled: "Desactive",
    noServicesInCategory: "Aucun service dans cette categorie.",
    noServicesFound: "Aucun service trouve.",
    close: "Fermer",
    createLabel: "Creer service additionnel",
    editLabel: "Modifier service additionnel",
    newService: "Nouveau service",
    upsellService: "Service additionnel",
    saved: "Enregistre",
    createServiceTitle: "Creer service",
    createServiceDescription: "Categorie, prix, disponibilite et point de contact.",
    category: "Categorie",
    name: "Nom",
    touchpoint: "Point de contact",
    currency: "Devise",
    price: "Prix",
    availability: "Disponibilite",
    bookableOptions: "Options de service reservable",
    bookableHint: "Reservable (les clients peuvent choisir date et heure)",
    description: "Description",
    imageUrl: "URL de l'image",
    timeSlots: "Creneaux horaires (separes par virgules)",
    createServiceAction: "Creer service",
    readOnly: "Lecture seule",
    readOnlyDescription: "Demandez a un manager de configurer les services additionnels.",
    detailsTitle: "Details",
    detailsDescription: "Modifier la configuration du service.",
    saveChanges: "Enregistrer modifications",
    disable: "Desactiver",
    enable: "Activer",
    delete: "Supprimer",
    unavailableTitle: "Service indisponible",
    unavailableDescription: "Actualisez la liste pour voir les derniers services.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
    placeholders: {
      category: "Categorie 1",
      name: "Parking",
      description: "Description du service...",
      imageUrl: "/images/room/nettoyage.png",
      timeSlots: "10:00 - 11:00, 12:00 - 13:00",
    },
    touchpoints: {
      before_stay: "Avant sejour",
      during_stay: "Pendant sejour",
      before_and_during: "Avant et pendant sejour",
    },
  },
  es: {
    appName: "MyStay Admin",
    title: "Venta adicional",
    subtitle: "Configura servicios adicionales ofrecidos a huespedes antes o durante la estancia.",
    addService: "Agregar servicio",
    filtersTitle: "Filtros",
    filtersDescription: "Buscar servicios y filtrar por categoria.",
    uncategorized: "Sin categoria",
    service: "servicio",
    services: "servicios",
    table: {
      name: "Nombre",
      touchpoint: "Punto de contacto",
      price: "Precio",
      availability: "Disponibilidad",
      enabled: "Activo",
    },
    bookable: "Reservable",
    enabled: "Activo",
    disabled: "Inactivo",
    noServicesInCategory: "No hay servicios en esta categoria.",
    noServicesFound: "No se encontraron servicios.",
    close: "Cerrar",
    createLabel: "Crear servicio adicional",
    editLabel: "Editar servicio adicional",
    newService: "Nuevo servicio",
    upsellService: "Servicio adicional",
    saved: "Guardado",
    createServiceTitle: "Crear servicio",
    createServiceDescription: "Categoria, precio, disponibilidad y punto de contacto.",
    category: "Categoria",
    name: "Nombre",
    touchpoint: "Punto de contacto",
    currency: "Moneda",
    price: "Precio",
    availability: "Disponibilidad",
    bookableOptions: "Opciones de servicio reservable",
    bookableHint: "Reservable (los huespedes pueden elegir fecha y hora)",
    description: "Descripcion",
    imageUrl: "URL de imagen",
    timeSlots: "Franjas horarias (separadas por comas)",
    createServiceAction: "Crear servicio",
    readOnly: "Solo lectura",
    readOnlyDescription: "Pide a un manager configurar servicios adicionales.",
    detailsTitle: "Detalles",
    detailsDescription: "Editar la configuracion del servicio.",
    saveChanges: "Guardar cambios",
    disable: "Desactivar",
    enable: "Activar",
    delete: "Eliminar",
    unavailableTitle: "Servicio no disponible",
    unavailableDescription: "Actualiza la lista para ver los ultimos servicios.",
    backendUnreachable: "Backend no disponible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y luego recarga.",
    placeholders: {
      category: "Categoria 1",
      name: "Parking",
      description: "Descripcion del servicio...",
      imageUrl: "/images/room/nettoyage.png",
      timeSlots: "10:00 - 11:00, 12:00 - 13:00",
    },
    touchpoints: {
      before_stay: "Antes de la estancia",
      during_stay: "Durante la estancia",
      before_and_during: "Antes y durante la estancia",
    },
  },
} as const;

const weekdayChips = [
  { value: "mon", label: "M" },
  { value: "tue", label: "T" },
  { value: "wed", label: "W" },
  { value: "thu", label: "T" },
  { value: "fri", label: "F" },
  { value: "sat", label: "S" },
  { value: "sun", label: "S" }
] as const;

function touchpointLabel(touchpoint: string, t: (typeof upsellServicesCopy)[keyof typeof upsellServicesCopy]) {
  const normalized = touchpoint.trim().toLowerCase() as keyof (typeof upsellServicesCopy)[keyof typeof upsellServicesCopy]["touchpoints"];
  return t.touchpoints[normalized] ?? touchpoint;
}

export default async function UpsellServicesPage({ searchParams }: UpsellServicesPageProps) {
  const token = requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = upsellServicesCopy[locale];
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
    error = t.backendUnreachable;
  }

  const items = data?.items ?? [];
  const categories = items.map((item) => item.category).filter(Boolean);
  categories.sort((a, b) => a.localeCompare(b));

  const grouped = new Map<string, UpsellService[]>();
  for (const item of items) {
    const key = item.category || t.uncategorized;
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

    const description = String(formData.get("description") ?? "").trim() || null;
    const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
    const timeSlotsRaw = String(formData.get("timeSlots") ?? "").trim();
    const timeSlots = timeSlotsRaw ? timeSlotsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const bookable = String(formData.get("bookable") ?? "") === "on";

    const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, name, touchpoint, priceCents, currency, availabilityWeekdays, enabled, description, imageUrl, timeSlots, bookable }),
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

    const description = String(formData.get("description") ?? "").trim() || null;
    const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
    const timeSlotsRaw = String(formData.get("timeSlots") ?? "").trim();
    const timeSlots = timeSlotsRaw ? timeSlotsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const bookable = String(formData.get("bookable") ?? "") === "on";

    const response = await fetch(`${backendUrl}/api/v1/staff/upsell-services/${encodeURIComponent(serviceId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, name, touchpoint, priceCents, currency, availabilityWeekdays, enabled, description, imageUrl, timeSlots, bookable }),
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
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={openNewHref}>+ {t.addService}</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.filtersTitle}</CardTitle>
          <CardDescription>{t.filtersDescription}</CardDescription>
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
                  <CardDescription>{categoryTotal} {categoryTotal === 1 ? t.service : t.services}</CardDescription>
                </div>
                <Badge variant="secondary">{categoryTotal}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[1.4fr,160px,140px,1fr,140px] gap-0 border-t text-sm">
                  <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.name}</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.touchpoint}</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.price}</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.availability}</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.enabled}</div>
                </div>

                <div className="divide-y">
                  {services.map((service) => {
                    const touchpointName = touchpointLabel(service.touchpoint, t);
                    const available = new Set((service.availabilityWeekdays ?? []).map((day) => day.toLowerCase()));

                    return (
                      <div key={service.id} className="grid grid-cols-[1.4fr,160px,140px,1fr,140px] items-center gap-0 py-3">
                        <div className="px-4">
                          <div className="flex items-center gap-1.5">
                            <Link href={openDrawerHref(service.id)} className="truncate font-semibold hover:underline">
                              {service.name}
                            </Link>
                            {service.bookable ? (
                              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 text-[10px]">
                                {t.bookable}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{service.id}</p>
                        </div>
                        <div className="px-4 text-sm">{touchpointName}</div>
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
                              {service.enabled ? t.enabled : t.disabled}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {services.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground">{t.noServicesInCategory}</div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedCategories.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{t.noServicesFound}</p> : null}
      </div>

      {wantsNew || serviceId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label={t.close} />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wantsNew ? t.createLabel : t.editLabel}</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? t.newService : detail?.name ?? t.upsellService}</h2>
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
                      <CardTitle className="text-base">{t.createServiceTitle}</CardTitle>
                      <CardDescription>{t.createServiceDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createService} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="up-category">{t.category}</Label>
                          <Input id="up-category" name="category" placeholder={t.placeholders.category} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-name">{t.name}</Label>
                          <Input id="up-name" name="name" placeholder={t.placeholders.name} required />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="up-touchpoint">{t.touchpoint}</Label>
                            <select id="up-touchpoint" name="touchpoint" className={nativeSelectClassName} defaultValue="before_and_during">
                              {touchpointValues.map((value) => (
                                <option key={value} value={value}>
                                  {touchpointLabel(value, t)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-currency">{t.currency}</Label>
                            <select id="up-currency" name="currency" className={nativeSelectClassName} defaultValue="EUR">
                              <option value="EUR">EUR</option>
                              <option value="CHF">CHF</option>
                              <option value="DKK">DKK</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-price">{t.price}</Label>
                          <Input id="up-price" name="price" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                          <Label>{t.availability}</Label>
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
                          {t.enabled}
                        </label>

                        <div className="border-t pt-4 mt-4 space-y-4">
                          <p className="text-sm font-semibold text-muted-foreground">{t.bookableOptions}</p>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="bookable" />
                            {t.bookableHint}
                          </label>
                          <div className="space-y-2">
                            <Label htmlFor="up-description">{t.description}</Label>
                            <Input id="up-description" name="description" placeholder={t.placeholders.description} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-imageUrl">{t.imageUrl}</Label>
                            <Input id="up-imageUrl" name="imageUrl" placeholder={t.placeholders.imageUrl} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-timeSlots">{t.timeSlots}</Label>
                            <Input id="up-timeSlots" name="timeSlots" placeholder={t.placeholders.timeSlots} />
                          </div>
                        </div>

                        <Button type="submit" className="w-full">
                          {t.createServiceAction}
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
                      <form action={updateService} className="space-y-4">
                        <input type="hidden" name="serviceId" value={detail.id} />
                        <div className="space-y-2">
                          <Label htmlFor="up-category-edit">{t.category}</Label>
                          <Input id="up-category-edit" name="category" defaultValue={detail.category} disabled={!canManage} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="up-name-edit">{t.name}</Label>
                          <Input id="up-name-edit" name="name" defaultValue={detail.name} disabled={!canManage} required />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="up-touchpoint-edit">{t.touchpoint}</Label>
                            <select
                              id="up-touchpoint-edit"
                              name="touchpoint"
                              className={nativeSelectClassName}
                              defaultValue={detail.touchpoint}
                              disabled={!canManage}
                            >
                              {touchpointValues.map((value) => (
                                <option key={value} value={value}>
                                  {touchpointLabel(value, t)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-currency-edit">{t.currency}</Label>
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
                          <Label htmlFor="up-price-edit">{t.price}</Label>
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
                          <Label>{t.availability}</Label>
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
                          {t.enabled}
                        </label>

                        <div className="border-t pt-4 mt-4 space-y-4">
                          <p className="text-sm font-semibold text-muted-foreground">{t.bookableOptions}</p>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="bookable" defaultChecked={detail.bookable} disabled={!canManage} />
                            {t.bookableHint}
                          </label>
                          <div className="space-y-2">
                            <Label htmlFor="up-description-edit">{t.description}</Label>
                            <Input id="up-description-edit" name="description" defaultValue={detail.description ?? ""} disabled={!canManage} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-imageUrl-edit">{t.imageUrl}</Label>
                            <Input id="up-imageUrl-edit" name="imageUrl" defaultValue={detail.imageUrl ?? ""} disabled={!canManage} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="up-timeSlots-edit">{t.timeSlots}</Label>
                            <Input id="up-timeSlots-edit" name="timeSlots" defaultValue={(detail.timeSlots ?? []).join(", ")} disabled={!canManage} />
                          </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={toggleService} className="flex-1">
                        <input type="hidden" name="serviceId" value={detail.id} />
                        <input type="hidden" name="enabled" value={detail.enabled ? "1" : "0"} />
                        <Button type="submit" variant="outline" className="w-full">
                          {detail.enabled ? t.disable : t.enable}
                        </Button>
                      </form>
                      <form action={deleteService} className="flex-1">
                        <input type="hidden" name="serviceId" value={detail.id} />
                        <Button type="submit" variant="destructive" className="w-full">
                          {t.delete}
                        </Button>
                      </form>
                    </div>
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
