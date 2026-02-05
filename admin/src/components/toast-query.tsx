"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function hasShownRecently(key: string, ttlMs = 800) {
  if (typeof window === "undefined") return false;
  const storageKey = "mystay_admin_toasts_v1";
  const now = Date.now();

  const entriesRaw = window.sessionStorage.getItem(storageKey);
  const entries = entriesRaw ? entriesRaw.split("|") : [];

  const recent = new Map<string, number>();
  for (const entry of entries) {
    const [storedKey, storedAtRaw] = entry.split("~");
    const storedAt = Number(storedAtRaw);
    if (!storedKey || !Number.isFinite(storedAt)) continue;
    if (now - storedAt > 60_000) continue;
    recent.set(storedKey, storedAt);
  }

  const lastShownAt = recent.get(key);
  if (lastShownAt && now - lastShownAt < ttlMs) return true;

  recent.set(key, now);
  const compact = Array.from(recent.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(-50)
    .map(([storedKey, storedAt]) => `${storedKey}~${storedAt}`)
    .join("|");

  window.sessionStorage.setItem(storageKey, compact);
  return false;
}

export function ToastQuery() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const savedValue = searchParams.get("saved")?.trim() ?? "";
    const queuedValue = searchParams.get("queued")?.trim() ?? "";
    const sentValue = searchParams.get("sent")?.trim() ?? "";
    const loggedOutValue = searchParams.get("logged_out")?.trim() ?? "";

    const saved = Boolean(savedValue);
    const queued = Boolean(queuedValue);
    const sent = Boolean(sentValue);
    const loggedOut = Boolean(loggedOutValue);
    const error = searchParams.get("error")?.trim() ?? "";

    if (saved && !hasShownRecently(`saved:${pathname}:${savedValue}`)) {
      const message =
        savedValue === "sync"
          ? "Synced"
          : savedValue === "created"
            ? "Created"
            : savedValue === "updated"
              ? "Updated"
              : "Saved";
      toast.success(message);
    }
    if (queued && !hasShownRecently(`queued:${pathname}:${queuedValue}`)) {
      toast.message("Notification queued");
    }
    if (sent && !hasShownRecently(`sent:${pathname}:${sentValue}`)) {
      toast.success("Message sent");
    }
    if (loggedOut && !hasShownRecently(`logged_out:${pathname}:${loggedOutValue}`)) {
      toast.message("Signed out");
    }
    if (error && !hasShownRecently(`error:${pathname}:${error}`, 2000)) {
      toast.error(`Error: ${error}`);
    }

    if (saved || queued || sent || loggedOut) {
      const next = new URLSearchParams(searchParams.toString());
      if (saved) next.delete("saved");
      if (queued) next.delete("queued");
      if (sent) next.delete("sent");
      if (loggedOut) next.delete("logged_out");

      const nextQuery = next.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return null;
}
