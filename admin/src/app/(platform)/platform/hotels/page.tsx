import Link from "next/link";
import { Plus, Building2, MapPin, Star, MoreHorizontal } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type Hotel = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  city: string | null;
  country: string | null;
  starRating: number | null;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
};

async function getHotels(token: string): Promise<Hotel[]> {
  try {
    const response = await fetch(`${backendUrl}/api/v1/admin/hotels`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function HotelsListPage() {
  const token = getStaffToken();
  const hotels = token ? await getHotels(token) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hotels</h1>
          <p className="text-muted-foreground">
            Manage partner hotels on the MyStay platform.
          </p>
        </div>
        <Button asChild>
          <Link href="/platform/hotels/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Hotel
          </Link>
        </Button>
      </div>

      {hotels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No hotels yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Get started by adding your first partner hotel.
            </p>
            <Button asChild>
              <Link href="/platform/hotels/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Hotel
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Link key={hotel.id} href={`/platform/hotels/${hotel.id}`}>
              <Card className="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50">
                {/* Cover Image */}
                <div 
                  className="h-32 w-full"
                  style={{ 
                    backgroundColor: hotel.primaryColor ?? "#1a1a2e",
                    backgroundImage: hotel.coverImageUrl ? `url(${hotel.coverImageUrl})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  {hotel.logoUrl && (
                    <div className="flex h-full items-center justify-center">
                      <img 
                        src={hotel.logoUrl} 
                        alt={hotel.name}
                        className="h-16 w-auto max-w-[120px] object-contain"
                      />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{hotel.name}</CardTitle>
                      {(hotel.city || hotel.country) && (
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[hotel.city, hotel.country].filter(Boolean).join(", ")}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={hotel.isActive ? "default" : "secondary"}>
                      {hotel.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    {hotel.starRating && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {hotel.starRating} stars
                      </div>
                    )}
                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        · {hotel.amenities.length} amenities
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
