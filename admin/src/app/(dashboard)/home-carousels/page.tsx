import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LayoutGrid, Plus, Save, Trash2, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";
import { RestaurantConfigEditor } from "./_components/restaurant-config-editor";

type ExperienceItem = {
  id: string;
  sectionId: string;
  label: string;
  imageUrl: string;
  linkUrl: string | null;
  type: string;
  restaurantConfig: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
};

type ExperienceSection = {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  sortOrder: number;
  isActive: boolean;
  items: ExperienceItem[];
};

type ExperiencesResponse = {
  sections: ExperienceSection[];
};

type HomeCarouselsPageProps = {
  searchParams?: {
    saved?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const homeCarouselsCopy = {
  en: {
    title: "Upselling",
    homePage: "Home page",
    subtitle: "Create categories and upsells (titles, photos, order) displayed as carousels on the mobile home.",
    saved: "Saved",
    noAccessTitle: "Upselling",
    noAccessDescription: "Only managers and admins can edit upsells shown on the guest home page.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
    addSectionTitle: "Add a section",
    addSectionDescription: "Slug is optional (auto-generated). Examples: tailored, culinary, activities.",
    slug: "Slug",
    titleFr: "Title (FR)",
    titleEn: "Title (EN)",
    add: "Add",
    active: "Active",
    hidden: "Hidden",
    order: "Order",
    sectionSettings: "Section settings",
    sortOrder: "Sort order",
    saveSection: "Save section",
    cards: "Cards",
    table: {
      preview: "Preview",
      type: "Type",
      label: "Label",
      image: "Image",
      link: "Link",
      order: "Order",
      status: "Status",
    },
    noImage: "No image",
    typeDefault: "Default",
    typeRestaurant: "Restaurant",
    linkUrl: "Link URL",
    save: "Save",
    restaurantConfig: "Restaurant Menu Config",
    addCardTitle: "Add a card",
    addCardDescription: "Upload an image (stored in backend `/uploads`). Set type to \"Restaurant\" to enable menu configuration.",
    noSectionsYet: "No sections yet",
    createFirstSection: "Create your first section above.",
    placeholders: {
      slug: "tailored",
      titleFr: "Plaisirs sur mesure",
      titleEn: "Tailored experiences",
      label: "SEA FU",
      link: "/services",
    },
  },
  fr: {
    title: "Vente additionnelle",
    homePage: "Page d'accueil",
    subtitle: "Creez des categories et services additionnels (titres, photos, ordre) affiches en carrousels sur l'accueil mobile.",
    saved: "Enregistre",
    noAccessTitle: "Vente additionnelle",
    noAccessDescription: "Seuls les managers et admins peuvent modifier les upsells affiches sur la page d'accueil client.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
    addSectionTitle: "Ajouter une section",
    addSectionDescription: "Le slug est optionnel (auto-genere). Exemples: tailored, culinary, activities.",
    slug: "Slug",
    titleFr: "Titre (FR)",
    titleEn: "Titre (EN)",
    add: "Ajouter",
    active: "Actif",
    hidden: "Cache",
    order: "Ordre",
    sectionSettings: "Parametres de section",
    sortOrder: "Ordre de tri",
    saveSection: "Enregistrer section",
    cards: "Cartes",
    table: {
      preview: "Apercu",
      type: "Type",
      label: "Libelle",
      image: "Image",
      link: "Lien",
      order: "Ordre",
      status: "Statut",
    },
    noImage: "Pas d'image",
    typeDefault: "Defaut",
    typeRestaurant: "Restaurant",
    linkUrl: "URL du lien",
    save: "Enregistrer",
    restaurantConfig: "Configuration menu restaurant",
    addCardTitle: "Ajouter une carte",
    addCardDescription: "Telechargez une image (stockee dans le backend `/uploads`). Definissez le type sur \"Restaurant\" pour activer la configuration menu.",
    noSectionsYet: "Aucune section",
    createFirstSection: "Creez votre premiere section ci-dessus.",
    placeholders: {
      slug: "tailored",
      titleFr: "Plaisirs sur mesure",
      titleEn: "Experiences sur mesure",
      label: "SEA FU",
      link: "/services",
    },
  },
  es: {
    title: "Venta adicional",
    homePage: "Pagina de inicio",
    subtitle: "Crea categorias y upsells (titulos, fotos, orden) mostrados como carruseles en el inicio movil.",
    saved: "Guardado",
    noAccessTitle: "Venta adicional",
    noAccessDescription: "Solo managers y admins pueden editar upsells mostrados en la pagina de inicio del huesped.",
    backendUnreachable: "Backend no disponible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y luego recarga.",
    addSectionTitle: "Agregar una seccion",
    addSectionDescription: "El slug es opcional (auto-generado). Ejemplos: tailored, culinary, activities.",
    slug: "Slug",
    titleFr: "Titulo (FR)",
    titleEn: "Titulo (EN)",
    add: "Agregar",
    active: "Activo",
    hidden: "Oculto",
    order: "Orden",
    sectionSettings: "Ajustes de seccion",
    sortOrder: "Orden de clasificacion",
    saveSection: "Guardar seccion",
    cards: "Tarjetas",
    table: {
      preview: "Vista previa",
      type: "Tipo",
      label: "Etiqueta",
      image: "Imagen",
      link: "Enlace",
      order: "Orden",
      status: "Estado",
    },
    noImage: "Sin imagen",
    typeDefault: "Predeterminado",
    typeRestaurant: "Restaurante",
    linkUrl: "URL del enlace",
    save: "Guardar",
    restaurantConfig: "Configuracion menu restaurante",
    addCardTitle: "Agregar tarjeta",
    addCardDescription: "Sube una imagen (guardada en backend `/uploads`). Pon el tipo en \"Restaurant\" para habilitar configuracion de menu.",
    noSectionsYet: "Aun no hay secciones",
    createFirstSection: "Crea tu primera seccion arriba.",
    placeholders: {
      slug: "tailored",
      titleFr: "Plaisirs sur mesure",
      titleEn: "Experiencias a medida",
      label: "SEA FU",
      link: "/services",
    },
  },
} as const;

async function fetchExperiences(token: string): Promise<ExperiencesResponse> {
  const response = await fetch(`${backendUrl}/api/v1/staff/experiences`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as ExperiencesResponse;
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${backendUrl}/api/v1/upload`, {
    method: "POST",
    body: form,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok) {
    const code = typeof payload?.error === "string" ? payload.error : `upload_failed_${response.status}`;
    throw new Error(code);
  }

  const url = typeof payload?.url === "string" ? payload.url.trim() : "";
  if (!url) throw new Error("upload_missing_url");
  return url.startsWith("http") ? url : `${backendUrl}${url}`;
}

function parseNumber(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function slugify(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export default async function HomeCarouselsPage({ searchParams }: HomeCarouselsPageProps) {
  const token = requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = homeCarouselsCopy[locale];
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.noAccessTitle}</CardTitle>
          <CardDescription>{t.noAccessDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let data: ExperiencesResponse | null = null;
  let error: string | null = null;

  try {
    data = await fetchExperiences(token);
  } catch {
    error = t.backendUnreachable;
  }

  const sections = data?.sections ?? [];

  async function createSection(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const titleFr = String(formData.get("titleFr") ?? "").trim();
    const titleEn = String(formData.get("titleEn") ?? "").trim();
    const slugRaw = String(formData.get("slug") ?? "").trim();
    const slug = slugRaw || slugify(titleEn || titleFr);

    const response = await fetch(`${backendUrl}/api/v1/staff/experiences/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slug, titleFr, titleEn }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/home-carousels");
    redirect("/home-carousels?saved=section_created");
  }

  async function updateSection(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const id = String(formData.get("sectionId") ?? "").trim();
    if (!id) redirect("/home-carousels?error=missing_section");

    const titleFr = String(formData.get("titleFr") ?? "").trim();
    const titleEn = String(formData.get("titleEn") ?? "").trim();
    const sortOrder = parseNumber(formData.get("sortOrder"));
    const isActive = String(formData.get("isActive") ?? "") === "on";

    const response = await fetch(`${backendUrl}/api/v1/staff/experiences/sections/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        titleFr: titleFr || undefined,
        titleEn: titleEn || undefined,
        sortOrder: sortOrder ?? undefined,
        isActive
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/home-carousels");
    redirect("/home-carousels?saved=section_updated");
  }

  async function createItem(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const sectionId = String(formData.get("sectionId") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim();
    const linkUrl = String(formData.get("linkUrl") ?? "").trim();
    const itemType = String(formData.get("type") ?? "default").trim();

    let imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const file = formData.get("imageFile");
    if (file instanceof File && file.size > 0) {
      try {
        imageUrl = await uploadImage(file);
      } catch (error) {
        const code = error instanceof Error ? error.message : "upload_failed";
        redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
      }
    }

    if (!imageUrl) redirect("/home-carousels?error=missing_image");

    const response = await fetch(`${backendUrl}/api/v1/staff/experiences/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sectionId, label, imageUrl, linkUrl: linkUrl || null, type: itemType }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/home-carousels");
    redirect("/home-carousels?saved=item_created");
  }

  async function updateItem(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const itemId = String(formData.get("itemId") ?? "").trim();
    if (!itemId) redirect("/home-carousels?error=missing_item");

    const label = String(formData.get("label") ?? "").trim();
    const linkUrl = String(formData.get("linkUrl") ?? "").trim();
    const sortOrder = parseNumber(formData.get("sortOrder"));
    const isActive = String(formData.get("isActive") ?? "") === "on";
    const itemType = String(formData.get("type") ?? "").trim();

    let imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const file = formData.get("imageFile");
    if (file instanceof File && file.size > 0) {
      try {
        imageUrl = await uploadImage(file);
      } catch (error) {
        const code = error instanceof Error ? error.message : "upload_failed";
        redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
      }
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/experiences/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        label: label || undefined,
        imageUrl: imageUrl || undefined,
        linkUrl: linkUrl || null,
        type: itemType || undefined,
        sortOrder: sortOrder ?? undefined,
        isActive
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/home-carousels");
    redirect("/home-carousels?saved=item_updated");
  }

  async function deleteItem(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const itemId = String(formData.get("itemId") ?? "").trim();
    if (!itemId) redirect("/home-carousels?error=missing_item");

    const response = await fetch(`${backendUrl}/api/v1/staff/experiences/items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/home-carousels?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/home-carousels");
    redirect("/home-carousels?saved=item_deleted");
  }

  const saved = (searchParams?.saved ?? "").trim();
  const errorFromQuery = (searchParams?.error ?? "").trim();
  const errorCode = error ?? (errorFromQuery ? errorFromQuery : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <Badge variant="secondary">{t.homePage}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {errorCode ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{errorCode}</div>
      ) : null}
      {saved ? (
        <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-700">{t.saved}: {saved}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.addSectionTitle}</CardTitle>
          <CardDescription>{t.addSectionDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSection} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="slug">{t.slug}</Label>
              <Input id="slug" name="slug" placeholder={t.placeholders.slug} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleFr">{t.titleFr}</Label>
              <Input id="titleFr" name="titleFr" placeholder={t.placeholders.titleFr} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleEn">{t.titleEn}</Label>
              <Input id="titleEn" name="titleEn" placeholder={t.placeholders.titleEn} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t.add}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{section.slug}</CardTitle>
              <Badge variant={section.isActive ? "secondary" : "outline"}>{section.isActive ? t.active : t.hidden}</Badge>
              <Badge variant="outline">{t.order} {section.sortOrder}</Badge>
            </div>
            <CardDescription>{t.sectionSettings}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={updateSection} className="grid gap-4 md:grid-cols-5">
              <input type="hidden" name="sectionId" value={section.id} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`titleFr-${section.id}`}>{t.titleFr}</Label>
                <Input id={`titleFr-${section.id}`} name="titleFr" defaultValue={section.titleFr} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`titleEn-${section.id}`}>{t.titleEn}</Label>
                <Input id={`titleEn-${section.id}`} name="titleEn" defaultValue={section.titleEn} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sort-${section.id}`}>{t.sortOrder}</Label>
                <Input id={`sort-${section.id}`} name="sortOrder" type="number" defaultValue={section.sortOrder} />
              </div>
              <div className="flex items-end gap-3 md:col-span-5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={section.isActive} />
                  {t.active}
                </label>
                <Button type="submit" variant="outline" className="ml-auto">
                  <Save className="mr-2 h-4 w-4" />
                  {t.saveSection}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.cards}</p>
                <Badge variant="secondary">{section.items.length}</Badge>
              </div>

	              <div className="overflow-hidden rounded-lg border">
	                <div className="hidden grid-cols-[1fr,1fr,2fr,2fr,2fr,1fr,1fr] gap-2 bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground md:grid">
	                  <span>{t.table.preview}</span>
	                  <span>{t.table.type}</span>
	                  <span>{t.table.label}</span>
	                  <span>{t.table.image}</span>
	                  <span>{t.table.link}</span>
	                  <span>{t.table.order}</span>
	                  <span>{t.table.status}</span>
	                </div>

                <div className="divide-y">
	                  {section.items.map((item) => (
	                    <div key={item.id} className="p-3 space-y-3">
	                      <form
	                        action={updateItem}
	                        encType="multipart/form-data"
	                        className="grid gap-3 md:grid-cols-[1fr,1fr,2fr,2fr,2fr,1fr,1fr] md:items-end"
	                      >
	                        <input type="hidden" name="itemId" value={item.id} />

	                        <div className="relative h-16 w-full overflow-hidden rounded-md border bg-muted/20 md:h-12">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={item.imageUrl.startsWith('/') ? `${backendUrl}${item.imageUrl}` : item.imageUrl} 
                              alt={item.label} 
                              className="h-full w-full object-cover" 
                            />
	                          ) : (
	                            <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
	                              {t.noImage}
	                            </div>
	                          )}
	                        </div>

	                        <div className="space-y-2 md:space-y-0">
	                          <Label className="md:hidden">{t.table.type}</Label>
	                          <select
	                            name="type"
	                            defaultValue={item.type || "default"}
	                            className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
	                          >
	                            <option value="default">{t.typeDefault}</option>
	                            <option value="restaurant">{t.typeRestaurant}</option>
	                          </select>
	                        </div>

	                        <div className="space-y-2 md:space-y-0">
	                          <Label className="md:hidden">{t.table.label}</Label>
	                          <Input name="label" defaultValue={item.label} />
	                        </div>

	                        <div className="space-y-2 md:space-y-0">
	                          <Label className="md:hidden">{t.table.image}</Label>
	                          <Input name="imageFile" type="file" accept="image/*" />
	                          <input type="hidden" name="imageUrl" value={item.imageUrl} />
	                        </div>

	                        <div className="space-y-2 md:space-y-0">
	                          <Label className="md:hidden">{t.linkUrl}</Label>
	                          <Input name="linkUrl" defaultValue={item.linkUrl ?? ""} placeholder={t.placeholders.link} />
                        </div>

                        <div className="space-y-2 md:space-y-0">
                          <Label className="md:hidden">{t.table.order}</Label>
                          <Input name="sortOrder" type="number" defaultValue={item.sortOrder} />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                            <span className="md:hidden">{t.active}</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <Button type="submit" size="sm" variant="outline">
                              {t.save}
                            </Button>
                            <Button formAction={deleteItem} type="submit" size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </form>

                      {/* Restaurant config editor for restaurant-type items */}
                      {item.type === "restaurant" && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-600">{t.restaurantConfig}</span>
                          </div>
                          <RestaurantConfigEditor
                            itemId={item.id}
                            config={(item.restaurantConfig ?? {}) as Record<string, unknown>}
                            backendUrl={backendUrl}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

	              <Card className="bg-muted/20">
	                <CardHeader>
	                  <CardTitle className="text-base">{t.addCardTitle}</CardTitle>
	                  <CardDescription>{t.addCardDescription}</CardDescription>
	                </CardHeader>
	                <CardContent>
	                  <form action={createItem} encType="multipart/form-data" className="grid gap-4 md:grid-cols-6">
	                    <input type="hidden" name="sectionId" value={section.id} />
	                    <div className="space-y-2">
	                      <Label htmlFor={`type-${section.id}`}>{t.table.type}</Label>
	                      <select
	                        id={`type-${section.id}`}
	                        name="type"
	                        defaultValue="default"
	                        className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
	                      >
	                        <option value="default">{t.typeDefault}</option>
	                        <option value="restaurant">{t.typeRestaurant}</option>
	                      </select>
	                    </div>
	                    <div className="space-y-2">
	                      <Label htmlFor={`label-${section.id}`}>{t.table.label}</Label>
	                      <Input id={`label-${section.id}`} name="label" placeholder={t.placeholders.label} required />
	                    </div>
	                    <div className="space-y-2 md:col-span-2">
	                      <Label htmlFor={`img-${section.id}`}>{t.table.image}</Label>
	                      <Input id={`img-${section.id}`} name="imageFile" type="file" accept="image/*" required />
	                    </div>
	                    <div className="space-y-2">
	                      <Label htmlFor={`link-${section.id}`}>{t.linkUrl}</Label>
	                      <Input id={`link-${section.id}`} name="linkUrl" placeholder={t.placeholders.link} />
	                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        {t.add}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ))}

      {sections.length === 0 && !errorCode ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.noSectionsYet}</CardTitle>
            <CardDescription>{t.createFirstSection}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
