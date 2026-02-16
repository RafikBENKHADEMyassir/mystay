"use client";

import { useEffect, useState } from "react";
import type { AgendaEvent } from "@/types/overview";

type UseAgendaEventsResult = {
  events: AgendaEvent[];
  isLoading: boolean;
};

export function useAgendaEvents(stayId: string | undefined, token: string | null): UseAgendaEventsResult {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAgendaEvents() {
      if (!token || !stayId) return;

      setIsLoading(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
        const url = new URL("/api/v1/events", apiBaseUrl);
        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;

        const data = (await res.json()) as { items?: AgendaEvent[] };
        setEvents(Array.isArray(data.items) ? data.items : []);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }

    void loadAgendaEvents();
  }, [stayId, token]);

  return { events, isLoading };
}
