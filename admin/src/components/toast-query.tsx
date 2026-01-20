"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function hasShown(key: string) {
  if (typeof window === "undefined") return false;
  const storageKey = "mystay_admin_toasts_v1";
  const seenRaw = window.sessionStorage.getItem(storageKey);
  const seen = new Set<string>(seenRaw ? seenRaw.split("|") : []);
  if (seen.has(key)) return true;
  seen.add(key);
  window.sessionStorage.setItem(storageKey, Array.from(seen).slice(-50).join("|"));
  return false;
}

export function ToastQuery() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const saved = searchParams.get("saved") === "1";
    const queued = searchParams.get("queued") === "1";
    const sent = searchParams.get("sent") === "1";
    const loggedOut = searchParams.get("logged_out") === "1";
    const error = searchParams.get("error")?.trim() ?? "";

    if (saved && !hasShown(`saved:${pathname}`)) {
      toast.success("Saved");
    }
    if (queued && !hasShown(`queued:${pathname}`)) {
      toast.message("Notification queued");
    }
    if (sent && !hasShown(`sent:${pathname}`)) {
      toast.success("Message sent");
    }
    if (loggedOut && !hasShown(`logged_out:${pathname}`)) {
      toast.message("Signed out");
    }
    if (error && !hasShown(`error:${pathname}:${error}`)) {
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
