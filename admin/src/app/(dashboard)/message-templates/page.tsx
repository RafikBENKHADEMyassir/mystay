import Link from "next/link";
import { redirect } from "next/navigation";

import { MessageTemplatesFilters } from "@/components/message-templates/message-templates-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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

function statusBadge(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "published") return { label: "Published", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (normalized === "archived") return { label: "Archived", className: "border-muted/40 bg-muted/20 text-muted-foreground" };
  return { label: "Draft", className: "border-amber-200 bg-amber-50 text-amber-800" };
}

function channelBadge(channel: string) {
  const normalized = channel.trim().toLowerCase();
  if (normalized === "email") return { label: "Email", className: "border-blue-200 bg-blue-50 text-blue-800" };
  if (normalized === "sms") return { label: "SMS", className: "border-violet-200 bg-violet-50 text-violet-800" };
  return { label: "App", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
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
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
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
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Message templates</h1>
          <p className="text-sm text-muted-foreground">Reusable templates for automations and manual messages.</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={openNewHref}>+ Create message</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search, channel, and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <MessageTemplatesFilters channels={channels} statuses={statuses} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>Sorted by last updated.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/message-templates?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>Previous</Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/message-templates?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>Next</Link>
            </Button>
            <Badge variant="secondary">
              {data?.total ?? 0} template{(data?.total ?? 0) === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((template) => {
            const status = statusBadge(template.status);
            const channel = channelBadge(template.channel);
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
                    Updated {new Date(template.updatedAt).toLocaleString()}
                    {template.createdBy ? ` · ${template.createdBy}` : ""}
                  </p>
                </Link>
              </div>
            );
          })}

          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No templates found.</p> : null}
        </CardContent>
      </Card>

      {wantsNew || templateId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label="Close" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 p-6">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wantsNew ? "Create" : "Edit"} message template</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? "New message" : detail?.name ?? "Message template"}</h2>
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
                      <CardTitle className="text-base">Create template</CardTitle>
                      <CardDescription>Channel, status, and multilingual content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={createTemplate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="mt-name">Name</Label>
                          <Input id="mt-name" name="name" placeholder="Check in now" required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-description">Description</Label>
                          <Input id="mt-description" name="description" placeholder="Optional description" />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="mt-channel">Channel</Label>
                            <select id="mt-channel" name="channel" className={nativeSelectClassName} defaultValue="email">
                              {channels.map((channel) => (
                                <option key={channel} value={channel}>
                                  {channel.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mt-status">Status</Label>
                            <select id="mt-status" name="status" className={nativeSelectClassName} defaultValue="draft">
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-default-locale">Default language</Label>
                          <select id="mt-default-locale" name="defaultLocale" className={nativeSelectClassName} defaultValue="en">
                            <option value="en">EN</option>
                            <option value="fr">FR</option>
                          </select>
                        </div>

                        <Card>
                          <CardHeader className="space-y-1 pb-3">
                            <CardTitle className="text-sm">English</CardTitle>
                            <CardDescription>Subject and message.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-en">Subject</Label>
                              <Input id="mt-subject-en" name="subject_en" placeholder="Check in now" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-en">Body</Label>
                              <Textarea id="mt-body-en" name="body_en" className="min-h-[140px]" placeholder="Write a message..." />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="space-y-1 pb-3">
                            <CardTitle className="text-sm">Français</CardTitle>
                            <CardDescription>Objet et message.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-fr">Subject</Label>
                              <Input id="mt-subject-fr" name="subject_fr" placeholder="Check in maintenant" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-fr">Body</Label>
                              <Textarea id="mt-body-fr" name="body_fr" className="min-h-[140px]" placeholder="Écrivez un message..." />
                            </div>
                          </CardContent>
                        </Card>

                        <Button type="submit" className="w-full">
                          Create template
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Read-only</CardTitle>
                      <CardDescription>Ask a manager to create or edit message templates.</CardDescription>
                    </CardHeader>
                  </Card>
                )
              ) : detail ? (
                <>
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Details</CardTitle>
                      <CardDescription>Edit fields, languages, and status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form action={updateTemplate} className="space-y-4">
                        <input type="hidden" name="templateId" value={detail.id} />
                        <div className="space-y-2">
                          <Label htmlFor="mt-name-edit">Name</Label>
                          <Input id="mt-name-edit" name="name" defaultValue={detail.name} disabled={!canManage} required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-description-edit">Description</Label>
                          <Input id="mt-description-edit" name="description" defaultValue={detail.description ?? ""} disabled={!canManage} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="mt-channel-edit">Channel</Label>
                            <select
                              id="mt-channel-edit"
                              name="channel"
                              className={nativeSelectClassName}
                              defaultValue={detail.channel}
                              disabled={!canManage}
                            >
                              {channels.map((channel) => (
                                <option key={channel} value={channel}>
                                  {channel.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mt-status-edit">Status</Label>
                            <select id="mt-status-edit" name="status" className={nativeSelectClassName} defaultValue={detail.status} disabled={!canManage}>
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mt-default-locale-edit">Default language</Label>
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
                            <CardTitle className="text-sm">English</CardTitle>
                            <CardDescription>Preview and edit.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-en-edit">Subject</Label>
                              <Input
                                id="mt-subject-en-edit"
                                name="subject_en"
                                defaultValue={normalizedDetail.locales.en?.subject ?? ""}
                                disabled={!canManage}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-en-edit">Body</Label>
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
                            <CardTitle className="text-sm">Français</CardTitle>
                            <CardDescription>Prévisualiser et modifier.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="mt-subject-fr-edit">Subject</Label>
                              <Input
                                id="mt-subject-fr-edit"
                                name="subject_fr"
                                defaultValue={normalizedDetail.locales.fr?.subject ?? ""}
                                disabled={!canManage}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mt-body-fr-edit">Body</Label>
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
                            Save changes
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
                          Duplicate
                        </Button>
                      </form>
                      <form action={archiveTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={detail.id} />
                        <Button type="submit" variant="destructive" className="w-full">
                          Archive
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </>
              ) : (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">Template not available</CardTitle>
                    <CardDescription>Refresh to see latest templates.</CardDescription>
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

