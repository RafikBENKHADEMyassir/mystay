import { AdminNav } from "@/components/layout/admin-nav";
import { cookies } from "next/headers";

import { LanguageSelector } from "@/components/language-selector";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { getAdminMessages } from "@/lib/admin-translations";
import { getStaffPrincipal } from "@/lib/staff-token";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const principal = getStaffPrincipal();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const messages = getAdminMessages(locale);
  const role = principal?.role ?? "staff";
  const displayName = principal?.displayName ?? messages.roles.staff;
  const departments = principal?.departments ?? [];
  const roleLabel = role === "manager" ? messages.roles.manager : role === "admin" ? messages.roles.admin : messages.roles.staff;

  return (
    <div className="grid min-h-screen md:grid-cols-[260px,1fr]">
      <aside className="hidden border-r bg-muted/10 md:flex md:flex-col">
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{messages.app.adminName}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {roleLabel}
          </Badge>
        </div>
        <Separator />
        <div className="flex-1 px-3 py-4">
          <AdminNav role={role} departments={departments} locale={locale} />
        </div>
        {departments.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{messages.app.departments}</p>
              <div className="flex flex-wrap gap-1">
                {departments.map((dept) => (
                  <Badge key={dept} variant="secondary" className="text-xs">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
        <Separator />
        <div className="px-4 py-3">
          <p className="truncate text-xs text-muted-foreground">{displayName}</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <p className="text-sm font-semibold md:hidden">{messages.app.adminName}</p>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
