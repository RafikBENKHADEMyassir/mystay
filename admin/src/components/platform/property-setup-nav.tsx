"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, CreditCard, FileText, HandCoins, PlugZap, RefreshCw, UtensilsCrossed } from "lucide-react";

import { defaultAdminLocale, getAdminLocaleFromPathname, stripAdminLocaleFromPathname } from "@/lib/admin-locale";
import { cn } from "@/lib/utils";

type SetupItem = {
  slug: string;
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const setupNavCopy = {
  en: {
    menuSetup: "Menu setup",
    payments: "Payments",
    roomService: "Room service",
    minibar: "Minibar",
    upselling: "Upselling",
    checkinOut: "Check-in/out config",
    hotelRules: "Hotel rules",
    sync: "Data synchronization",
    notificationCenter: "Notification center",
  },
  fr: {
    menuSetup: "Configuration menu",
    payments: "Paiements",
    roomService: "Room service",
    minibar: "Minibar",
    upselling: "Upselling",
    checkinOut: "Config check-in/out",
    hotelRules: "Regles hotel",
    sync: "Synchronisation des donnees",
    notificationCenter: "Centre de notifications",
  },
  es: {
    menuSetup: "Configuracion de menu",
    payments: "Pagos",
    roomService: "Room service",
    minibar: "Minibar",
    upselling: "Upselling",
    checkinOut: "Config check-in/out",
    hotelRules: "Reglas del hotel",
    sync: "Sincronizacion de datos",
    notificationCenter: "Centro de notificaciones",
  },
} as const;

const items: SetupItem[] = [
  { slug: "menu-setup", titleKey: "menuSetup", icon: UtensilsCrossed },
  { slug: "payments", titleKey: "payments", icon: CreditCard },
  { slug: "room-service", titleKey: "roomService", icon: ClipboardList },
  { slug: "minibar", titleKey: "minibar", icon: HandCoins },
  { slug: "upselling", titleKey: "upselling", icon: PlugZap },
  { slug: "checkin-out", titleKey: "checkinOut", icon: FileText },
  { slug: "hotel-rules", titleKey: "hotelRules", icon: FileText },
  { slug: "sync", titleKey: "sync", icon: RefreshCw },
  { slug: "notification-center", titleKey: "notificationCenter", icon: Bell }
];

type PropertySetupNavProps = {
  hotelId: string;
};

export function PropertySetupNav({ hotelId }: PropertySetupNavProps) {
  const rawPathname = usePathname() ?? "";
  const pathname = stripAdminLocaleFromPathname(rawPathname);
  const locale = getAdminLocaleFromPathname(rawPathname) ?? defaultAdminLocale;
  const t = setupNavCopy[locale];

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const href = `/platform/hotels/${encodeURIComponent(hotelId)}/setup/${item.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.slug}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {t[item.titleKey as keyof typeof t]}
          </Link>
        );
      })}
    </nav>
  );
}
