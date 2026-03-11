import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { Building2, Settings, LayoutDashboard, Mail, Gauge, FileCheck, Database } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { LanguageSelector } from "@/components/language-selector";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { getAdminMessages } from "@/lib/admin-translations";

async function verifyPlatformAdmin(token: string) {
  // Decode JWT to check if it's a platform admin token
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload.typ === "platform_admin";
  } catch {
    return false;
  }
}

export default async function PlatformLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const messages = getAdminMessages(locale);
  const token = getStaffToken();
  if (!token) {
    redirect("/login?type=platform");
  }

  const isPlatformAdmin = await verifyPlatformAdmin(token);
  if (!isPlatformAdmin) {
    redirect("/login?type=platform");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/platform" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-semibold">{messages.app.platformName}</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          <Link
            href="/platform"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            {messages.platformNav.dashboard}
          </Link>
          <Link
            href="/platform/hotels"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Building2 className="h-4 w-4" />
            {messages.platformNav.hotels}
          </Link>
          <Link
            href="/platform/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            {messages.platformNav.settings}
          </Link>

          <div className="pb-1 pt-4">
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {messages.platformNav.configuration}
            </span>
          </div>
          <Link
            href="/platform/settings/notifications"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            {messages.platformNav.notifications}
          </Link>
          <Link
            href="/platform/settings/rate-limits"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Gauge className="h-4 w-4" />
            {messages.platformNav.rateLimits}
          </Link>
          <Link
            href="/platform/settings/audit-logs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <FileCheck className="h-4 w-4" />
            {messages.platformNav.auditLogs}
          </Link>
          <Link
            href="/platform/settings/backup"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Database className="h-4 w-4" />
            {messages.platformNav.backup}
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-end gap-2 px-6 py-3">
            <LanguageSelector />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
