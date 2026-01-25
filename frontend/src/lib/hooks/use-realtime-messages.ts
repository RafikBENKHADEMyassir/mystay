"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export type RealtimeMessage = {
  id: string;
  threadId: string;
  senderType: "guest" | "staff" | "system";
  senderName: string | null;
  bodyText: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

export type RealtimeEvent = {
  type: "message" | "ticket_update" | "ping";
  threadId?: string;
  ticketId?: string;
  department?: string;
  hotelId?: string;
  message?: RealtimeMessage;
  data?: Record<string, unknown>;
};

type UseRealtimeMessagesOptions = {
  threadId?: string;
  ticketId?: string;
  hotelId?: string;
  departments?: string[];
  enabled?: boolean;
  onMessage?: (event: RealtimeEvent) => void;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function useRealtimeMessages({
  threadId,
  ticketId,
  hotelId,
  departments,
  enabled = true,
  onMessage
}: UseRealtimeMessagesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Build URL with query params
    const url = new URL("/api/v1/realtime/messages", apiBaseUrl);
    if (threadId) url.searchParams.set("threadId", threadId);
    if (ticketId) url.searchParams.set("ticketId", ticketId);
    if (hotelId) url.searchParams.set("hotelId", hotelId);
    if (departments?.length) {
      departments.forEach((d) => url.searchParams.append("departments", d));
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    // Listen for message events
    eventSource.addEventListener("message", (e) => {
      try {
        const event = JSON.parse(e.data) as RealtimeEvent;
        setLastEvent(event);
        onMessage?.(event);
      } catch {
        // Ignore parse errors
      }
    });

    // Listen for ticket_update events
    eventSource.addEventListener("ticket_update", (e) => {
      try {
        const event = JSON.parse(e.data) as RealtimeEvent;
        event.type = "ticket_update";
        setLastEvent(event);
        onMessage?.(event);
      } catch {
        // Ignore parse errors
      }
    });

    // Listen for ping events (keep-alive)
    eventSource.addEventListener("ping", () => {
      // Connection is alive
    });
  }, [enabled, threadId, ticketId, hotelId, departments, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    lastEvent,
    disconnect,
    reconnect: connect
  };
}
