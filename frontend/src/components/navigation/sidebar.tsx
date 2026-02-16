"use client";

import { AppLink } from "@/components/ui/app-link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import type { GuestContent } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";
import { navIcon } from "@/lib/navigation";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n/paths";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  guestNav: NavItem[];
  operationsNav: NavItem[];
};

export function Sidebar({ guestNav, operationsNav }: SidebarProps) {
  const locale = useLocale();
  const { content } = useGuestContent(locale, getDemoSession()?.hotelId ?? null);
  const pathname = stripLocaleFromPathname(usePathname() ?? "/");

  return (
    <aside className="hidden w-72 border-r bg-muted/30 lg:block">
      <div className="flex items-center justify-between px-4 py-5">
        <div>
          <p className="text-sm font-semibold">{content?.navigation.appName ?? ""}</p>
          <p className="text-xs text-muted-foreground">{content?.navigation.sidebarSubtitle ?? ""}</p>
        </div>
        <Badge variant="secondary">{content?.navigation.versionLabel ?? ""}</Badge>
      </div>
      <Separator className="h-px w-full" />
      <nav className="space-y-6 px-3 py-4">
        <NavSection
          title={content?.navigation.guestSectionTitle ?? ""}
          items={guestNav}
          pathname={pathname}
          locale={locale}
          content={content}
        />
        <NavSection
          title={content?.navigation.operationsSectionTitle ?? ""}
          items={operationsNav}
          pathname={pathname}
          locale={locale}
          content={content}
        />
      </nav>
    </aside>
  );
}

type NavSectionProps = {
  title: string;
  items: NavItem[];
  pathname: string;
  locale: Locale;
  content: GuestContent | null;
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

function NavSection({ title, items, pathname, locale, content }: NavSectionProps) {
  return (
    <div>
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = navIcon(item.icon);

          return (
            <AppLink
              key={item.href}
              href={withLocale(locale, item.href)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                isActive && "bg-primary/5 text-foreground shadow-sm"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition group-hover:text-foreground",
                  isActive && "border-primary/40 text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block leading-none">{resolveLabel(item, content)}</span>
              </span>
              {item.badge ? <Badge variant="outline">{item.badge}</Badge> : null}
            </AppLink>
          );
        })}
      </div>
    </div>
  );
}
