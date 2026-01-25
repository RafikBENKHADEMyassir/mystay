"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Inbox, LayoutDashboard, MessagesSquare, Plug, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[]; // If undefined, visible to all roles
};

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Messages", href: "/messages", icon: MessagesSquare },
  { title: "Request Templates", href: "/request-templates", icon: FileText, roles: ["admin", "manager"] },
  { title: "Integrations", href: "/integrations", icon: Plug, roles: ["admin", "manager"] },
  { title: "Staff", href: "/settings/staff", icon: Users, roles: ["admin", "manager"] },
  { title: "Settings", href: "/settings", icon: Settings, roles: ["admin", "manager"] }
];

type AdminNavProps = {
  role?: string;
};

export function AdminNav({ role }: AdminNavProps) {
  const pathname = usePathname() ?? "/";

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            asChild
            variant={active ? "secondary" : "ghost"}
            className={cn("w-full justify-start gap-2", active && "font-semibold")}
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
