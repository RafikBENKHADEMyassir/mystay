"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, CreditCard, FileText, HandCoins, PlugZap, RefreshCw, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

type SetupItem = {
  slug: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: SetupItem[] = [
  { slug: "menu-setup", title: "Menu setup", icon: UtensilsCrossed },
  { slug: "payments", title: "Payments", icon: CreditCard },
  { slug: "room-service", title: "Room service", icon: ClipboardList },
  { slug: "minibar", title: "Minibar", icon: HandCoins },
  { slug: "upselling", title: "Upselling", icon: PlugZap },
  { slug: "checkin-out", title: "Check-in/out config", icon: FileText },
  { slug: "hotel-rules", title: "Hotel rules", icon: FileText },
  { slug: "sync", title: "Data synchronization", icon: RefreshCw },
  { slug: "notification-center", title: "Notification center", icon: Bell }
];

type PropertySetupNavProps = {
  hotelId: string;
};

export function PropertySetupNav({ hotelId }: PropertySetupNavProps) {
  const pathname = usePathname() ?? "";

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
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

