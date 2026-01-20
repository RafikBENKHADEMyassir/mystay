"use client";

import Link from "next/link";
import { Bell, KeyRound, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { guestBottomNav, guestNav, operationsNav } from "@/lib/navigation";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Sidebar } from "@/components/navigation/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const locale = useLocale();

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar guestNav={guestNav} operationsNav={operationsNav} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-6">
            <div>
              <Link href={withLocale(locale, "/")} className="text-lg font-semibold">
                {session?.hotelName ?? "MyStay"}
              </Link>
              <p className="text-sm text-muted-foreground">
                {session
                  ? `Room ${session.roomNumber ?? "—"} · Confirmation ${session.confirmationNumber}`
                  : "Unified guest and staff journeys"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label="Open Wi-Fi details"
                disabled={!session}
              >
                <Wifi className="mr-2 h-4 w-4" />
                Wi-Fi
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label="Open digital key"
                disabled={!session}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Key
              </Button>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Separator className="h-px w-full" />
        </header>
        <main className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pb-10">{children}</main>
        <BottomNav items={guestBottomNav} />
      </div>
    </div>
  );
}
