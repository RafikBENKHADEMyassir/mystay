import { LiveInboxRefresh } from "@/components/live-inbox-refresh";
import { ConversationSearch } from "@/components/inbox/conversation-search";
import { InboxFilters } from "@/components/inbox/inbox-filters";
import { MessagePanel } from "@/components/inbox/message-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { requireStaffToken } from "@/lib/staff-auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

const DEPARTMENT_COLORS: Record<string, string> = {
  concierge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  housekeeping: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  restaurants: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700",
  front_desk: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
  spa: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300 dark:border-pink-700",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  archived: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
};

const DEFAULT_BADGE = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600";

type Conversation = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  confirmationNumber: string | null;
  roomNumber: string | null;
  guestId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConversationsResponse = {
  items: Conversation[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Message = {
  id: string;
  threadId: string;
  senderType: "guest" | "staff";
  senderName: string;
  bodyText: string;
  createdAt: string;
};

type StayContext = {
  stayId: string;
  confirmationNumber: string | null;
  roomNumber: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  hotelName: string | null;
};

type InboxPageProps = {
  searchParams?: {
    tab?: string;
    stayId?: string;
    dept?: string;
    search?: string;
    conversationId?: string;
    sent?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function buildSearchParams(current: InboxPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
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

async function getConversations(token: string, query: URLSearchParams): Promise<ConversationsResponse> {
  const qs = query.toString();
  const response = await fetch(qs ? `${backendUrl}/api/v1/staff/conversations?${qs}` : `${backendUrl}/api/v1/staff/conversations`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);

  return (await response.json()) as ConversationsResponse;
}

type MessagesResult = {
  items: Message[];
  hasMore: boolean;
  total: number;
};

const INITIAL_MESSAGE_LIMIT = 30;

async function getMessages(token: string, conversationId: string): Promise<MessagesResult> {
  const url = new URL(`${backendUrl}/api/v1/threads/${encodeURIComponent(conversationId)}/messages`);
  url.searchParams.set("limit", String(INITIAL_MESSAGE_LIMIT));

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return { items: [], hasMore: false, total: 0 };
  const payload = await response.json();
  return {
    items: Array.isArray(payload?.items) ? (payload.items as Message[]) : [],
    hasMore: typeof payload?.hasMore === "boolean" ? payload.hasMore : false,
    total: typeof payload?.total === "number" ? payload.total : 0,
  };
}

async function getStayContext(token: string, stayId: string): Promise<StayContext | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/reservations/${encodeURIComponent(stayId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as any;
  return {
    stayId,
    confirmationNumber: typeof payload?.stay?.confirmationNumber === "string" ? payload.stay.confirmationNumber : null,
    roomNumber: typeof payload?.stay?.roomNumber === "string" ? payload.stay.roomNumber : null,
    guestName: typeof payload?.guest?.name === "string" ? payload.guest.name : null,
    guestEmail: typeof payload?.guest?.email === "string" ? payload.guest.email : null,
    guestPhone: typeof payload?.guest?.phone === "string" ? payload.guest.phone : null,
    hotelName: typeof payload?.hotel?.name === "string" ? payload.hotel.name : null
  };
}

function preview(text: string | null, maxLen = 80) {
  const value = (text ?? "").trim();
  if (!value) return "";
  return value.length > maxLen ? `${value.slice(0, maxLen - 1)}…` : value;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const token = requireStaffToken();

  const tab = (searchParams?.tab ?? "messages").trim() || "messages";
  const stayId = (searchParams?.stayId ?? "").trim();
  const dept = (searchParams?.dept ?? "").trim();
  const statusFilter = (searchParams?.status ?? "").trim();
  const search = (searchParams?.search ?? "").trim();
  const requestedConversationId = (searchParams?.conversationId ?? "").trim();

  const query = new URLSearchParams();
  query.set("tab", tab);
  query.set("pageSize", "50");
  if (stayId) query.set("stayId", stayId);
  if (dept) query.set("department", dept);
  if (search) query.set("search", search);

  let data: ConversationsResponse | null = null;
  let error: string | null = null;

  try {
    data = await getConversations(token, query);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const allConversations = data?.items ?? [];
  const conversations = statusFilter
    ? allConversations.filter((c) => c.status === statusFilter)
    : allConversations;
  const total = statusFilter ? conversations.length : (data?.total ?? conversations.length);

  const departments = Array.from(new Set(allConversations.map((c) => c.department).filter(Boolean))).sort();
  const statuses = Array.from(new Set(allConversations.map((c) => c.status).filter(Boolean))).sort();

  if (!requestedConversationId && stayId && conversations.length) {
    const next = buildSearchParams(searchParams, { conversationId: conversations[0].id, sent: null, error: null });
    redirect(`/inbox?${next.toString()}`);
  }

  const selectedConversation = requestedConversationId
    ? conversations.find((conversation) => conversation.id === requestedConversationId) ?? null
    : null;

  let messagesResult: MessagesResult = { items: [], hasMore: false, total: 0 };
  if (selectedConversation) {
    messagesResult = await getMessages(token, selectedConversation.id);
  }

  const emptyStayComposer = Boolean(stayId) && conversations.length === 0;
  const stayContext = emptyStayComposer ? await getStayContext(token, stayId) : null;

  const tabHref = (nextTab: string) => {
    const next = buildSearchParams(searchParams, { tab: nextTab, conversationId: null, sent: null, error: null });
    const value = next.toString();
    return value ? `/inbox?${value}` : "/inbox";
  };

  const isSelectedTab = (value: string) => tab === value;

  const conversationHref = (id: string) => {
    const next = buildSearchParams(searchParams, { conversationId: id, sent: null, error: null });
    const value = next.toString();
    return value ? `/inbox?${value}` : "/inbox";
  };

  const errorParam = (searchParams?.error ?? "").trim();

  async function sendMessage(formData: FormData) {
    "use server";

    const conversationId = String(formData.get("conversationId") ?? "").trim();
    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!conversationId || !bodyText) {
      const next = buildSearchParams(searchParams, { error: "missing_body_text", sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bodyText }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { conversationId, sent: "1", error: null });
    redirect(`/inbox?${next.toString()}`);
  }

  async function startConversationAndSendMessage(formData: FormData) {
    "use server";

    const stayId = String(formData.get("stayId") ?? "").trim();
    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!stayId || !bodyText) {
      const next = buildSearchParams(searchParams, { error: "missing_body_text", sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const token = requireStaffToken();
    const createResponse = await fetch(`${backendUrl}/api/v1/staff/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stayId }),
      cache: "no-store"
    });

    const createPayload = await createResponse.json().catch(() => null);
    if (!createResponse.ok) {
      const errorCode =
        typeof createPayload?.error === "string" ? createPayload.error : `backend_error_${createResponse.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const conversationId = typeof createPayload?.conversation?.id === "string" ? createPayload.conversation.id : "";
    if (!conversationId) {
      const next = buildSearchParams(searchParams, { error: "invalid_conversation", sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const messageResponse = await fetch(`${backendUrl}/api/v1/threads/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bodyText }),
      cache: "no-store"
    });

    if (!messageResponse.ok) {
      const payload = await messageResponse.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${messageResponse.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { conversationId, sent: "1", error: null });
    redirect(`/inbox?${next.toString()}`);
  }

  async function archiveConversation(formData: FormData) {
    "use server";

    const conversationId = String(formData.get("conversationId") ?? "").trim();
    if (!conversationId) {
      const next = buildSearchParams(searchParams, { error: "missing_conversation_id", sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/staff/conversations/${encodeURIComponent(conversationId)}/archive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, sent: null });
      redirect(`/inbox?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { tab: "archived", conversationId, sent: null, error: null });
    redirect(`/inbox?${next.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <LiveInboxRefresh />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">Unified guest conversations (messages, archive, ratings).</p>
        </div>
        <Badge variant="secondary">
          {total} conversation{total === 1 ? "" : "s"}
        </Badge>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <Card className="overflow-hidden p-0">
          <div className="space-y-3 p-4">
            <ConversationSearch />
            <div className="flex items-center gap-1">
              <Link
                href={tabHref("messages")}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium",
                  isSelectedTab("messages") ? "bg-muted" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                Messages
              </Link>
              <Link
                href={tabHref("archived")}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium",
                  isSelectedTab("archived") ? "bg-muted" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                Archive
              </Link>
              <Link
                href={tabHref("ratings")}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium",
                  isSelectedTab("ratings") ? "bg-muted" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                Ratings
              </Link>
            </div>

            <InboxFilters departments={departments} statuses={statuses} />

            <div className="flex flex-wrap gap-1.5">
              {stayId ? (
                <Badge variant="secondary" className="font-mono">
                  stayId={stayId}
                </Badge>
              ) : null}
              {dept ? <Badge variant="outline" className={DEPARTMENT_COLORS[dept.toLowerCase()] ?? DEFAULT_BADGE}>{dept}</Badge> : null}
              {statusFilter ? <Badge variant="outline" className={STATUS_COLORS[statusFilter] ?? DEFAULT_BADGE}>{statusFilter.replace("_", " ")}</Badge> : null}
            </div>
          </div>
          <Separator />
          <div className="max-h-[calc(100vh-290px)] overflow-y-auto">
            <ul className="divide-y">
              {conversations.map((conversation) => {
                const isSelected = selectedConversation?.id === conversation.id;
                const guestName = (conversation.guestName ?? "").trim() || "Unlinked guest";
                const roomLabel = conversation.roomNumber ? `Room ${conversation.roomNumber}` : "Room —";
                const timestamp = new Date(conversation.lastMessageAt ?? conversation.updatedAt).toLocaleString();
                return (
                  <li key={conversation.id}>
                    <Link
                      href={conversationHref(conversation.id)}
                      className={cn(
                        "block px-4 py-3 transition",
                        isSelected ? "bg-muted/60" : "hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{guestName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {roomLabel}
                            {conversation.lastMessage ? <span> · {preview(conversation.lastMessage)}</span> : null}
                          </p>
                          {conversation.department ? (
                            <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 leading-4 ${DEPARTMENT_COLORS[conversation.department.toLowerCase()] ?? DEFAULT_BADGE}`}>
                              {conversation.department}
                            </Badge>
                          ) : null}
                        </div>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">{timestamp}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
              {conversations.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">No conversations found.</li>
              ) : null}
            </ul>
          </div>
        </Card>

        <Card className="flex h-[calc(100vh-180px)] min-h-[500px] flex-col overflow-hidden p-0">
          {selectedConversation ? (
            <>
              <div className="flex flex-shrink-0 flex-wrap items-start justify-between gap-3 border-b p-4">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-lg font-semibold">
                    {(selectedConversation.guestName ?? "").trim() || selectedConversation.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.roomNumber ? `Room ${selectedConversation.roomNumber}` : "Room —"}
                    {selectedConversation.confirmationNumber ? (
                      <span className="font-mono"> · {selectedConversation.confirmationNumber}</span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={DEPARTMENT_COLORS[selectedConversation.department?.toLowerCase()] ?? DEFAULT_BADGE}>
                      {selectedConversation.department}
                    </Badge>
                    <Badge variant="outline" className={STATUS_COLORS[selectedConversation.status] ?? DEFAULT_BADGE}>
                      {selectedConversation.status.replace("_", " ")}
                    </Badge>
                    {selectedConversation.guestEmail ? (
                      <Badge variant="secondary">{selectedConversation.guestEmail}</Badge>
                    ) : null}
                    {selectedConversation.guestPhone ? (
                      <Badge variant="secondary">{selectedConversation.guestPhone}</Badge>
                    ) : null}
                  </div>
                </div>

                {selectedConversation.status !== "archived" ? (
                  <form action={archiveConversation}>
                    <input type="hidden" name="conversationId" value={selectedConversation.id} />
                    <Button type="submit" variant="outline">
                      Archive conversation
                    </Button>
                  </form>
                ) : null}
              </div>

              {errorParam ? (
                <div className="flex-shrink-0 border-b bg-destructive/5 px-4 py-2 text-sm text-destructive">
                  {errorParam.replaceAll("_", " ")}
                </div>
              ) : null}

              <MessagePanel
                key={selectedConversation.id}
                conversationId={selectedConversation.id}
                token={token}
                backendUrl={backendUrl}
                initialMessages={messagesResult.items}
                initialHasMore={messagesResult.hasMore}
                initialTotal={messagesResult.total}
              />

              <div className="flex-shrink-0 border-t p-4">
                {selectedConversation.status === "archived" ? (
                  <p className="text-sm text-muted-foreground">Archived conversations are read-only.</p>
                ) : (
                  <form action={sendMessage} className="space-y-3">
                    <input type="hidden" name="conversationId" value={selectedConversation.id} />
                    <Textarea
                      key={`composer:${selectedConversation.id}:${selectedConversation.lastMessageAt ?? selectedConversation.updatedAt}:${searchParams?.sent ?? ""}`}
                      name="bodyText"
                      placeholder="Write a message"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Case resolved? Archive it now.</p>
                      <div className="flex items-center gap-2">
                        <Button type="submit" variant="ghost" formAction={archiveConversation}>
                          Archive it now
                        </Button>
                        <Button type="submit">Send</Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : emptyStayComposer ? (
            <>
              <div className="border-b p-4">
                <p className="text-lg font-semibold">New conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stayContext?.guestName ? stayContext.guestName : `stayId=${stayId}`}
                  {stayContext?.roomNumber ? <span> · Room {stayContext.roomNumber}</span> : null}
                  {stayContext?.confirmationNumber ? <span className="font-mono"> · {stayContext.confirmationNumber}</span> : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stayContext?.guestEmail ? <Badge variant="secondary">{stayContext.guestEmail}</Badge> : null}
                  {stayContext?.guestPhone ? <Badge variant="secondary">{stayContext.guestPhone}</Badge> : null}
                </div>
              </div>

              {errorParam ? (
                <div className="border-b bg-destructive/5 px-4 py-2 text-sm text-destructive">
                  {errorParam.replaceAll("_", " ")}
                </div>
              ) : null}

              <div className="flex-1 p-4">
                <p className="mb-3 text-sm text-muted-foreground">No conversation exists for this stay yet. Send the first message to start one.</p>
                <form action={startConversationAndSendMessage} className="space-y-3">
                  <input type="hidden" name="stayId" value={stayId} />
                  <Textarea key={`composer:new:${stayId}:${searchParams?.sent ?? ""}`} name="bodyText" placeholder="Write a message" />
                  <div className="flex justify-end">
                    <Button type="submit">Send</Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
              Select a conversation to view the chat thread.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
