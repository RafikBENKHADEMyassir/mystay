import { AdminNav } from "@/components/layout/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStaffPrincipal } from "@/lib/staff-token";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const displayName = principal?.displayName ?? "Staff";
  const departments = principal?.departments ?? [];

  return (
    <div className="grid min-h-screen md:grid-cols-[260px,1fr]">
      <aside className="hidden border-r bg-muted/10 md:flex md:flex-col">
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">MyStay Admin</p>
            <p className="truncate text-xs text-muted-foreground">
              {role === "manager" ? "Hotel Manager" : role === "admin" ? "Administrator" : "Staff"}
            </p>
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {role}
          </Badge>
        </div>
        <Separator />
        <div className="flex-1 px-3 py-4">
          <AdminNav role={role} />
        </div>
        {departments.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Departments</p>
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
            <p className="text-sm font-semibold md:hidden">MyStay Admin</p>
            <div className="ml-auto flex items-center gap-2">
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

