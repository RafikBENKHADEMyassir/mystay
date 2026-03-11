import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LiveThreadRefresh } from "@/components/live-thread-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { adminLocaleCookieName, resolveAdminLocale, type AdminLocale } from "@/lib/admin-locale";
import { requireStaffToken } from "@/lib/staff-auth";
import { cn } from "@/lib/utils";

type StaffPrincipal = {
  typ: "staff";
  hotelId: string;
  staffUserId: string;
  role: string;
  departments: string[];
  email: string | null;
  displayName: string | null;
};

type ThreadDetail = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  assignedStaffUser: { id: string; displayName: string | null; email: string | null } | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

type MessagePayload = {
  type?: string;
  ticketId?: string;
  [key: string]: unknown;
};

type Message = {
  id: string;
  threadId: string;
  senderType: "guest" | "staff";
  senderName: string;
  bodyText: string;
  payload: MessagePayload;
  createdAt: string;
};

type InternalNote = {
  id: string;
  authorName: string;
  authorStaffUserId: string | null;
  bodyText: string;
  createdAt: string;
};

type MessageThreadPageProps = {
  params: {
    threadId: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const messageThreadCopy = {
  en: {
    appName: "MyStay Admin",
    pageTitle: "Messages",
    backToMessages: "Back to messages",
    threadNotAvailable: "Thread not available",
    threadUnavailableDescription: "It may have been deleted or you do not have access.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
    backendErrorTitle: "Backend error",
    unassigned: "Unassigned",
    assignmentTitle: "Assignment",
    assignmentDescription: "Owner for this guest conversation.",
    assignee: "Assignee:",
    assignToMe: "Assign to me",
    takeOwnership: "Take ownership",
    unassign: "Unassign",
    conversationTitle: "Conversation",
    conversationDescription: "Live messages between guest and staff.",
    conversationEmpty: "No messages yet.",
    viewRequest: "View request",
    replyPlaceholder: "Write a reply...",
    sendAsStaff: "Sends as your staff identity.",
    send: "Send",
    internalNotesTitle: "Internal notes",
    internalNotesDescription: "Staff-only context for shift handovers.",
    noInternalNotes: "No internal notes yet.",
    notePlaceholder: "Add an internal note...",
    noteVisibleToStaff: "Visible to staff only.",
    addNote: "Add note",
  },
  fr: {
    appName: "MyStay Admin",
    pageTitle: "Messages",
    backToMessages: "Retour aux messages",
    threadNotAvailable: "Conversation indisponible",
    threadUnavailableDescription: "Elle a peut-etre ete supprimee ou vous n'avez pas acces.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
    backendErrorTitle: "Erreur backend",
    unassigned: "Non assigne",
    assignmentTitle: "Attribution",
    assignmentDescription: "Responsable de cette conversation client.",
    assignee: "Assigne:",
    assignToMe: "M'assigner",
    takeOwnership: "Prendre en charge",
    unassign: "Retirer l'attribution",
    conversationTitle: "Conversation",
    conversationDescription: "Messages en direct entre client et personnel.",
    conversationEmpty: "Aucun message pour le moment.",
    viewRequest: "Voir la demande",
    replyPlaceholder: "Ecrire une reponse...",
    sendAsStaff: "Envoi avec votre identite staff.",
    send: "Envoyer",
    internalNotesTitle: "Notes internes",
    internalNotesDescription: "Contexte reserve au staff pour les passations.",
    noInternalNotes: "Aucune note interne pour le moment.",
    notePlaceholder: "Ajouter une note interne...",
    noteVisibleToStaff: "Visible uniquement par le staff.",
    addNote: "Ajouter une note",
  },
  es: {
    appName: "MyStay Admin",
    pageTitle: "Mensajes",
    backToMessages: "Volver a mensajes",
    threadNotAvailable: "Conversacion no disponible",
    threadUnavailableDescription: "Puede haber sido eliminada o no tienes acceso.",
    backendUnreachable: "Backend inaccesible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y actualiza.",
    backendErrorTitle: "Error del backend",
    unassigned: "Sin asignar",
    assignmentTitle: "Asignacion",
    assignmentDescription: "Responsable de esta conversacion del huesped.",
    assignee: "Asignado:",
    assignToMe: "Asignarme",
    takeOwnership: "Tomar propiedad",
    unassign: "Quitar asignacion",
    conversationTitle: "Conversacion",
    conversationDescription: "Mensajes en vivo entre huesped y personal.",
    conversationEmpty: "Aun no hay mensajes.",
    viewRequest: "Ver solicitud",
    replyPlaceholder: "Escribe una respuesta...",
    sendAsStaff: "Se envia con tu identidad de personal.",
    send: "Enviar",
    internalNotesTitle: "Notas internas",
    internalNotesDescription: "Contexto solo para personal en cambios de turno.",
    noInternalNotes: "Aun no hay notas internas.",
    notePlaceholder: "Agregar una nota interna...",
    noteVisibleToStaff: "Visible solo para el personal.",
    addNote: "Agregar nota",
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

async function getThread(token: string, threadId: string): Promise<ThreadDetail | null> {
  const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as ThreadDetail;
}

async function getMessages(token: string, threadId: string): Promise<Message[]> {
  const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}/messages`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);

  const payload = await response.json();
  return Array.isArray(payload?.items) ? (payload.items as Message[]) : [];
}

async function getMe(token: string): Promise<StaffPrincipal | null> {
  const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { principal?: unknown };
  return payload?.principal && typeof payload.principal === "object" ? (payload.principal as StaffPrincipal) : null;
}

async function getThreadNotes(token: string, threadId: string): Promise<InternalNote[]> {
  const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}/notes`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: InternalNote[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  const token = requireStaffToken();
  const threadId = params.threadId;
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = messageThreadCopy[locale];

  let thread: ThreadDetail | null = null;
  let messages: Message[] = [];
  let notes: InternalNote[] = [];
  let me: StaffPrincipal | null = null;
  let error: string | null = null;

  try {
    [thread, me] = await Promise.all([getThread(token, threadId), getMe(token)]);
    if (thread) {
      [messages, notes] = await Promise.all([getMessages(token, threadId), getThreadNotes(token, threadId)]);
    }
  } catch {
    error = t.backendUnreachable;
  }

  async function sendMessage(formData: FormData) {
    "use server";

    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!bodyText) redirect(`/messages/${encodeURIComponent(threadId)}?error=missing_body_text`);

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bodyText }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode =
        typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/messages/${encodeURIComponent(threadId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/messages/${encodeURIComponent(threadId)}?sent=1`);
  }

  async function takeOwnership() {
    "use server";

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedTo: "me" })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode =
        typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/messages/${encodeURIComponent(threadId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/messages/${encodeURIComponent(threadId)}?saved=1`);
  }

  async function unassign() {
    "use server";

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedTo: null })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode =
        typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/messages/${encodeURIComponent(threadId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/messages/${encodeURIComponent(threadId)}?saved=1`);
  }

  async function addNote(formData: FormData) {
    "use server";

    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!bodyText) redirect(`/messages/${encodeURIComponent(threadId)}?error=missing_note`);

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(threadId)}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bodyText }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode =
        typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/messages/${encodeURIComponent(threadId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/messages/${encodeURIComponent(threadId)}?saved=1`);
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t.appName}</p>
            <h1 className="text-2xl font-semibold">{t.pageTitle}</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/messages">{t.backToMessages}</Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.threadNotAvailable}</CardTitle>
            <CardDescription>{error ?? t.threadUnavailableDescription}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isAdmin = me?.role === "admin";
  const isAssignedToMe = Boolean(me?.staffUserId && thread.assignedStaffUser?.id === me.staffUserId);
  const isUnassigned = !thread.assignedStaffUser;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LiveThreadRefresh threadId={threadId} />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{thread.title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{thread.id}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline">{departmentLabel(thread.department, locale)}</Badge>
          <Badge variant={thread.status === "resolved" ? "secondary" : "outline"}>{statusLabel(thread.status, locale)}</Badge>
          {thread.assignedStaffUser ? (
            <Badge variant="secondary">{thread.assignedStaffUser.displayName ?? thread.assignedStaffUser.id}</Badge>
          ) : (
            <Badge variant="outline">{t.unassigned}</Badge>
          )}
          <Button variant="outline" asChild>
            <Link href="/messages">{t.backToMessages}</Link>
          </Button>
        </div>
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t.backendErrorTitle}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.assignmentTitle}</CardTitle>
          <CardDescription>{t.assignmentDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.assignee}</span>
            <span className="font-semibold">
              {thread.assignedStaffUser ? thread.assignedStaffUser.displayName ?? thread.assignedStaffUser.id : t.unassigned}
            </span>
            {isUnassigned || isAdmin ? (
              <form action={takeOwnership}>
                <Button type="submit" size="sm" variant="outline">
                  {thread.assignedStaffUser && isAdmin ? t.assignToMe : t.takeOwnership}
                </Button>
              </form>
            ) : null}
            {thread.assignedStaffUser && (isAssignedToMe || isAdmin) ? (
              <form action={unassign}>
                <Button type="submit" size="sm" variant="ghost">
                  {t.unassign}
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.conversationTitle}</CardTitle>
          <CardDescription>{messages.length ? t.conversationDescription : t.conversationEmpty}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
            {messages.map((message) => {
              const isStaff = message.senderType === "staff";
              const payload = (message.payload && typeof message.payload === "object" ? message.payload : {}) as MessagePayload;
              const hasTicketLink = payload.type === "restaurant_booking" && payload.ticketId;

              return (
                <li key={message.id} className={cn("flex", isStaff ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] space-y-1 rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-border",
                      isStaff ? "bg-foreground text-background" : "bg-background text-foreground"
                    )}
                  >
                    <div className={cn("flex items-center justify-between gap-3 text-xs", isStaff ? "text-background/70" : "text-muted-foreground")}>
                      <span className="font-semibold">{message.senderName}</span>
                      <span className="whitespace-nowrap">{new Date(message.createdAt).toLocaleTimeString(locale)}</span>
                    </div>
                    <p className={cn("whitespace-pre-wrap leading-relaxed", isStaff ? "text-background" : "text-foreground")}>
                      {message.bodyText}
                    </p>
                    {hasTicketLink && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <Link
                          href={`/requests/${encodeURIComponent(payload.ticketId!)}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 transition-colors",
                            isStaff
                              ? "bg-background/20 text-background hover:bg-background/30"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          📋 {t.viewRequest} {payload.ticketId}
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <form action={sendMessage} className="space-y-3 border-t pt-4">
            <Textarea name="bodyText" placeholder={t.replyPlaceholder} />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t.sendAsStaff}</p>
              <Button type="submit">{t.send}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.internalNotesTitle}</CardTitle>
          <CardDescription>{t.internalNotesDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length ? (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-xl border bg-muted/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{note.authorName}</span>
                    <span className="font-mono">{new Date(note.createdAt).toLocaleString(locale)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{note.bodyText}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t.noInternalNotes}</p>
          )}

          <form action={addNote} className="space-y-3 border-t pt-4">
            <Textarea name="bodyText" placeholder={t.notePlaceholder} />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t.noteVisibleToStaff}</p>
              <Button type="submit">{t.addNote}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
