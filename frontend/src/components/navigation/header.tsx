// frontend/src/components/navigation/header.tsx
"use client";

import { useEffect, useState } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { AppLink } from "@/components/ui/app-link";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SideDrawer } from "./side-drawer";
import { clearDemoSession, getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";

type UserInfo = {
  guestId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function Header() {
  const locale = useLocale();
  const { content } = useGuestContent(locale, getDemoSession()?.hotelId ?? null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    clearDemoSession();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = withLocale(locale, "/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{content?.navigation.drawerTitle ?? ""}</SheetTitle>
            </SheetHeader>
            <SideDrawer />
          </SheetContent>
        </Sheet>
        
        <AppLink href={withLocale(locale, "/experience")} className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{content?.navigation.appName ?? ""}</h1>
        </AppLink>
        
        <div className="flex items-center gap-2">
          {!isLoading && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user.firstName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title={content?.navigation.logout ?? ""}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : !isLoading ? (
            <AppLink href={withLocale(locale, "/login")}>
              <Button variant="ghost" size="icon" title={content?.navigation.signIn ?? ""}>
                <User className="h-5 w-5" />
              </Button>
            </AppLink>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </header>
  );
}
