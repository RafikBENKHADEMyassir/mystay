"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";

type Thread = {
  id: string;
  department: string;
  status: string;
  title: string;
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
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Array<{ id: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useMemo(() => getDemoSession(), []);

  const staffDisplayName = useMemo(() => {
    if (thread?.department === "concierge") return "Mohamed";
    if (thread?.department === "housekeeping") return "Mohamed";
    if (thread?.department === "restaurants") return "Mohamed";
    if (thread?.department === "room_service") return "Mohamed";
    if (thread?.department === "spa") return "Mohamed";
    return "Julia";
  }, [thread?.department]);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      if (!session) {
        setError("Connect a stay first.");
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
        setError("Thread not found.");
        return;
      }

      if (!messagesRes.ok) {
        setError("Could not load messages.");
        return;
      }

      setThread((await threadRes.json()) as Thread);
      const data = (await messagesRes.json()) as { items?: Message[] };
      setMessages(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then refresh.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    if (!session) return;

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
  }, [threadId, session?.guestToken]);

  async function sendMessage() {
    if (!session) {
      setError("Connect a stay first.");
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
          body: JSON.stringify({
            senderType: "guest",
            senderName: "Guest",
            bodyText
          })
        }
      );

      if (!response.ok) {
        setError("Could not send message.");
        return;
      }

      setDraft("");
      setAttachments([]);
      await load();
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then try again.");
    } finally {
      setIsSending(false);
    }
  }

  function addFakeAttachment() {
    setAttachments((current) => {
      const next = [...current, { id: `att_${Math.random().toString(16).slice(2)}`, label: "Attachment" }];
      return next.slice(0, 2);
    });
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((current) => current.filter((item) => item.id !== attachmentId));
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Topbar
        title={staffDisplayName}
        subtitle={thread ? `Concierge de ${session?.hotelName ?? "Four Seasons"}` : session?.hotelName ?? "Hôtel Four Seasons"}
        backHref={withLocale(locale, "/messages")}
        leading={<Avatar alt={staffDisplayName} className="h-9 w-9" />}
        className="border-b-0"
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-32 pt-4">
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {isLoading ? <p className="mb-3 text-sm text-muted-foreground">{locale === "fr" ? "Chargement…" : "Loading…"}</p> : null}

        <div className="flex-1 space-y-3">
          {messages.map((message, index) => {
            const isGuest = message.senderType === "guest";
            const isError = index === messages.length - 2 && isGuest && message.bodyText.length > 60;
            const variant = isError ? "error" : isGuest ? "outgoing" : "incoming";
            const timestamp = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <MessageBubble
                key={message.id}
                variant={variant}
                body={message.bodyText}
                timestamp={timestamp}
                showTranslate={!isGuest}
              />
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-md">
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={sendMessage}
            disabled={isSending}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
            onAddAttachment={addFakeAttachment}
            placeholder={locale === "fr" ? "Écrire un message" : "Write a message"}
          />
        </div>
      </div>
    </div>
  );
}
