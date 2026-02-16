"use client";

import { AppLink } from "@/components/ui/app-link";
import { Bell, Briefcase, Dumbbell, LogOut, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clearDemoSession, getDemoSession } from "@/lib/demo-session";
import { useLocale } from "@/components/providers/locale-provider";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";

const serviceIcons = {
  concierge: Bell,
  reception: Briefcase,
  housekeeping: Sparkles,
  "room-service": ShoppingBag,
  restaurants: UtensilsCrossed,
  "spa-gym": Dumbbell
} as const;

export function SideDrawer() {
  const locale = useLocale();
  const { content } = useGuestContent(locale, getDemoSession()?.hotelId ?? null);

  const handleLogout = async () => {
    clearDemoSession();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = withLocale(locale, "/");
  };

  const services = content?.pages.services.cards ?? [];

  return (
    <div className="flex flex-col gap-4 py-4">
      <nav className="flex flex-col gap-2">
        {services.map((service) => {
          const Icon = serviceIcons[service.id as keyof typeof serviceIcons] ?? Sparkles;
          return (
            <AppLink
              key={service.id}
              href={withLocale(locale, service.href)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <Icon className="h-5 w-5" />
              {service.title}
            </AppLink>
          );
        })}
      </nav>
      <Separator />
      <Button variant="ghost" className="justify-start gap-3" onClick={handleLogout}>
        <LogOut className="h-5 w-5" />
        {content?.navigation.logout ?? ""}
      </Button>
    </div>
  );
}
