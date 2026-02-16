"use client";

import { AppLink } from "@/components/ui/app-link";
import { Bell, KeyRound, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { guestBottomNav, guestNav, operationsNav } from "@/lib/navigation";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
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
  const { content } = useGuestContent(locale, session?.hotelId ?? null);

  useEffect(() => {
    const currentSession = getDemoSession();
    setSession(currentSession);
    
    // Sync authentication cookie from sessionStorage
    if (currentSession?.guestToken) {
      // Check if cookie already exists
      const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('guest_session='));
      if (!hasCookie) {
        // Set cookie if session exists but cookie doesn't
        document.cookie = `guest_session=${currentSession.guestToken}; path=/; max-age=86400; SameSite=Lax`;
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar guestNav={guestNav} operationsNav={operationsNav} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-6">
            <div>
              <AppLink href={withLocale(locale, "/")} className="text-lg font-semibold">
                {session?.hotelName ?? content?.navigation.appName ?? ""}
              </AppLink>
              <p className="text-sm text-muted-foreground">
                {session
                  ? interpolateTemplate(content?.navigation.sessionSummaryTemplate ?? "", {
                      roomNumber: session.roomNumber ?? "—",
                      confirmationNumber: session.confirmationNumber
                    })
                  : content?.navigation.noSessionSummary ?? ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label={content?.navigation.wifiButtonAriaLabel ?? ""}
                disabled={!session}
              >
                <Wifi className="mr-2 h-4 w-4" />
                {content?.navigation.wifiButtonLabel ?? ""}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label={content?.navigation.keyButtonAriaLabel ?? ""}
                disabled={!session}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {content?.navigation.keyButtonLabel ?? ""}
              </Button>
              <Button variant="ghost" size="icon" aria-label={content?.navigation.notificationsAriaLabel ?? ""}>
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
