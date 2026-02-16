// frontend/src/app/[locale]/(experience)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { DesktopNav } from "@/components/navigation/desktop-nav";
import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession, type DemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { guestBottomNav, guestNav } from "@/lib/navigation";

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  // Defer sessionStorage read to after mount to prevent hydration mismatch
  const [session, setSession] = useState<DemoSession | null>(null);
  useEffect(() => {
    setSession(getDemoSession());
  }, []);
  const { content } = useGuestContent(locale, session?.hotelId ?? null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Desktop Sidebar - hidden on mobile, shown on lg+ */}
      <DesktopNav 
        items={guestNav} 
        hotelName={session?.hotelName ?? ""}
      />
      
      {/* Main content area - full width on mobile, offset on desktop */}
      <main className="flex-1 pb-16 lg:pb-0 lg:pl-64">
        {/* Desktop header bar */}
        <div className="sticky top-0 z-40 hidden h-16 items-center border-b bg-background/95 px-8 backdrop-blur lg:flex">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {content?.navigation.welcomeBack ?? ""}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="lg:px-8 lg:py-6">
          {children}
        </div>
      </main>
      
      {/* Mobile bottom nav - shown on mobile, hidden on lg+ */}
      <BottomNav items={guestBottomNav} />
    </div>
  );
}
