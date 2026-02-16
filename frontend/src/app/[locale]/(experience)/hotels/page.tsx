"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Wifi, Utensils, Dumbbell, Waves, Search, Building2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { useGuestContent } from "@/lib/hooks/use-guest-content";

type PublicHotel = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  country: string | null;
  starRating: number | null;
  amenities: string[] | null;
  createdAt: string;
};

export default function HotelsPage() {
  const locale = useLocale();
  const { content } = useGuestContent(locale, null);
  const page = content?.pages.hotels;

  const [searchQuery, setSearchQuery] = useState("");
  const [hotels, setHotels] = useState<PublicHotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHotels() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/hotels/public", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setHotels([]);
          return;
        }

        const data = (await response.json()) as { items?: PublicHotel[] };
        if (!cancelled) {
          setHotels(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (!cancelled) setHotels([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadHotels();

    return () => {
      cancelled = true;
    };
  }, []);

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    restaurant: <Utensils className="h-4 w-4" />,
    gym: <Dumbbell className="h-4 w-4" />,
    spa: <Waves className="h-4 w-4" />,
    pool: <Waves className="h-4 w-4" />
  };

  const filteredHotels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return hotels;
    return hotels.filter((hotel) => {
      const name = (hotel.name ?? "").toLowerCase();
      const city = (hotel.city ?? "").toLowerCase();
      const country = (hotel.country ?? "").toLowerCase();
      return name.includes(query) || city.includes(query) || country.includes(query);
    });
  }, [hotels, searchQuery]);

  const featuredCount = Math.max(0, Number(page?.featuredCount ?? 0));
  const featuredHotels = filteredHotels.slice(0, featuredCount);
  const otherHotels = filteredHotels.slice(featuredCount);

  if (!page) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={page.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">{page.searchPlaceholder}</CardContent>
        </Card>
      ) : null}

      {featuredHotels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{page.featuredSection}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredHotels.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {hotel.coverImageUrl ? (
                    <img src={hotel.coverImageUrl} alt={hotel.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Building2 className="h-16 w-16" />
                    </div>
                  )}
                  <Badge className="absolute right-3 top-3">{page.featuredBadge}</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{hotel.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[hotel.city, hotel.country].filter(Boolean).join(", ")}
                      </CardDescription>
                    </div>
                    {hotel.starRating ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-semibold">{hotel.starRating}</span>
                      </div>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hotel.description ? <p className="text-sm text-muted-foreground">{hotel.description}</p> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {(hotel.amenities ?? []).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="gap-1">
                        {amenityIcons[amenity] ?? <Waves className="h-4 w-4" />}
                        {page.amenities[amenity as keyof typeof page.amenities] ?? amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button size="sm" className="w-full">
                    {page.viewDetails}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherHotels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{page.allPropertiesSection}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherHotels.map((hotel) => (
              <Card key={hotel.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {hotel.coverImageUrl ? (
                    <img src={hotel.coverImageUrl} alt={hotel.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Building2 className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="text-base">{hotel.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[hotel.city, hotel.country].filter(Boolean).join(", ")}
                  </CardDescription>
                  {hotel.starRating ? (
                    <div className="mt-2 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="text-sm font-medium">{hotel.starRating}</span>
                    </div>
                  ) : null}
                </CardHeader>
                <CardFooter className="flex-col gap-3 border-t pt-4">
                  <div className="flex w-full flex-wrap items-center gap-2">
                    {(hotel.amenities ?? []).slice(0, 3).map((amenity) => (
                      <div key={amenity} className="text-muted-foreground">
                        {amenityIcons[amenity] ?? <Waves className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline" size="sm">
                    {page.viewDetails}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredHotels.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">{page.noResultsTitle}</h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">{page.noResultsDescription}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
