"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveThreadRefresh({ threadId }: { threadId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!threadId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
      }, 250);
    };

    const source = new EventSource(`/api/realtime/thread?threadId=${encodeURIComponent(threadId)}`);
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
  }, [router, threadId]);

  return null;
}
