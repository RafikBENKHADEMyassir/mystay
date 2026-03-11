"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";
import { getAdminMessages } from "@/lib/admin-translations";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const messages = getAdminMessages(locale);
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login?logged_out=1");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={logout} disabled={isLoading}>
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? messages.actions.signingOut : messages.actions.signOut}
    </Button>
  );
}
