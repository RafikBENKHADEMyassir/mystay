"use client";

import { useEffect, useState } from "react";
import { AppLink } from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import type { GuestContent } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { navIcon, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Hotel, Key, MessageCircle, Settings } from "lucide-react";

type DesktopNavProps = {
  items: NavItem[];
  badges?: { [href: string]: number };
  hotelName?: string;
};

function resolveLabel(item: NavItem, content: GuestContent | null) {
  if (!content) return "";
  if (item.href === "/") return content.navigation.home;
  if (item.href === "/services") return content.navigation.services;
  if (item.href === "/messages") return content.navigation.messages;
  if (item.href === "/profile") return content.navigation.profile;
  if (item.href === "/concierge") return content.pages.concierge.title;
  if (item.href === "/housekeeping") return content.pages.housekeeping.title;
  if (item.href === "/room-service") return content.pages.roomService.title;
  if (item.href === "/spa-gym") return content.pages.spaGym.title;
  if (item.href === "/restaurants") return content.pages.restaurants.title;
  if (item.href === "/reception") return content.pages.reception.title;
  if (item.href === "/operations") return content.navigation.operations;
  if (item.href === "/analytics") return content.navigation.analytics;
  return item.title;
}

export function DesktopNav({ items, badges = {}, hotelName }: DesktopNavProps) {
  const locale = useLocale();
  // Defer sessionStorage read to after mount to prevent hydration mismatch
  const [hotelId, setHotelId] = useState<string | null>(null);
  useEffect(() => {
    setHotelId(getDemoSession()?.hotelId ?? null);
  }, []);
  const { content } = useGuestContent(locale, hotelId);
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:border-r lg:bg-background">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <Hotel className="h-6 w-6 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{content?.navigation.appName ?? ""}</p>
          {hotelName && (
            <p className="text-xs text-muted-foreground truncate">{hotelName}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const localizedHref = withLocale(locale, item.href);
          const badgeCount = badges[item.href] ?? 0;
          const Icon = navIcon(item.icon);
          const isActive = pathname === localizedHref || 
            (localizedHref !== withLocale(locale, "/") && pathname.startsWith(localizedHref));
          
          return (
            <AppLink
              key={item.href}
              href={localizedHref}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="flex-1">{resolveLabel(item, content)}</span>
            </AppLink>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="border-t p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {content?.navigation.quickActionsTitle ?? ""}
        </p>
        <div className="space-y-1">
          <AppLink
            href={withLocale(locale, "/reception")}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Key className="h-4 w-4" />
            <span>{content?.navigation.quickActionDigitalKey ?? ""}</span>
          </AppLink>
          <AppLink
            href={withLocale(locale, "/agenda")}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            <span>{content?.navigation.quickActionAgenda ?? ""}</span>
          </AppLink>
          <AppLink
            href={withLocale(locale, "/messages")}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{content?.navigation.quickActionContactHotel ?? ""}</span>
          </AppLink>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <AppLink
          href={withLocale(locale, "/profile")}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>{content?.navigation.settingsLabel ?? ""}</span>
        </AppLink>
      </div>
    </aside>
  );
}
