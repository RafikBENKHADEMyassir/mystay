import { AdminNav } from "@/components/layout/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-[260px,1fr]">
      <aside className="hidden border-r bg-muted/10 md:flex md:flex-col">
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">MyStay Admin</p>
            <p className="truncate text-xs text-muted-foreground">Staff console</p>
          </div>
          <Badge variant="outline" className="text-xs">
            v0.1
          </Badge>
        </div>
        <Separator />
        <div className="flex-1 px-3 py-4">
          <AdminNav />
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

