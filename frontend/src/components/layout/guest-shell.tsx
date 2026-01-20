"use client";

import { BottomNav } from "@/components/navigation/bottom-nav";
import { guestBottomNav } from "@/lib/navigation";

export function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {children}
      <BottomNav items={guestBottomNav} />
    </div>
  );
}
