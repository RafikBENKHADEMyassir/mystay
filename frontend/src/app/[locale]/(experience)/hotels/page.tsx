"use client";

import { useState } from "react";
import { MapPin, Star, Wifi, Utensils, Dumbbell, Waves, Search, Building2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { getHotelsStrings } from "@/lib/i18n/hotels";

type Hotel = {
  id: string;
  name: string;
  location: string;
  description: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  amenities: string[];
  priceRange: string;
  featured: boolean;
};

// Mock hotels data - would come from API in production
const mockHotels: Hotel[] = [
  {
    id: "hotel-paris",
    name: "Grand Hotel MySTAY Paris",
    location: "Paris, France",
    description: "Luxury hotel in the heart of Paris with stunning Eiffel Tower views",
    rating: 4.8,
    reviewCount: 1240,
    imageUrl: "/placeholder-hotel-1.jpg",
    amenities: ["wifi", "restaurant", "gym", "spa"],
    priceRange: "$$$",
    featured: true
  },
  {
    id: "hotel-maldives",
    name: "MySTAY Beach Resort",
    location: "Maldives",
    description: "Exclusive beachfront resort with overwater villas and world-class service",
    rating: 4.9,
    reviewCount: 856,
    imageUrl: "/placeholder-hotel-2.jpg",
    amenities: ["wifi", "restaurant", "gym", "spa", "pool"],
    priceRange: "$$$$",
    featured: true
  },
  {
    id: "hotel-nyc",
    name: "MySTAY City Center",
    location: "New York, USA",
    description: "Modern urban hotel perfect for business and leisure travelers",
    rating: 4.6,
    reviewCount: 2100,
    imageUrl: "/placeholder-hotel-3.jpg",
    amenities: ["wifi", "restaurant", "gym"],
    priceRange: "$$",
    featured: false
  },
  {
    id: "hotel-alps",
    name: "MySTAY Mountain Lodge",
    location: "Swiss Alps, Switzerland",
    description: "Cozy alpine retreat with panoramic mountain views and ski access",
    rating: 4.7,
    reviewCount: 680,
    imageUrl: "/placeholder-hotel-4.jpg",
    amenities: ["wifi", "restaurant", "spa"],
    priceRange: "$$$",
    featured: false
  },
  {
    id: "hotel-tokyo",
    name: "MySTAY Tokyo Tower",
    location: "Tokyo, Japan",
    description: "Contemporary hotel with stunning city views and traditional Japanese hospitality",
    rating: 4.7,
    reviewCount: 1890,
    imageUrl: "/placeholder-hotel-5.jpg",
    amenities: ["wifi", "restaurant", "gym", "spa"],
    priceRange: "$$$",
    featured: false
  },
  {
    id: "hotel-dubai",
    name: "MySTAY Marina Dubai",
    location: "Dubai, UAE",
    description: "Ultra-luxury waterfront hotel with world-class amenities and service",
    rating: 4.9,
    reviewCount: 2340,
    imageUrl: "/placeholder-hotel-6.jpg",
    amenities: ["wifi", "restaurant", "gym", "spa", "pool"],
    priceRange: "$$$$",
    featured: false
  }
];

export default function HotelsPage() {
  const locale = useLocale();
  const t = getHotelsStrings(locale);
  const [searchQuery, setSearchQuery] = useState("");
  const [hotels] = useState<Hotel[]>(mockHotels);

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    restaurant: <Utensils className="h-4 w-4" />,
    gym: <Dumbbell className="h-4 w-4" />,
    spa: <Waves className="h-4 w-4" />,
    pool: <Waves className="h-4 w-4" />
  };

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredHotels = filteredHotels.filter((h) => h.featured);
  const otherHotels = filteredHotels.filter((h) => !h.featured);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.pageTitle}
        description={t.pageDescription}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        }
      />

      {/* Featured Hotels */}
      {featuredHotels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t.featuredSection}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredHotels.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Building2 className="h-16 w-16" />
                  </div>
                  <Badge className="absolute top-3 right-3">
                    {t.featured}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{hotel.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {hotel.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold">{hotel.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({hotel.reviewCount})
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{hotel.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {hotel.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="gap-1">
                        {amenityIcons[amenity]}
                        {t.amenities[amenity as keyof typeof t.amenities]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm font-medium text-muted-foreground">{hotel.priceRange}</span>
                  <Button size="sm">
                    {t.viewDetails}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Hotels */}
      {otherHotels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t.allPropertiesSection}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherHotels.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Building2 className="h-12 w-12" />
                  </div>
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="text-base">{hotel.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hotel.location}
                  </CardDescription>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-sm font-medium">{hotel.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({hotel.reviewCount})
                    </span>
                  </div>
                </CardHeader>
                <CardFooter className="flex-col gap-3 border-t pt-4">
                  <div className="flex items-center gap-2 flex-wrap w-full">
                    {hotel.amenities.slice(0, 3).map((amenity) => (
                      <div key={amenity} className="text-muted-foreground">
                        {amenityIcons[amenity]}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline" size="sm">
                    {t.viewDetails}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {filteredHotels.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noResultsTitle}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {t.noResultsDescription}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
