"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Inbox, LayoutDashboard, MessagesSquare, Plug, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Messages", href: "/messages", icon: MessagesSquare },
  { title: "Request Templates", href: "/request-templates", icon: FileText },
  { title: "Integrations", href: "/integrations", icon: Plug },
  { title: "Settings", href: "/settings", icon: Settings }
] as const;

export function AdminNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
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
