"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";
import { navIcon, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Hotel, Key, MessageCircle, Settings } from "lucide-react";

type DesktopNavProps = {
  items: NavItem[];
  badges?: { [href: string]: number };
  hotelName?: string;
};

export function DesktopNav({ items, badges = {}, hotelName }: DesktopNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  
  const localizedItems = items.map((item) => ({
    ...item,
    href: withLocale(locale, item.href),
    badge: badges[item.href]
  }));

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:border-r lg:bg-background">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <Hotel className="h-6 w-6 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">MyStay</p>
          {hotelName && (
            <p className="text-xs text-muted-foreground truncate">{hotelName}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {localizedItems.map((item) => {
          const Icon = navIcon(item.icon);
          const isActive = pathname === item.href || 
            (item.href !== withLocale(locale, "/") && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="flex-1">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="border-t p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </p>
        <div className="space-y-1">
          <Link
            href={withLocale(locale, "/reception")}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Key className="h-4 w-4" />
            <span>Digital Key</span>
          </Link>
          <Link
            href={withLocale(locale, "/agenda")}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            <span>My Agenda</span>
          </Link>
          <Link
            href={withLocale(locale, "/messages")}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Contact Hotel</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Link
          href={withLocale(locale, "/profile")}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
