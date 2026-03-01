"use client";

import { AppLink } from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import type { NavItem } from "@/lib/navigation";
import { navIcon } from "@/lib/navigation";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  items: NavItem[];
};

type SessionResponse = {
  authenticated: boolean;
  backendToken: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function BottomNav({ items }: BottomNavProps) {
  const locale = useLocale();
  const { content } = useGuestContent(locale, getDemoSession()?.hotelId ?? null);
  const pathname = stripLocaleFromPathname(usePathname() ?? "/");
  const visible = items.slice(0, 5);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [unreadThreads, setUnreadThreads] = useState(0);
  const [servicesBadge] = useState(0);

  const messagesHref = useMemo(() => {
    const messagesItem = visible.find((item) => item.href === "/messages") ?? null;
    return messagesItem?.href ?? "/messages";
  }, [visible]);

  const resolveToken = useCallback(async () => {
    const demoToken = getDemoSession()?.guestToken?.trim();
    if (demoToken) return demoToken;

    try {
      const response = await fetch("/api/auth/session", { method: "GET" });
      if (!response.ok) return null;
      const data = (await response.json()) as SessionResponse;
      if (data?.authenticated && typeof data.backendToken === "string" && data.backendToken.trim()) {
        return data.backendToken.trim();
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!guestToken) {
      setUnreadThreads(0);
      return;
    }

    try {
      const response = await fetch(new URL("/api/v1/guest/unread", apiBaseUrl).toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${guestToken}` }
      });

      if (!response.ok) {
        setUnreadThreads(0);
        return;
      }

      const data = (await response.json()) as { unreadThreads?: number };
      const nextCount = typeof data.unreadThreads === "number" ? data.unreadThreads : 0;
      setUnreadThreads(nextCount);
    } catch {
      // Ignore offline errors
    }
  }, [guestToken]);

  useEffect(() => {
    let mounted = true;
    resolveToken().then((token) => {
      if (!mounted) return;
      setGuestToken(token);
    });
    return () => {
      mounted = false;
    };
  }, [resolveToken]);

  useEffect(() => {
    void refreshUnread();
  }, [pathname, guestToken, refreshUnread]);

  useEffect(() => {
    if (!guestToken) return;

    const url = new URL("/api/v1/realtime/stay", apiBaseUrl);
    url.searchParams.set("token", guestToken);

    const source = new EventSource(url.toString());
    const handleRefresh = () => {
      void refreshUnread();
    };

    source.addEventListener("message_created", handleRefresh);
    source.addEventListener("thread_created", handleRefresh);
    source.addEventListener("thread_updated", handleRefresh);
    source.addEventListener("ping", () => {});

    return () => {
      source.removeEventListener("message_created", handleRefresh);
      source.removeEventListener("thread_created", handleRefresh);
      source.removeEventListener("thread_updated", handleRefresh);
      source.close();
    };
  }, [guestToken, refreshUnread]);

  useEffect(() => {
    const handler = () => {
      void refreshUnread();
    };
    window.addEventListener("mystay:refresh-unread", handler);
    return () => {
      window.removeEventListener("mystay:refresh-unread", handler);
    };
  }, [refreshUnread]);

  function navLabel(href: string, fallback: string) {
    if (!content?.navigation) return fallback;
    if (href === "/") return content.navigation.home;
    if (href === "/services") return content.navigation.services;
    if (href === "/messages") return content.navigation.messages;
    if (href === "/profile") return content.navigation.profile;
    return fallback;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className={cn("grid gap-0 px-2 py-3", visible.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
        {visible.map((item) => {
          const Icon = navIcon(item.icon);
          const isActive = pathname === item.href;
          const label = navLabel(item.href, item.title);
          const isMessages = item.href === messagesHref;
          const isServices = item.href === "/services";
          const showBadge = (isMessages && unreadThreads > 0) || (isServices && servicesBadge > 0);
          const badgeValue = isMessages ? unreadThreads : servicesBadge;
          const badgeLabel = badgeValue > 99 ? "99+" : String(badgeValue);

          return (
            <AppLink
              key={item.href}
              href={withLocale(locale, item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-1 py-1 text-[11px] transition-colors",
                isActive ? "text-black" : "text-black/40"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
                {showBadge ? (
                  <span className="absolute -right-2.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D4A843] px-1 text-[9px] font-bold text-white">
                    {badgeLabel}
                  </span>
                ) : null}
              </span>
              <span className={cn("leading-none", isActive && "font-semibold")}>{label}</span>
              {isActive && <span className="h-[2px] w-4 rounded-full bg-black" />}
            </AppLink>
          );
        })}
      </div>
    </nav>
  );
}
