"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveInboxRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
      }, 250);
    };

    const source = new EventSource("/api/realtime/hotel");
    source.addEventListener("ticket_created", scheduleRefresh);
    source.addEventListener("ticket_updated", scheduleRefresh);
    source.addEventListener("ticket_note_created", scheduleRefresh);
    source.addEventListener("thread_created", scheduleRefresh);
    source.addEventListener("thread_updated", scheduleRefresh);
    source.addEventListener("thread_note_created", scheduleRefresh);
    source.addEventListener("message_created", scheduleRefresh);
    source.addEventListener("ping", () => {});

    source.onerror = scheduleRefresh;

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      source.close();
    };
  }, [router]);

  return null;
}
