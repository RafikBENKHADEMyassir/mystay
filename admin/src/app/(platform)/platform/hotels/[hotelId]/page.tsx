import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Star, Users, Settings, Pencil } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type Hotel = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  starRating: number | null;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
};

type StaffMember = {
  id: string;
  hotelId: string;
  email: string;
  displayName: string | null;
  role: string;
  departments: string[];
};

async function getHotel(token: string, hotelId: string): Promise<Hotel | null> {
  try {
    const response = await fetch(`${backendUrl}/api/v1/admin/hotels/${hotelId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.hotel ?? null;
  } catch {
    return null;
  }
}

async function getStaff(token: string, hotelId: string): Promise<StaffMember[]> {
  try {
    const response = await fetch(`${backendUrl}/api/v1/hotels/${hotelId}/staff`, {
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

export default async function HotelDetailPage({
  params
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const token = getStaffToken();
  
  if (!token) {
    redirect("/login?type=platform");
  }

  const [hotel, staff] = await Promise.all([
    getHotel(token, hotelId),
    getStaff(token, hotelId)
  ]);

  if (!hotel) {
    redirect("/platform/hotels");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/platform/hotels">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{hotel.name}</h1>
              <Badge variant={hotel.isActive ? "default" : "secondary"}>
                {hotel.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {(hotel.city || hotel.country) && (
              <p className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[hotel.city, hotel.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/platform/hotels/${hotelId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Hotel
          </Link>
        </Button>
      </div>

      {/* Cover Image / Branding Preview */}
      <Card className="overflow-hidden">
        <div
          className="flex h-48 items-center justify-center"
          style={{
            backgroundColor: hotel.primaryColor ?? "#1a1a2e",
            backgroundImage: hotel.coverImageUrl ? `url(${hotel.coverImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          {hotel.logoUrl ? (
            <img
              src={hotel.logoUrl}
              alt={hotel.name}
              className="h-24 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <span
              className="text-3xl font-bold"
              style={{ color: hotel.secondaryColor }}
            >
              {hotel.name}
            </span>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hotel Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Hotel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hotel.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1">{hotel.description}</p>
              </div>
            )}
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              {hotel.starRating && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Star Rating</p>
                  <p className="mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {hotel.starRating} Stars
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currency</p>
                <p className="mt-1">{hotel.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                <p className="mt-1">{hotel.timezone}</p>
              </div>
              {hotel.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="mt-1">{hotel.phone}</p>
                </div>
              )}
              {hotel.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1">{hotel.email}</p>
                </div>
              )}
              {hotel.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="mt-1 text-primary hover:underline">
                    {hotel.website}
                  </a>
                </div>
              )}
            </div>

            {hotel.address && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="mt-1">{hotel.address}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Staff Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members
              </CardTitle>
              <CardDescription>
                {staff.length} staff member{staff.length !== 1 ? "s" : ""} assigned
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/platform/hotels/${hotelId}/staff/new`}>
                Add Staff
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No staff members assigned yet.
              </p>
            ) : (
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {member.displayName || member.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="mt-1 flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                        {member.departments.slice(0, 3).map((dept) => (
                          <Badge key={dept} variant="secondary" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                        {member.departments.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{member.departments.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/platform/hotels/${hotelId}/staff/${member.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/integrations`}>
              Configure Integrations
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/notifications`}>
              Notification Settings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/staff/new`}>
              Add Staff Member
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
