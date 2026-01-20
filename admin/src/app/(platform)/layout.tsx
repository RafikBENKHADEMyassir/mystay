import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Settings, Users, LayoutDashboard } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { LogoutButton } from "@/components/logout-button";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

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
            <span className="font-semibold">MyStay Platform</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          <Link
            href="/platform"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/platform/hotels"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Building2 className="h-4 w-4" />
            Hotels
          </Link>
          <Link
            href="/platform/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
