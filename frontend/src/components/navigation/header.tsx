// frontend/src/components/navigation/header.tsx
"use client";

import { useEffect, useState } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SideDrawer } from "./side-drawer";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";

type UserInfo = {
  guestId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function Header() {
  const router = useRouter();
  const locale = useLocale();
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
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(withLocale(locale, "/login"));
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
              <SheetTitle>MyStay Services</SheetTitle>
            </SheetHeader>
            <SideDrawer />
          </SheetContent>
        </Sheet>
        
        <Link href={withLocale(locale, "/experience")} className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">MyStay</h1>
        </Link>
        
        <div className="flex items-center gap-2">
          {!isLoading && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user.firstName}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : !isLoading ? (
            <Link href={withLocale(locale, "/login")}>
              <Button variant="ghost" size="icon" title="Sign in">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </header>
  );
}
