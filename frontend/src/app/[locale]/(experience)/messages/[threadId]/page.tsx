"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";

type Thread = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  assignedStaffUser: { id: string; displayName: string | null; email: string | null } | null;
  updatedAt: string;
};

type Message = {
  id: string;
  threadId: string;
  senderType: string;
  senderName: string | null;
  bodyText: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

type ThreadPageProps = {
  params: {
    threadId: string;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ThreadPage({ params }: ThreadPageProps) {
  const threadId = params.threadId;
  const locale = useLocale();
  const session = useMemo(() => getDemoSession(), []);
  const { content } = useGuestContent(locale, session?.hotelId ?? null);
  const page = content?.pages.messages;
  const threadStrings = page?.thread;

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departmentLabel = useMemo(() => {
    const normalized = (thread?.department ?? "").trim().replace(/_/g, "-");
    if (!normalized) return "";
    const matched = page?.departments.find((dept) => dept.id === normalized);
    if (matched) return matched.label;
    return normalized.replace(/[-_]/g, " ").trim();
  }, [page?.departments, thread?.department]);

  const staffDisplayName = useMemo(() => {
    const name = (thread?.assignedStaffUser?.displayName ?? "").trim();
    return name || departmentLabel || thread?.title || page?.thread.staffFallback || "";
  }, [departmentLabel, page?.thread.staffFallback, thread?.assignedStaffUser?.displayName, thread?.title]);

  async function load() {
    if (!page) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!session) {
        setError(page.errors.connectStayFirst);
        return;
      }

      const [threadRes, messagesRes] = await Promise.all([
        fetch(new URL(`/api/v1/threads/${encodeURIComponent(threadId)}`, apiBaseUrl).toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${session.guestToken}` }
        }),
        fetch(new URL(`/api/v1/threads/${encodeURIComponent(threadId)}/messages`, apiBaseUrl).toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${session.guestToken}` }
        })
      ]);

      if (!threadRes.ok) {
        setError(page.errors.threadNotFound);
        return;
      }

      if (!messagesRes.ok) {
        setError(page.errors.loadMessages);
        return;
      }

      setThread((await threadRes.json()) as Thread);
      const data = (await messagesRes.json()) as { items?: Message[] };
      setMessages(Array.isArray(data.items) ? data.items : []);

      window.dispatchEvent(new Event("mystay:refresh-unread"));
    } catch {
      setError(page.errors.backendUnreachable);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!page) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, page?.title]);

  useEffect(() => {
    if (!session || !page) return;

    const url = new URL("/api/v1/realtime/messages", apiBaseUrl);
    url.searchParams.set("threadId", threadId);
    url.searchParams.set("token", session.guestToken);

    const source = new EventSource(url.toString());
    const handleCreated = () => {
      void load();
    };

    source.addEventListener("message_created", handleCreated);
    source.addEventListener("ping", () => {});

    return () => {
      source.removeEventListener("message_created", handleCreated);
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, session?.guestToken, page?.title]);

  async function sendMessage() {
    if (!page) return;

    if (!session) {
      setError(page.errors.connectStayFirst);
      return;
    }

    const bodyText = draft.trim();
    if (!bodyText || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(
        new URL(`/api/v1/threads/${encodeURIComponent(threadId)}/messages`, apiBaseUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
          body: JSON.stringify({ bodyText })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = typeof errorData.error === "string" && errorData.error.trim() ? errorData.error.trim() : response.statusText;
        setError(`${page.errors.sendMessagePrefix}: ${detail}`);
        return;
      }

      setDraft("");
      await load();
    } catch {
      setError(page.errors.backendUnreachable);
    } finally {
      setIsSending(false);
    }
  }

  if (!page) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Topbar
        title={staffDisplayName}
        subtitle={
          thread
            ? `${departmentLabel || thread.department} • ${session?.hotelName ?? page.hotelFallback}`
            : session?.hotelName ?? page.hotelFallback
        }
        backHref={withLocale(locale, "/messages")}
        leading={<Avatar alt={staffDisplayName} className="h-9 w-9" />}
        className="border-b-0"
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-32 pt-4">
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {isLoading ? <p className="mb-3 text-sm text-muted-foreground">{page.loading}</p> : null}

        <div className="flex-1 space-y-3">
          {messages.map((message) => {
            const isGuest = message.senderType === "guest";
            const variant = isGuest ? "outgoing" : "incoming";
            const timestamp = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <MessageBubble
                key={message.id}
                variant={variant}
                body={message.bodyText}
                timestamp={timestamp}
                showTranslate={!isGuest}
                labels={
                  threadStrings
                    ? {
                        sendErrorHint: threadStrings.sendErrorHint,
                        translateAction: threadStrings.translateAction
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-md">
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={sendMessage}
            disabled={isSending}
            placeholder={page.thread.writePlaceholder}
            labels={{
              removeAttachmentAria: page.thread.removeAttachmentAria,
              addAttachmentAria: page.thread.addAttachmentAria,
              quickActionAria: page.thread.quickActionAria,
              sendAria: page.thread.sendAria,
              writePlaceholder: page.thread.writePlaceholder
            }}
          />
        </div>
      </div>
    </div>
  );
}
