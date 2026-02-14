// frontend/src/components/navigation/side-drawer.tsx
"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  Dumbbell,
  LogOut,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clearDemoSession } from "@/lib/demo-session";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";

const services = [
  { href: "/concierge", label: "Concierge", icon: Bell },
  { href: "/reception", label: "Reception", icon: Briefcase },
  { href: "/housekeeping", label: "Housekeeping", icon: Sparkles },
  { href: "/room-service", label: "Room Service", icon: ShoppingBag },
  { href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { href: "/spa", label: "Spa & Wellness", icon: Sparkles },
  { href: "/gym", label: "Gym & Fitness", icon: Dumbbell },
];

export function SideDrawer() {
  const locale = useLocale();

  const handleLogout = async () => {
    clearDemoSession();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = withLocale(locale, "/");
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <nav className="flex flex-col gap-2">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.href}
              href={service.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <Icon className="h-5 w-5" />
              {service.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <Button
        variant="ghost"
        className="justify-start gap-3"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5" />
        Logout
      </Button>
    </div>
  );
}
