import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";

type SignupFormItem = {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  channel: string;
  status: string;
  config: unknown;
  createdByStaffUserId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type SignupFormsResponse = {
  items: SignupFormItem[];
};

type SignupFormsPageProps = {
  searchParams?: {
    formId?: string;
    new?: string;
    saved?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const signupFormsCopy = {
  en: {
    audience: "Audience",
    signUpForms: "Sign-up forms",
    title: "Sign-up forms",
    subtitle: "Manage forms shown during check-in or stay.",
    createSignUpForm: "Create sign-up form",
    forms: "Forms",
    formsDescription: "Click a row to view or edit the signup form.",
    table: {
      name: "Name",
      channel: "Channel",
      createdBy: "Created by",
      lastEdited: "Last edited",
    },
    noForms: "No sign-up forms yet.",
    close: "Close",
    create: "Create",
    edit: "Edit",
    managerAccess: "Manager access",
    readOnly: "Read-only",
    newSignUpForm: "New sign-up form",
    signUpForm: "Sign-up form",
    saved: "Saved",
    createFormTitle: "Create form",
    createFormDescription: "Name, channel, and optional description.",
    name: "Name",
    description: "Description",
    channel: "Channel",
    createSignUpFormAction: "Create sign-up form",
    readOnlyDescription: "Ask a manager to create or edit signup forms.",
    detailsTitle: "Details",
    detailsDescription: "Update the name, channel, and status.",
    status: "Status",
    active: "Active",
    archived: "Archived",
    saveChanges: "Save changes",
    duplicate: "Duplicate",
    delete: "Delete",
    unavailableTitle: "Sign-up form not available",
    unavailableDescription: "Refresh the list to see the latest forms.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
    placeholders: {
      name: "10% off your next stay",
      description: "Optional short text shown under the title",
    },
    channelLabels: {
      check_in: "Check-in",
      stay: "Stay",
      check_out: "Check-out",
    },
  },
  fr: {
    audience: "Audience",
    signUpForms: "Formulaires d'inscription",
    title: "Formulaires d'inscription",
    subtitle: "Gerer les formulaires affiches au check-in ou pendant le sejour.",
    createSignUpForm: "Creer formulaire",
    forms: "Formulaires",
    formsDescription: "Cliquez une ligne pour voir ou modifier le formulaire.",
    table: {
      name: "Nom",
      channel: "Canal",
      createdBy: "Cree par",
      lastEdited: "Derniere modification",
    },
    noForms: "Aucun formulaire d'inscription pour le moment.",
    close: "Fermer",
    create: "Creer",
    edit: "Modifier",
    managerAccess: "Acces manager",
    readOnly: "Lecture seule",
    newSignUpForm: "Nouveau formulaire",
    signUpForm: "Formulaire d'inscription",
    saved: "Enregistre",
    createFormTitle: "Creer formulaire",
    createFormDescription: "Nom, canal et description optionnelle.",
    name: "Nom",
    description: "Description",
    channel: "Canal",
    createSignUpFormAction: "Creer formulaire",
    readOnlyDescription: "Demandez a un manager de creer ou modifier les formulaires.",
    detailsTitle: "Details",
    detailsDescription: "Mettre a jour nom, canal et statut.",
    status: "Statut",
    active: "Actif",
    archived: "Archive",
    saveChanges: "Enregistrer modifications",
    duplicate: "Dupliquer",
    delete: "Supprimer",
    unavailableTitle: "Formulaire indisponible",
    unavailableDescription: "Actualisez la liste pour voir les derniers formulaires.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
    placeholders: {
      name: "10% de reduction sur votre prochain sejour",
      description: "Texte optionnel affiche sous le titre",
    },
    channelLabels: {
      check_in: "Check-in",
      stay: "Sejour",
      check_out: "Check-out",
    },
  },
  es: {
    audience: "Audiencia",
    signUpForms: "Formularios de registro",
    title: "Formularios de registro",
    subtitle: "Gestiona formularios mostrados durante check-in o estancia.",
    createSignUpForm: "Crear formulario",
    forms: "Formularios",
    formsDescription: "Haz clic en una fila para ver o editar el formulario.",
    table: {
      name: "Nombre",
      channel: "Canal",
      createdBy: "Creado por",
      lastEdited: "Ultima edicion",
    },
    noForms: "Aun no hay formularios de registro.",
    close: "Cerrar",
    create: "Crear",
    edit: "Editar",
    managerAccess: "Acceso manager",
    readOnly: "Solo lectura",
    newSignUpForm: "Nuevo formulario",
    signUpForm: "Formulario de registro",
    saved: "Guardado",
    createFormTitle: "Crear formulario",
    createFormDescription: "Nombre, canal y descripcion opcional.",
    name: "Nombre",
    description: "Descripcion",
    channel: "Canal",
    createSignUpFormAction: "Crear formulario",
    readOnlyDescription: "Pide a un manager crear o editar formularios.",
    detailsTitle: "Detalles",
    detailsDescription: "Actualizar nombre, canal y estado.",
    status: "Estado",
    active: "Activo",
    archived: "Archivado",
    saveChanges: "Guardar cambios",
    duplicate: "Duplicar",
    delete: "Eliminar",
    unavailableTitle: "Formulario no disponible",
    unavailableDescription: "Actualiza la lista para ver los ultimos formularios.",
    backendUnreachable: "Backend no disponible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y luego recarga.",
    placeholders: {
      name: "10% de descuento en tu proxima estancia",
      description: "Texto opcional mostrado bajo el titulo",
    },
    channelLabels: {
      check_in: "Check-in",
      stay: "Estancia",
      check_out: "Check-out",
    },
  },
} as const;

function buildSearchParams(current: SignupFormsPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
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

async function getSignupForms(token: string): Promise<SignupFormsResponse> {
  const response = await fetch(`${backendUrl}/api/v1/staff/signup-forms`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as SignupFormsResponse;
}

function channelLabel(channel: string, t: (typeof signupFormsCopy)[keyof typeof signupFormsCopy]) {
  const normalized = channel.trim().toLowerCase();
  if (normalized === "check_in" || normalized === "check-in") return t.channelLabels.check_in;
  if (normalized === "stay") return t.channelLabels.stay;
  if (normalized === "check_out" || normalized === "checkout" || normalized === "check-out") return t.channelLabels.check_out;
  return channel.replaceAll("_", " ");
}

export default async function SignupFormsPage({ searchParams }: SignupFormsPageProps) {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = signupFormsCopy[locale];
  const token = requireStaffToken();
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

  const formId = (searchParams?.formId ?? "").trim();
  const wantsNew = (searchParams?.new ?? "").trim() === "1";

  let data: SignupFormsResponse | null = null;
  let error: string | null = null;

  try {
    data = await getSignupForms(token);
  } catch {
    error = t.backendUnreachable;
  }

  const items = data?.items ?? [];
  const selectedForm = formId ? items.find((item) => item.id === formId) ?? null : null;

  const openNewHref = (() => {
    const next = buildSearchParams(searchParams, { new: "1", formId: null, saved: null, error: null });
    return `/audience/signup-forms?${next.toString()}`;
  })();

  const openFormHref = (id: string) => {
    const next = buildSearchParams(searchParams, { formId: id, new: null, saved: null, error: null });
    return `/audience/signup-forms?${next.toString()}`;
  };

  const closeDrawerHref = (() => {
    const next = buildSearchParams(searchParams, { formId: null, new: null, saved: null, error: null });
    const value = next.toString();
    return value ? `/audience/signup-forms?${value}` : "/audience/signup-forms";
  })();

  async function createSignupForm(formData: FormData) {
    "use server";

    const token = requireStaffToken();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const channel = String(formData.get("channel") ?? "").trim();

    const response = await fetch(`${backendUrl}/api/v1/staff/signup-forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description: description || null, channel }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, new: "1" });
      redirect(`/audience/signup-forms?${next.toString()}`);
    }

    const id = typeof payload?.signupForm?.id === "string" ? payload.signupForm.id : "";
    if (!id) redirect("/audience/signup-forms?error=invalid_signup_form");

    const next = buildSearchParams(searchParams, { formId: id, new: null, saved: "created", error: null });
    redirect(`/audience/signup-forms?${next.toString()}`);
  }

  async function updateSignupForm(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const formId = String(formData.get("formId") ?? "").trim();
    if (!formId) redirect("/audience/signup-forms");

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const channel = String(formData.get("channel") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    const response = await fetch(`${backendUrl}/api/v1/staff/signup-forms/${encodeURIComponent(formId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description: description || null, channel, status }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { formId, error: errorCode, saved: null });
      redirect(`/audience/signup-forms?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { formId, saved: "updated", error: null });
    redirect(`/audience/signup-forms?${next.toString()}`);
  }

  async function duplicateSignupForm(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const channel = String(formData.get("channel") ?? "").trim();
    const status = String(formData.get("status") ?? "active").trim();
    const configRaw = String(formData.get("config") ?? "").trim();

    let config: unknown = {};
    try {
      config = configRaw ? JSON.parse(configRaw) : {};
    } catch {
      config = {};
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/signup-forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: name ? `Copy of ${name}` : "Copy",
        description: description || null,
        channel: channel || "check_in",
        status,
        config
      }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, saved: null });
      redirect(`/audience/signup-forms?${next.toString()}`);
    }

    const id = typeof payload?.signupForm?.id === "string" ? payload.signupForm.id : "";
    if (!id) redirect("/audience/signup-forms?error=invalid_signup_form");

    const next = buildSearchParams(searchParams, { formId: id, new: null, saved: "duplicated", error: null });
    redirect(`/audience/signup-forms?${next.toString()}`);
  }

  async function deleteSignupForm(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const formId = String(formData.get("formId") ?? "").trim();
    if (!formId) redirect("/audience/signup-forms");

    const response = await fetch(`${backendUrl}/api/v1/staff/signup-forms/${encodeURIComponent(formId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { formId, error: errorCode, saved: null });
      redirect(`/audience/signup-forms?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { formId: null, new: null, saved: "deleted", error: null });
    redirect(`/audience/signup-forms?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/audience" className="hover:underline">
              {t.audience}
            </Link>{" "}
            <span className="mx-1 text-muted-foreground">›</span> {t.signUpForms}
          </p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={openNewHref}>+ {t.createSignUpForm}</Link>
          </Button>
        ) : null}
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.forms}</CardTitle>
          <CardDescription>{t.formsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr,140px,180px,190px] gap-0 border-t text-sm">
            <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.name}</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.channel}</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.createdBy}</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">{t.table.lastEdited}</div>
          </div>

          <div className="divide-y">
            {items.map((form) => (
              <Link
                key={form.id}
                href={openFormHref(form.id)}
                className="grid grid-cols-[1fr,140px,180px,190px] items-center gap-0 py-4 hover:bg-accent/20"
              >
                <div className="px-4">
                  <p className="truncate font-semibold">{form.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{form.description ?? "—"}</p>
                </div>
                <div className="px-4">
                  <Badge variant="outline">{channelLabel(form.channel, t)}</Badge>
                </div>
                <div className="px-4 text-sm">{form.createdBy ?? "—"}</div>
                <div className="px-4 text-sm text-muted-foreground">{new Date(form.updatedAt).toLocaleString()}</div>
              </Link>
            ))}

            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">{t.noForms}</div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {wantsNew || formId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label={t.close} />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {wantsNew ? t.create : t.edit} · {canManage ? t.managerAccess : t.readOnly}
                </p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? t.newSignUpForm : selectedForm?.name ?? t.signUpForm}</h2>
                {selectedForm ? <p className="truncate text-xs text-muted-foreground font-mono">{selectedForm.id}</p> : null}
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
                      <CardTitle className="text-base">{t.createFormTitle}</CardTitle>
                      <CardDescription>{t.createFormDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createSignupForm} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sf-name">{t.name}</Label>
                          <Input id="sf-name" name="name" placeholder={t.placeholders.name} required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sf-description">{t.description}</Label>
                          <Input id="sf-description" name="description" placeholder={t.placeholders.description} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sf-channel">{t.channel}</Label>
                          <select id="sf-channel" name="channel" className={nativeSelectClassName} defaultValue="check_in">
                            <option value="check_in">{t.channelLabels.check_in}</option>
                            <option value="stay">{t.channelLabels.stay}</option>
                            <option value="check_out">{t.channelLabels.check_out}</option>
                          </select>
                        </div>

                        <Button type="submit" className="w-full">
                          {t.createSignUpFormAction}
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
              ) : selectedForm ? (
                <>
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">{t.detailsTitle}</CardTitle>
                      <CardDescription>{t.detailsDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={updateSignupForm} className="space-y-4">
                        <input type="hidden" name="formId" value={selectedForm.id} />
                        <div className="space-y-2">
                          <Label htmlFor="sf-name-edit">{t.name}</Label>
                          <Input id="sf-name-edit" name="name" defaultValue={selectedForm.name} required disabled={!canManage} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sf-description-edit">{t.description}</Label>
                          <Input
                            id="sf-description-edit"
                            name="description"
                            defaultValue={selectedForm.description ?? ""}
                            disabled={!canManage}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="sf-channel-edit">{t.channel}</Label>
                            <select
                              id="sf-channel-edit"
                              name="channel"
                              className={nativeSelectClassName}
                              defaultValue={selectedForm.channel}
                              disabled={!canManage}
                            >
                              <option value="check_in">{t.channelLabels.check_in}</option>
                              <option value="stay">{t.channelLabels.stay}</option>
                              <option value="check_out">{t.channelLabels.check_out}</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sf-status-edit">{t.status}</Label>
                            <select
                              id="sf-status-edit"
                              name="status"
                              className={nativeSelectClassName}
                              defaultValue={selectedForm.status}
                              disabled={!canManage}
                            >
                              <option value="active">{t.active}</option>
                              <option value="archived">{t.archived}</option>
                            </select>
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
                      <form action={duplicateSignupForm}>
                        <input type="hidden" name="name" value={selectedForm.name} />
                        <input type="hidden" name="description" value={selectedForm.description ?? ""} />
                        <input type="hidden" name="channel" value={selectedForm.channel} />
                        <input type="hidden" name="status" value={selectedForm.status} />
                        <input type="hidden" name="config" value={JSON.stringify(selectedForm.config ?? {})} />
                        <Button type="submit" variant="outline">
                          {t.duplicate}
                        </Button>
                      </form>
                      <form action={deleteSignupForm}>
                        <input type="hidden" name="formId" value={selectedForm.id} />
                        <Button type="submit" variant="destructive">
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
