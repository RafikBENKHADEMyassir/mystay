import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, Building2, MapPin, Star, Users, Settings, Pencil } from "lucide-react";

import { getStaffToken } from "@/lib/staff-token";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const hotelDetailCopy = {
  en: {
    active: "Active",
    inactive: "Inactive",
    propertySetup: "Property setup",
    editHotel: "Edit Hotel",
    hotelInformation: "Hotel Information",
    description: "Description",
    starRating: "Star Rating",
    stars: "Stars",
    currency: "Currency",
    timezone: "Timezone",
    phone: "Phone",
    email: "Email",
    website: "Website",
    address: "Address",
    staffMembers: "Staff Members",
    staffAssigned: "staff member",
    staffAssignedPlural: "staff members",
    assignedSuffix: "assigned",
    addStaff: "Add Staff",
    noStaff: "No staff members assigned yet.",
    edit: "Edit",
    quickActions: "Quick Actions",
    dataSync: "Data synchronization",
    notificationCenter: "Notification center",
    addStaffMember: "Add Staff Member",
  },
  fr: {
    active: "Actif",
    inactive: "Inactif",
    propertySetup: "Configuration hotel",
    editHotel: "Modifier hotel",
    hotelInformation: "Informations hotel",
    description: "Description",
    starRating: "Classement etoiles",
    stars: "Etoiles",
    currency: "Devise",
    timezone: "Fuseau horaire",
    phone: "Telephone",
    email: "Email",
    website: "Site web",
    address: "Adresse",
    staffMembers: "Membres du staff",
    staffAssigned: "membre staff",
    staffAssignedPlural: "membres staff",
    assignedSuffix: "assignes",
    addStaff: "Ajouter staff",
    noStaff: "Aucun membre staff assigne pour le moment.",
    edit: "Modifier",
    quickActions: "Actions rapides",
    dataSync: "Synchronisation des donnees",
    notificationCenter: "Centre de notifications",
    addStaffMember: "Ajouter membre staff",
  },
  es: {
    active: "Activo",
    inactive: "Inactivo",
    propertySetup: "Configuracion de propiedad",
    editHotel: "Editar hotel",
    hotelInformation: "Informacion del hotel",
    description: "Descripcion",
    starRating: "Calificacion por estrellas",
    stars: "Estrellas",
    currency: "Moneda",
    timezone: "Zona horaria",
    phone: "Telefono",
    email: "Email",
    website: "Sitio web",
    address: "Direccion",
    staffMembers: "Miembros del staff",
    staffAssigned: "miembro del staff",
    staffAssignedPlural: "miembros del staff",
    assignedSuffix: "asignados",
    addStaff: "Agregar staff",
    noStaff: "Aun no hay miembros del staff asignados.",
    edit: "Editar",
    quickActions: "Acciones rapidas",
    dataSync: "Sincronizacion de datos",
    notificationCenter: "Centro de notificaciones",
    addStaffMember: "Agregar miembro staff",
  },
} as const;

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
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = hotelDetailCopy[locale];
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
                {hotel.isActive ? t.active : t.inactive}
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/setup`}>
              <Settings className="mr-2 h-4 w-4" />
              {t.propertySetup}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/platform/hotels/${hotelId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t.editHotel}
            </Link>
          </Button>
        </div>
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
              {t.hotelInformation}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hotel.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.description}</p>
                <p className="mt-1">{hotel.description}</p>
              </div>
            )}
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              {hotel.starRating && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.starRating}</p>
                  <p className="mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {hotel.starRating} {t.stars}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.currency}</p>
                <p className="mt-1">{hotel.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.timezone}</p>
                <p className="mt-1">{hotel.timezone}</p>
              </div>
              {hotel.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.phone}</p>
                  <p className="mt-1">{hotel.phone}</p>
                </div>
              )}
              {hotel.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.email}</p>
                  <p className="mt-1">{hotel.email}</p>
                </div>
              )}
              {hotel.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.website}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">{t.address}</p>
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
                {t.staffMembers}
              </CardTitle>
              <CardDescription>
                {staff.length} {staff.length === 1 ? t.staffAssigned : t.staffAssignedPlural} {t.assignedSuffix}
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/platform/hotels/${hotelId}/staff/new`}>
                {t.addStaff}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t.noStaff}
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
                        {t.edit}
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
            {t.quickActions}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/setup/sync`}>
              {t.dataSync}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/setup/notification-center`}>
              {t.notificationCenter}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}/staff/new`}>
              {t.addStaffMember}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
