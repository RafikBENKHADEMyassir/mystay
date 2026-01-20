"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import type { NavItem } from "@/lib/navigation";
import { navIcon } from "@/lib/navigation";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  items: NavItem[];
};

function navLabel(locale: string, href: string, fallback: string) {
  if (locale === "fr") {
    if (href === "/") return "Accueil";
    if (href === "/services") return "Services";
    if (href === "/messages") return "Messages";
    if (href === "/profile") return "Profil";
  }
  return fallback;
}

export function BottomNav({ items }: BottomNavProps) {
  const locale = useLocale();
  const pathname = stripLocaleFromPathname(usePathname() ?? "/");
  const visible = items.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur lg:hidden">
      <div className={cn("grid gap-1 px-1 py-2", visible.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
        {visible.map((item) => {
          const Icon = navIcon(item.icon);
          const isActive = pathname === item.href;
          const label = navLabel(locale, item.href, item.title);

          return (
            <Link
              key={item.href}
              href={withLocale(locale, item.href)}
              className={cn(
                "flex flex-col items-center justify-center rounded-md px-1 py-2 text-[11px] text-muted-foreground transition",
                isActive && "text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-foreground" : "text-muted-foreground")} />
              <span className={cn("mt-1 leading-none", isActive && "font-semibold")}>{label}</span>
              <span className={cn("mt-1 h-0.5 w-5 rounded-full bg-transparent", isActive && "bg-foreground")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
