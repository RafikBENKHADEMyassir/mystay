"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Image, Inbox, Info, LayoutDashboard, LayoutGrid, Link2, Plug, PlugZap, Settings, Sparkles, Users } from "lucide-react";

import type { AdminLocale } from "@/lib/admin-locale";
import { getAdminLocaleFromPathname, stripAdminLocaleFromPathname } from "@/lib/admin-locale";
import { getAdminMessages } from "@/lib/admin-translations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  titleKey: keyof ReturnType<typeof getAdminMessages>["nav"];
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  departments?: string[];
  indent?: boolean;
};

const navItems: NavItem[] = [
  { titleKey: "dashboard", href: "/", icon: LayoutDashboard },
  { titleKey: "reservations", href: "/reservations", icon: CalendarDays, departments: ["reception"] },
  { titleKey: "inbox", href: "/inbox", icon: Inbox },
  { titleKey: "housekeeping", href: "/housekeeping", icon: Sparkles, departments: ["housekeeping"] },
  { titleKey: "payByLink", href: "/payment-links", icon: Link2, roles: ["admin", "manager"], departments: ["reception"] },
  { titleKey: "messageTemplates", href: "/message-templates", icon: FileText, roles: ["admin", "manager"] },
  { titleKey: "roomImages", href: "/room-images", icon: Image, roles: ["admin", "manager"] },
  { titleKey: "upselling", href: "/home-carousels", icon: LayoutGrid, roles: ["admin", "manager"] },
  { titleKey: "usefulInformations", href: "/useful-informations", icon: Info, roles: ["admin", "manager"] },
  { titleKey: "upsellServices", href: "/upsell-services", icon: PlugZap, roles: ["admin", "manager"] },
  { titleKey: "requests", href: "/requests", icon: FileText },
  { titleKey: "integrations", href: "/integrations", icon: Plug, roles: ["admin", "manager"] },
  { titleKey: "staff", href: "/settings/staff", icon: Users, roles: ["admin", "manager"] },
  { titleKey: "settings", href: "/settings", icon: Settings, roles: ["admin", "manager"] }
];

type AdminNavProps = {
  role?: string;
  departments?: string[];
  locale: AdminLocale;
};

export function AdminNav({ role, departments = [], locale }: AdminNavProps) {
  const rawPathname = usePathname() ?? "/";
  const pathname = stripAdminLocaleFromPathname(rawPathname);
  const isAdminOrManager = role === "admin" || role === "manager";
  const activeLocale = getAdminLocaleFromPathname(rawPathname) ?? locale;
  const labels = getAdminMessages(activeLocale).nav;

  const visibleItems = navItems.filter((item) => {
    if (item.roles && (!role || !item.roles.includes(role))) return false;
    if (isAdminOrManager) return true;
    if (!item.departments) return true;
    return item.departments.some((d) => departments.includes(d));
  });

  const activeItem =
    visibleItems
      .filter((item) => {
        if (item.href === "/") return pathname === "/";
        return pathname === item.href || pathname.startsWith(`${item.href}/`);
      })
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null;

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const active = activeItem?.href === item.href;
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            asChild
            variant={active ? "secondary" : "ghost"}
            className={cn("w-full justify-start gap-2", item.indent && "pl-9", active && "font-semibold")}
          >
            <Link href={item.href}>
              <Icon className="h-4 w-4" />
              {labels[item.titleKey]}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
