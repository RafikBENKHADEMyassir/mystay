"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  threadId: string;
  senderType: "guest" | "staff";
  senderName: string;
  bodyText: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

type Props = {
  conversationId: string;
  token: string;
  backendUrl: string;
  initialMessages: Message[];
  initialHasMore: boolean;
  initialTotal: number;
};

const PAGE_SIZE = 30;

export function MessagePanel({
  conversationId,
  token,
  backendUrl,
  initialMessages,
  initialHasMore,
  initialTotal,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      didInitialScroll.current = true;
    }
  }, [messages.length]);

  const loadOlder = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestTimestamp = messages[0]?.createdAt;
    const scrollEl = scrollRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight ?? 0;

    try {
      const url = new URL(
        `/api/v1/threads/${encodeURIComponent(conversationId)}/messages`,
        backendUrl
      );
      url.searchParams.set("limit", String(PAGE_SIZE));
      if (oldestTimestamp) url.searchParams.set("before", oldestTimestamp);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = (await res.json()) as {
        items?: Message[];
        hasMore?: boolean;
        total?: number;
      };
      const olderMessages = Array.isArray(data.items) ? data.items : [];

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
        setHasMore(data.hasMore ?? false);
        if (typeof data.total === "number") setTotal(data.total);

        // Maintain scroll position after prepending
        requestAnimationFrame(() => {
          if (scrollEl) {
            const newScrollHeight = scrollEl.scrollHeight;
            scrollEl.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch {
      // Silently handle - user can retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, messages, conversationId, backendUrl, token]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      {/* Load older button */}
      {hasMore && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={loadOlder}
            disabled={isLoadingMore}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition",
              isLoadingMore
                ? "border-muted text-muted-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Loading…
              </span>
            ) : (
              `Load older messages (${messages.length} of ${total})`
            )}
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => {
            const isStaff = message.senderType === "staff";
            const payload = message.payload ?? {};
            const ticketId =
              typeof payload.ticketId === "string" ? payload.ticketId : null;
            const hasTicketLink =
              ticketId &&
              (payload.type === "restaurant_booking" ||
                payload.type === "restaurant_booking_confirmed");

            return (
              <li
                key={message.id}
                className={cn("flex", isStaff ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] space-y-1 rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-border",
                    isStaff
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 text-xs",
                      isStaff
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    <span className="font-semibold">{message.senderName}</span>
                    <span className="whitespace-nowrap">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.bodyText}
                  </p>
                  {hasTicketLink && (
                    <div className="mt-1.5 border-t border-border/30 pt-1.5">
                      <Link
                        href={`/requests/${encodeURIComponent(ticketId)}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          isStaff
                            ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        View request {ticketId}
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
