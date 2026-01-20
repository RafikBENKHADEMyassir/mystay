"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
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
  const pathname = stripLocaleFromPathname(usePathname() ?? "/");

  return (
    <aside className="hidden w-72 border-r bg-muted/30 lg:block">
      <div className="flex items-center justify-between px-4 py-5">
        <div>
          <p className="text-sm font-semibold">MyStay</p>
          <p className="text-xs text-muted-foreground">PWA + Staff Console</p>
        </div>
        <Badge variant="secondary">v0.1</Badge>
      </div>
      <Separator className="h-px w-full" />
      <nav className="space-y-6 px-3 py-4">
        <NavSection title="Guest experience" items={guestNav} pathname={pathname} locale={locale} />
        <NavSection title="Ops & analytics" items={operationsNav} pathname={pathname} locale={locale} />
      </nav>
    </aside>
  );
}

type NavSectionProps = {
  title: string;
  items: NavItem[];
  pathname: string;
  locale: Locale;
};

function NavSection({ title, items, pathname, locale }: NavSectionProps) {
  return (
    <div>
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = navIcon(item.icon);

          return (
            <Link
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
                <span className="block leading-none">{item.title}</span>
                {item.description ? (
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">{item.description}</span>
                ) : null}
              </span>
              {item.badge ? <Badge variant="outline">{item.badge}</Badge> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
