import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";

import { PropertySetupNav } from "@/components/platform/property-setup-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStaffToken } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type Hotel = {
  id: string;
  name: string;
  isActive: boolean;
};

async function getHotel(token: string, hotelId: string): Promise<Hotel | null> {
  try {
    const response = await fetch(`${backendUrl}/api/v1/admin/hotels/${encodeURIComponent(hotelId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { hotel?: Hotel };
    return data.hotel ?? null;
  } catch {
    return null;
  }
}

export default async function PropertySetupLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const token = getStaffToken();
  if (!token) redirect("/login?type=platform");

  const hotel = await getHotel(token, hotelId);
  if (!hotel) redirect("/platform/hotels");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/platform/hotels/${encodeURIComponent(hotelId)}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Property setup</p>
            <h1 className="text-2xl font-semibold">{hotel.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{hotel.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant={hotel.isActive ? "default" : "secondary"}>{hotel.isActive ? "Active" : "Inactive"}</Badge>
          <Badge variant="outline" className="gap-1">
            <Settings2 className="h-3 w-3" />
            Setup
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-3">
          <Card className="p-4">
            <PropertySetupNav hotelId={hotelId} />
          </Card>
          <Separator className="lg:hidden" />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}

