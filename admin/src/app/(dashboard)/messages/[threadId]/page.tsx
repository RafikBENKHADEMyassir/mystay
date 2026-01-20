import Link from "next/link";
import { redirect } from "next/navigation";

import { LiveThreadRefresh } from "@/components/live-thread-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

type Message = {
  id: string;
  threadId: string;
  senderType: "guest" | "staff";
  senderName: string;
  bodyText: string;
  payload: unknown;
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
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
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
            <p className="text-sm text-muted-foreground">MyStay Admin</p>
            <h1 className="text-2xl font-semibold">Messages</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/messages">Back to messages</Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thread not available</CardTitle>
            <CardDescription>{error ?? "It may have been deleted or you do not have access."}</CardDescription>
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
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">{thread.title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{thread.id}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline">{thread.department}</Badge>
          <Badge variant={thread.status === "resolved" ? "secondary" : "outline"}>{thread.status.replace("_", " ")}</Badge>
          {thread.assignedStaffUser ? (
            <Badge variant="secondary">{thread.assignedStaffUser.displayName ?? thread.assignedStaffUser.id}</Badge>
          ) : (
            <Badge variant="outline">Unassigned</Badge>
          )}
          <Button variant="outline" asChild>
            <Link href="/messages">Back to messages</Link>
          </Button>
        </div>
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Backend error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment</CardTitle>
          <CardDescription>Owner for this guest conversation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Assignee:</span>
            <span className="font-semibold">
              {thread.assignedStaffUser ? thread.assignedStaffUser.displayName ?? thread.assignedStaffUser.id : "Unassigned"}
            </span>
            {isUnassigned || isAdmin ? (
              <form action={takeOwnership}>
                <Button type="submit" size="sm" variant="outline">
                  {thread.assignedStaffUser && isAdmin ? "Assign to me" : "Take ownership"}
                </Button>
              </form>
            ) : null}
            {thread.assignedStaffUser && (isAssignedToMe || isAdmin) ? (
              <form action={unassign}>
                <Button type="submit" size="sm" variant="ghost">
                  Unassign
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
          <CardDescription>{messages.length ? "Live messages between guest and staff." : "No messages yet."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {messages.map((message) => {
              const isStaff = message.senderType === "staff";
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
                      <span className="whitespace-nowrap">{new Date(message.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className={cn("whitespace-pre-wrap leading-relaxed", isStaff ? "text-background" : "text-foreground")}>
                      {message.bodyText}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <form action={sendMessage} className="space-y-3 border-t pt-4">
            <Textarea name="bodyText" placeholder="Write a reply…" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Sends as your staff identity.</p>
              <Button type="submit">Send</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal notes</CardTitle>
          <CardDescription>Staff-only context for shift handovers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length ? (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-xl border bg-muted/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{note.authorName}</span>
                    <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{note.bodyText}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No internal notes yet.</p>
          )}

          <form action={addNote} className="space-y-3 border-t pt-4">
            <Textarea name="bodyText" placeholder="Add an internal note…" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Visible to staff only.</p>
              <Button type="submit">Add note</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
