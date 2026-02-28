"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Image, Inbox, Info, LayoutDashboard, LayoutGrid, Link2, Plug, PlugZap, Settings, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  departments?: string[];
  indent?: boolean;
};

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Reservations", href: "/reservations", icon: CalendarDays, departments: ["reception"] },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Housekeeping", href: "/housekeeping", icon: Sparkles, departments: ["housekeeping"] },
  { title: "Pay by link", href: "/payment-links", icon: Link2, roles: ["admin", "manager"], departments: ["reception"] },
  { title: "Message templates", href: "/message-templates", icon: FileText, roles: ["admin", "manager"] },
  { title: "Room Images", href: "/room-images", icon: Image, roles: ["admin", "manager"] },
  { title: "Upselling", href: "/home-carousels", icon: LayoutGrid, roles: ["admin", "manager"] },
  { title: "Useful informations", href: "/useful-informations", icon: Info, roles: ["admin", "manager"] },
  { title: "Upsell services", href: "/upsell-services", icon: PlugZap, roles: ["admin", "manager"] },
  { title: "Requests", href: "/requests", icon: FileText },
  { title: "Integrations", href: "/integrations", icon: Plug, roles: ["admin", "manager"] },
  { title: "Staff", href: "/settings/staff", icon: Users, roles: ["admin", "manager"] },
  { title: "Settings", href: "/settings", icon: Settings, roles: ["admin", "manager"] }
];

type AdminNavProps = {
  role?: string;
  departments?: string[];
};

export function AdminNav({ role, departments = [] }: AdminNavProps) {
  const pathname = usePathname() ?? "/";
  const isAdminOrManager = role === "admin" || role === "manager";

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
              {item.title}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
