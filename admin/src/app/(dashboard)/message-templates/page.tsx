import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { MessageTemplatesFilters } from "@/components/message-templates/message-templates-filters";
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

type MessageTemplate = {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  channel: string;
  status: string;
  content: unknown;
  createdByStaffUserId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type MessageTemplatesResponse = {
  items: MessageTemplate[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type MessageTemplatesPageProps = {
  searchParams?: {
    search?: string;
    status?: string;
    channel?: string;
    page?: string;
    templateId?: string;
    new?: string;
    saved?: string;
    error?: string;
  };
};

type TemplateLocaleContent = { subject?: string; bodyText?: string };
type TemplateContent = { defaultLocale?: string; locales?: Record<string, TemplateLocaleContent> };

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const messageTemplatesCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Message templates",
    subtitle: "Reusable templates for automations and manual messages.",
    createMessage: "Create message",
    filtersTitle: "Filters",
    filtersDescription: "Search, channel, and status.",
    templatesTitle: "Templates",
    templatesDescription: "Sorted by last updated.",
    previous: "Previous",
    next: "Next",
    template: "template",
    templates: "templates",
    updated: "Updated",
    noTemplates: "No templates found.",
    close: "Close",
    createLabel: "Create message template",
    editLabel: "Edit message template",
    newMessage: "New message",
    messageTemplate: "Message template",
    saved: "Saved",
    createTemplateTitle: "Create template",
    createTemplateDescription: "Channel, status, and multilingual content.",
    name: "Name",
    description: "Description",
    channel: "Channel",
    status: "Status",
    defaultLanguage: "Default language",
    english: "English",
    french: "French",
    subject: "Subject",
    body: "Body",
    subjectAndMessage: "Subject and message.",
    previewAndEdit: "Preview and edit.",
    writeMessage: "Write a message...",
    writeMessageFr: "Write a message in French...",
    createTemplateAction: "Create template",
    readOnly: "Read-only",
    readOnlyDescription: "Ask a manager to create or edit message templates.",
    detailsTitle: "Details",
    detailsDescription: "Edit fields, languages, and status.",
    saveChanges: "Save changes",
    duplicate: "Duplicate",
    archive: "Archive",
    unavailableTitle: "Template not available",
    unavailableDescription: "Refresh to see latest templates.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
    placeholders: {
      name: "Check in now",
      description: "Optional description",
      subjectEn: "Check in now",
      subjectFr: "Check in now",
    },
    channelLabels: {
      email: "Email",
      sms: "SMS",
      app: "App",
    },
    statusLabels: {
      draft: "Draft",
      published: "Published",
      archived: "Archived",
    },
  },
  fr: {
    appName: "MyStay Admin",
    title: "Modeles de messages",
    subtitle: "Modeles reutilisables pour automatisations et messages manuels.",
    createMessage: "Creer message",
    filtersTitle: "Filtres",
    filtersDescription: "Recherche, canal et statut.",
    templatesTitle: "Modeles",
    templatesDescription: "Tries par derniere mise a jour.",
    previous: "Precedent",
    next: "Suivant",
    template: "modele",
    templates: "modeles",
    updated: "Mis a jour",
    noTemplates: "Aucun modele trouve.",
    close: "Fermer",
    createLabel: "Creer modele de message",
    editLabel: "Modifier modele de message",
    newMessage: "Nouveau message",
    messageTemplate: "Modele de message",
    saved: "Enregistre",
    createTemplateTitle: "Creer modele",
    createTemplateDescription: "Canal, statut et contenu multilingue.",
    name: "Nom",
    description: "Description",
    channel: "Canal",
    status: "Statut",
    defaultLanguage: "Langue par defaut",
    english: "Anglais",
    french: "Francais",
    subject: "Objet",
    body: "Corps",
    subjectAndMessage: "Objet et message.",
    previewAndEdit: "Previsualiser et modifier.",
    writeMessage: "Ecrivez un message...",
    writeMessageFr: "Ecrivez un message en francais...",
    createTemplateAction: "Creer modele",
    readOnly: "Lecture seule",
    readOnlyDescription: "Demandez a un manager de creer ou modifier des modeles.",
    detailsTitle: "Details",
    detailsDescription: "Modifier les champs, langues et statut.",
    saveChanges: "Enregistrer modifications",
    duplicate: "Dupliquer",
    archive: "Archiver",
    unavailableTitle: "Modele indisponible",
    unavailableDescription: "Actualisez pour voir les derniers modeles.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
    placeholders: {
      name: "Check-in maintenant",
      description: "Description optionnelle",
      subjectEn: "Check-in now",
      subjectFr: "Check-in maintenant",
    },
    channelLabels: {
      email: "Email",
      sms: "SMS",
      app: "Application",
    },
    statusLabels: {
      draft: "Brouillon",
      published: "Publie",
      archived: "Archive",
    },
  },
  es: {
    appName: "MyStay Admin",
    title: "Plantillas de mensajes",
    subtitle: "Plantillas reutilizables para automatizaciones y mensajes manuales.",
    createMessage: "Crear mensaje",
    filtersTitle: "Filtros",
    filtersDescription: "Busqueda, canal y estado.",
    templatesTitle: "Plantillas",
    templatesDescription: "Ordenadas por ultima actualizacion.",
    previous: "Anterior",
    next: "Siguiente",
    template: "plantilla",
    templates: "plantillas",
    updated: "Actualizado",
    noTemplates: "No se encontraron plantillas.",
    close: "Cerrar",
    createLabel: "Crear plantilla de mensaje",
    editLabel: "Editar plantilla de mensaje",
    newMessage: "Nuevo mensaje",
    messageTemplate: "Plantilla de mensaje",
    saved: "Guardado",
    createTemplateTitle: "Crear plantilla",
    createTemplateDescription: "Canal, estado y contenido multilingue.",
    name: "Nombre",
    description: "Descripcion",
    channel: "Canal",
    status: "Estado",
    defaultLanguage: "Idioma predeterminado",
    english: "Ingles",
    french: "Frances",
    subject: "Asunto",
    body: "Cuerpo",
    subjectAndMessage: "Asunto y mensaje.",
    previewAndEdit: "Previsualizar y editar.",
    writeMessage: "Escribe un mensaje...",
    writeMessageFr: "Escribe un mensaje en frances...",
    createTemplateAction: "Crear plantilla",
    readOnly: "Solo lectura",
    readOnlyDescription: "Pide a un manager crear o editar plantillas de mensajes.",
    detailsTitle: "Detalles",
    detailsDescription: "Editar campos, idiomas y estado.",
    saveChanges: "Guardar cambios",
    duplicate: "Duplicar",
    archive: "Archivar",
    unavailableTitle: "Plantilla no disponible",
    unavailableDescription: "Actualiza para ver las ultimas plantillas.",
    backendUnreachable: "Backend no disponible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y luego recarga.",
    placeholders: {
      name: "Check-in ahora",
      description: "Descripcion opcional",
      subjectEn: "Check in now",
      subjectFr: "Check-in ahora",
    },
    channelLabels: {
      email: "Correo",
      sms: "SMS",
      app: "App",
    },
    statusLabels: {
      draft: "Borrador",
      published: "Publicado",
      archived: "Archivado",
    },
  },
} as const;

function buildSearchParams(current: MessageTemplatesPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
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

async function getMessageTemplates(token: string, query: URLSearchParams): Promise<MessageTemplatesResponse> {
  const qs = query.toString();
  const response = await fetch(
    qs ? `${backendUrl}/api/v1/staff/message-templates?${qs}` : `${backendUrl}/api/v1/staff/message-templates`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as MessageTemplatesResponse;
}

async function getMessageTemplate(token: string, id: string): Promise<MessageTemplate | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/message-templates/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { template?: MessageTemplate };
  return payload.template ?? null;
}

function normalizeContent(raw: unknown): Required<TemplateContent> {
  const fallback: Required<TemplateContent> = { defaultLocale: "en", locales: { en: { subject: "", bodyText: "" } } };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const obj = raw as TemplateContent;
  const defaultLocale = typeof obj.defaultLocale === "string" && obj.defaultLocale.trim() ? obj.defaultLocale.trim() : "en";
  const locales: Record<string, TemplateLocaleContent> = {};
  if (obj.locales && typeof obj.locales === "object" && !Array.isArray(obj.locales)) {
    for (const [key, value] of Object.entries(obj.locales)) {
      if (!key.trim() || !value || typeof value !== "object" || Array.isArray(value)) continue;
      locales[key] = value as TemplateLocaleContent;
    }
  }
  if (!locales[defaultLocale]) locales[defaultLocale] = {};
  if (!locales.en) locales.en = {};
  if (!locales.fr) locales.fr = locales.fr ?? {};
  return { defaultLocale, locales };
}

function statusBadge(status: string, t: (typeof messageTemplatesCopy)[keyof typeof messageTemplatesCopy]) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "published") return { label: t.statusLabels.published, className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (normalized === "archived") return { label: t.statusLabels.archived, className: "border-muted/40 bg-muted/20 text-muted-foreground" };
  return { label: t.statusLabels.draft, className: "border-amber-200 bg-amber-50 text-amber-800" };
}

function channelBadge(channel: string, t: (typeof messageTemplatesCopy)[keyof typeof messageTemplatesCopy]) {
  const normalized = channel.trim().toLowerCase();
  if (normalized === "email") return { label: t.channelLabels.email, className: "border-blue-200 bg-blue-50 text-blue-800" };
  if (normalized === "sms") return { label: t.channelLabels.sms, className: "border-violet-200 bg-violet-50 text-violet-800" };
  return { label: t.channelLabels.app, className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
}

function channelLabel(channel: string, t: (typeof messageTemplatesCopy)[keyof typeof messageTemplatesCopy]) {
  const normalized = channel.trim().toLowerCase() as keyof (typeof messageTemplatesCopy)[keyof typeof messageTemplatesCopy]["channelLabels"];
  return t.channelLabels[normalized] ?? channel.toUpperCase();
}

function statusLabel(status: string, t: (typeof messageTemplatesCopy)[keyof typeof messageTemplatesCopy]) {
  const normalized = status.trim().toLowerCase() as keyof (typeof messageTemplatesCopy)[keyof typeof messageTemplatesCopy]["statusLabels"];
  return t.statusLabels[normalized] ?? status.replaceAll("_", " ");
}

function languagesFromContent(content: unknown) {
  const normalized = normalizeContent(content);
  return Object.keys(normalized.locales).filter((locale) => {
    const entry = normalized.locales[locale] ?? {};
    const subject = (entry.subject ?? "").trim();
    const bodyText = (entry.bodyText ?? "").trim();
    return subject || bodyText;
  });
}

export default async function MessageTemplatesPage({ searchParams }: MessageTemplatesPageProps) {
  const token = requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = messageTemplatesCopy[locale];
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

  const templateId = (searchParams?.templateId ?? "").trim();
  const wantsNew = (searchParams?.new ?? "").trim() === "1";

  const page = Number(searchParams?.page ?? "1") || 1;
  const query = buildSearchParams(searchParams, {
    page: String(page),
    pageSize: "25",
    templateId: null,
    new: null,
    saved: null,
    error: null
  });

  let data: MessageTemplatesResponse | null = null;
  let detail: MessageTemplate | null = null;
  let error: string | null = null;

  try {
    data = await getMessageTemplates(token, query);
    if (templateId) detail = await getMessageTemplate(token, templateId);
  } catch {
    error = t.backendUnreachable;
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const statuses = ["draft", "published", "archived"];
  const channels = ["email", "sms", "app"];

  const openNewHref = (() => {
    const next = buildSearchParams(searchParams, { new: "1", templateId: null, saved: null, error: null });
    return `/message-templates?${next.toString()}`;
  })();

  const openDrawerHref = (id: string) => {
    const next = buildSearchParams(searchParams, { templateId: id, new: null, saved: null, error: null });
    return `/message-templates?${next.toString()}`;
  };

  const closeDrawerHref = (() => {
    const next = buildSearchParams(searchParams, { templateId: null, new: null, saved: null, error: null });
    const value = next.toString();
    return value ? `/message-templates?${value}` : "/message-templates";
  })();

  async function createTemplate(formData: FormData) {
    "use server";

    const token = requireStaffToken();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const channel = String(formData.get("channel") ?? "").trim();
    const status = String(formData.get("status") ?? "draft").trim();
    const defaultLocale = String(formData.get("defaultLocale") ?? "en").trim();

    const subjectEn = String(formData.get("subject_en") ?? "").trim();
    const bodyEn = String(formData.get("body_en") ?? "").trim();
    const subjectFr = String(formData.get("subject_fr") ?? "").trim();
    const bodyFr = String(formData.get("body_fr") ?? "").trim();

    const content: TemplateContent = {
      defaultLocale,
      locales: {
        en: { subject: subjectEn, bodyText: bodyEn },
        fr: { subject: subjectFr, bodyText: bodyFr }
      }
    };

    const response = await fetch(`${backendUrl}/api/v1/staff/message-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description: description || null, channel, status, content }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, new: "1" });
      redirect(`/message-templates?${next.toString()}`);
    }

    const id = typeof payload?.template?.id === "string" ? payload.template.id : "";
    if (!id) redirect("/message-templates?error=invalid_template");

    const next = buildSearchParams(searchParams, { templateId: id, new: null, saved: "created", error: null });
    redirect(`/message-templates?${next.toString()}`);
  }

  async function updateTemplate(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const templateId = String(formData.get("templateId") ?? "").trim();
    if (!templateId) redirect("/message-templates");

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const channel = String(formData.get("channel") ?? "").trim();
    const status = String(formData.get("status") ?? "draft").trim();
    const defaultLocale = String(formData.get("defaultLocale") ?? "en").trim();

    const subjectEn = String(formData.get("subject_en") ?? "").trim();
    const bodyEn = String(formData.get("body_en") ?? "").trim();
    const subjectFr = String(formData.get("subject_fr") ?? "").trim();
    const bodyFr = String(formData.get("body_fr") ?? "").trim();

    const content: TemplateContent = {
      defaultLocale,
      locales: {
        en: { subject: subjectEn, bodyText: bodyEn },
        fr: { subject: subjectFr, bodyText: bodyFr }
      }
    };

    const response = await fetch(`${backendUrl}/api/v1/staff/message-templates/${encodeURIComponent(templateId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, description: description || null, channel, status, content }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { templateId, error: errorCode, saved: null });
      redirect(`/message-templates?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { templateId, saved: "updated", error: null });
    redirect(`/message-templates?${next.toString()}`);
  }

  async function archiveTemplate(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const templateId = String(formData.get("templateId") ?? "").trim();
    if (!templateId) redirect("/message-templates");

    const response = await fetch(`${backendUrl}/api/v1/staff/message-templates/${encodeURIComponent(templateId)}/archive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { templateId, error: errorCode, saved: null });
      redirect(`/message-templates?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { templateId, saved: "archived", error: null });
    redirect(`/message-templates?${next.toString()}`);
  }

  async function duplicateTemplate(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const templateId = String(formData.get("templateId") ?? "").trim();
    if (!templateId) redirect("/message-templates");

    const response = await fetch(`${backendUrl}/api/v1/staff/message-templates/${encodeURIComponent(templateId)}/duplicate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { templateId, error: errorCode, saved: null });
      redirect(`/message-templates?${next.toString()}`);
    }

    const id = typeof payload?.template?.id === "string" ? payload.template.id : "";
    if (!id) redirect("/message-templates?error=invalid_template");

    const next = buildSearchParams(searchParams, { templateId: id, new: null, saved: "duplicated", error: null });
    redirect(`/message-templates?${next.toString()}`);
  }

  const normalizedDetail = detail ? normalizeContent(detail.content) : normalizeContent({});

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
            <Link href={openNewHref}>+ {t.createMessage}</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.filtersTitle}</CardTitle>
          <CardDescription>{t.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <MessageTemplatesFilters channels={channels} statuses={statuses} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t.templatesTitle}</CardTitle>
            <CardDescription>{t.templatesDescription}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/message-templates?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>
                {t.previous}
              </Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/message-templates?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>
                {t.next}
              </Link>
            </Button>
            <Badge variant="secondary">
              {data?.total ?? 0} {(data?.total ?? 0) === 1 ? t.template : t.templates}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((template) => {
            const status = statusBadge(template.status, t);
            const channel = channelBadge(template.channel, t);
            const langs = languagesFromContent(template.content);

            return (
              <div key={template.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={openDrawerHref(template.id)} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{template.name}</p>
                    <Badge variant="outline" className={channel.className}>
                      {channel.label}
                    </Badge>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                    {langs.length ? (
                      <div className="flex items-center gap-1">
                        {langs.slice(0, 6).map((locale) => (
                          <Badge key={locale} variant="outline" className="font-mono text-xs uppercase">
                            {locale}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description ?? "—"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.updated} {new Date(template.updatedAt).toLocaleString()}
                    {template.createdBy ? ` · ${template.createdBy}` : ""}
                  </p>
                </Link>
              </div>
            );
          })}

          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t.noTemplates}</p> : null}
        </CardContent>
      </Card>

      {wantsNew || templateId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label={t.close} />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wantsNew ? t.createLabel : t.editLabel}</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? t.newMessage : detail?.name ?? t.messageTemplate}</h2>
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
                      <CardTitle className="text-base">{t.createTemplateTitle}</CardTitle>
                      <CardDescription>{t.createTemplateDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createTemplate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="mt-name">{t.name}</Label>
                          <Input id="mt-name" name="name" placeholder={t.placeholders.name} required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-description">{t.description}</Label>
                          <Input id="mt-description" name="description" placeholder={t.placeholders.description} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="mt-channel">{t.channel}</Label>
                            <select id="mt-channel" name="channel" className={nativeSelectClassName} defaultValue="email">
                              {channels.map((channel) => (
                                <option key={channel} value={channel}>
                                  {channelLabel(channel, t)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mt-status">{t.status}</Label>
                            <select id="mt-status" name="status" className={nativeSelectClassName} defaultValue="draft">
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabel(status, t)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-default-locale">{t.defaultLanguage}</Label>
                          <select id="mt-default-locale" name="defaultLocale" className={nativeSelectClassName} defaultValue="en">
                            <option value="en">EN</option>
                            <option value="fr">FR</option>
                          </select>
                        </div>

                        <Card>
                          <CardHeader className="space-y-1 pb-3">
                            <CardTitle className="text-sm">{t.english}</CardTitle>
                            <CardDescription>{t.subjectAndMessage}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-en">{t.subject}</Label>
                              <Input id="mt-subject-en" name="subject_en" placeholder={t.placeholders.subjectEn} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-en">{t.body}</Label>
                              <Textarea id="mt-body-en" name="body_en" className="min-h-[140px]" placeholder={t.writeMessage} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="space-y-1 pb-3">
                            <CardTitle className="text-sm">{t.french}</CardTitle>
                            <CardDescription>{t.subjectAndMessage}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-fr">{t.subject}</Label>
                              <Input id="mt-subject-fr" name="subject_fr" placeholder={t.placeholders.subjectFr} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-fr">{t.body}</Label>
                              <Textarea id="mt-body-fr" name="body_fr" className="min-h-[140px]" placeholder={t.writeMessageFr} />
                            </div>
                          </CardContent>
                        </Card>

                        <Button type="submit" className="w-full">
                          {t.createTemplateAction}
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
                      <form action={updateTemplate} className="space-y-4">
                        <input type="hidden" name="templateId" value={detail.id} />
                        <div className="space-y-2">
                          <Label htmlFor="mt-name-edit">{t.name}</Label>
                          <Input id="mt-name-edit" name="name" defaultValue={detail.name} disabled={!canManage} required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-description-edit">{t.description}</Label>
                          <Input id="mt-description-edit" name="description" defaultValue={detail.description ?? ""} disabled={!canManage} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="mt-channel-edit">{t.channel}</Label>
                            <select
                              id="mt-channel-edit"
                              name="channel"
                              className={nativeSelectClassName}
                              defaultValue={detail.channel}
                              disabled={!canManage}
                            >
                              {channels.map((channel) => (
                                <option key={channel} value={channel}>
                                  {channelLabel(channel, t)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mt-status-edit">{t.status}</Label>
                            <select id="mt-status-edit" name="status" className={nativeSelectClassName} defaultValue={detail.status} disabled={!canManage}>
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabel(status, t)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-default-locale-edit">{t.defaultLanguage}</Label>
                          <select
                            id="mt-default-locale-edit"
                            name="defaultLocale"
                            className={nativeSelectClassName}
                            defaultValue={normalizedDetail.defaultLocale}
                            disabled={!canManage}
                          >
                            <option value="en">EN</option>
                            <option value="fr">FR</option>
                          </select>
                        </div>

                        <Card>
                          <CardHeader className="space-y-1 pb-3">
                            <CardTitle className="text-sm">{t.english}</CardTitle>
                            <CardDescription>{t.previewAndEdit}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-en-edit">{t.subject}</Label>
                              <Input
                                id="mt-subject-en-edit"
                                name="subject_en"
                                defaultValue={normalizedDetail.locales.en?.subject ?? ""}
                                disabled={!canManage}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-en-edit">{t.body}</Label>
                              <Textarea
                                id="mt-body-en-edit"
                                name="body_en"
                                defaultValue={normalizedDetail.locales.en?.bodyText ?? ""}
                                className="min-h-[140px]"
                                disabled={!canManage}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="space-y-1 pb-3">
                            <CardTitle className="text-sm">{t.french}</CardTitle>
                            <CardDescription>{t.previewAndEdit}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-fr-edit">{t.subject}</Label>
                              <Input
                                id="mt-subject-fr-edit"
                                name="subject_fr"
                                defaultValue={normalizedDetail.locales.fr?.subject ?? ""}
                                disabled={!canManage}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-fr-edit">{t.body}</Label>
                              <Textarea
                                id="mt-body-fr-edit"
                                name="body_fr"
                                defaultValue={normalizedDetail.locales.fr?.bodyText ?? ""}
                                className="min-h-[140px]"
                                disabled={!canManage}
                              />
                            </div>
                          </CardContent>
                        </Card>

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
                      <form action={duplicateTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={detail.id} />
                        <Button type="submit" variant="outline" className="w-full">
                          {t.duplicate}
                        </Button>
                      </form>
                      <form action={archiveTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={detail.id} />
                        <Button type="submit" variant="destructive" className="w-full">
                          {t.archive}
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
