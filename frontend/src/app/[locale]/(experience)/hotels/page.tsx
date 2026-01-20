"use client";

import { useState, useEffect } from "react";
import { MapPin, Star, Wifi, Utensils, Dumbbell, Waves, ArrowRight, Search, Building2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { getHotelsStrings } from "@/lib/i18n/hotels";
import { withLocale } from "@/lib/i18n/paths";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900/20 border-b border-slate-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_50%)]" />
        <div className="container relative py-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
              {t.pageTitle}
            </h1>
            <p className="text-lg text-slate-300 mb-6">
              {t.pageDescription}
            </p>
            {!isAuthenticated && (
              <div className="flex gap-3 flex-wrap">
                <Link href={withLocale(locale, "/signup")}>
                  <Button className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={withLocale(locale, "/login")}>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="container py-4">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 space-y-12 flex-1">
        {/* Featured Hotels */}
        {featuredHotels.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              {t.featuredSection}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredHotels.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                  <div className="aspect-video relative bg-gradient-to-br from-slate-700 to-slate-800">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                      <Building2 className="h-16 w-16" />
                    </div>
                    <Badge className="absolute top-4 right-4 bg-amber-500 text-slate-900">
                      {t.featured}
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white">{hotel.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1 text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {hotel.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-white">{hotel.rating}</span>
                        <span className="text-xs text-slate-400">
                          ({hotel.reviewCount} {t.reviews})
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-4">{hotel.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {hotel.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="gap-1 border-slate-600 text-slate-300">
                          {amenityIcons[amenity]}
                          {t.amenities[amenity as keyof typeof t.amenities]}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-slate-700 pt-4">
                    <span className="text-sm font-medium text-slate-300">{hotel.priceRange}</span>
                    <Button className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                      {t.viewDetails}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Other Hotels */}
        {otherHotels.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-white">{t.allPropertiesSection}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherHotels.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden flex flex-col bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                  <div className="aspect-video relative bg-gradient-to-br from-slate-700 to-slate-800">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                      <Building2 className="h-12 w-12" />
                    </div>
                  </div>
                  <CardHeader className="flex-1">
                    <CardTitle className="text-base text-white">{hotel.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {hotel.location}
                    </CardDescription>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-white">{hotel.rating}</span>
                      <span className="text-xs text-slate-400">
                        ({hotel.reviewCount} {t.reviews})
                      </span>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col gap-3 border-t border-slate-700 pt-4">
                    <div className="flex items-center gap-2 flex-wrap w-full">
                      {hotel.amenities.slice(0, 3).map((amenity) => (
                        <div key={amenity} className="text-slate-400">
                          {amenityIcons[amenity]}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                      {t.viewDetails}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* No results */}
        {filteredHotels.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-slate-500" />
            <h3 className="mt-4 text-lg font-medium text-white">{t.noResultsTitle}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {t.noResultsDescription}
            </p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="border-t border-slate-700 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10">
          <div className="container py-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to experience your stay?
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Create an account to unlock exclusive services, digital room keys, and personalized experiences.
            </p>
            <Link href={withLocale(locale, "/signup")}>
              <Button size="lg" className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
