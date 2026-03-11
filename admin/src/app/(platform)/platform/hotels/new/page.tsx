"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Palette, MapPin, Globe, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const newHotelCopy = {
  en: {
    hotelNameRequired: "Hotel name is required",
    failedToCreateHotel: "Failed to create hotel",
    failedToCreateTryAgain: "Failed to create hotel. Please try again.",
    title: "Add New Hotel",
    subtitle: "Onboard a new partner hotel to the MyStay platform.",
    basicInformation: "Basic Information",
    essentialDetails: "Essential hotel details",
    hotelNameRequiredLabel: "Hotel Name *",
    description: "Description",
    starRating: "Star Rating",
    selectRating: "Select rating",
    starSingular: "Star",
    starPlural: "Stars",
    currency: "Currency",
    branding: "Branding",
    visualIdentity: "Visual identity and customization",
    logoUrl: "Logo URL",
    coverImageUrl: "Cover Image URL",
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    preview: "Preview",
    location: "Location",
    locationDetails: "Hotel address and location details",
    address: "Address",
    city: "City",
    country: "Country",
    timezone: "Timezone",
    contact: "Contact",
    contactInfo: "Hotel contact information",
    email: "Email",
    phone: "Phone",
    website: "Website",
    creating: "Creating...",
    createHotel: "Create Hotel",
    cancel: "Cancel",
    placeholders: {
      hotelName: "e.g., Grand Hotel Paris",
      description: "A brief description of the hotel...",
      url: "https://...",
      primaryColor: "#1a1a2e",
      secondaryColor: "#f5a623",
      previewHotelName: "Hotel Name",
      address: "123 Avenue des Champs-Elysees",
      city: "Paris",
      country: "France",
      email: "contact@hotel.com",
      phone: "+33 1 23 45 67 89",
      website: "https://www.hotel.com",
    },
  },
  fr: {
    hotelNameRequired: "Le nom de l'hotel est requis",
    failedToCreateHotel: "Impossible de creer l'hotel",
    failedToCreateTryAgain: "Impossible de creer l'hotel. Veuillez reessayer.",
    title: "Ajouter un nouvel hotel",
    subtitle: "Integrer un nouvel hotel partenaire a la plateforme MyStay.",
    basicInformation: "Informations de base",
    essentialDetails: "Details essentiels de l'hotel",
    hotelNameRequiredLabel: "Nom de l'hotel *",
    description: "Description",
    starRating: "Classement etoiles",
    selectRating: "Selectionner classement",
    starSingular: "Etoile",
    starPlural: "Etoiles",
    currency: "Devise",
    branding: "Identite visuelle",
    visualIdentity: "Identite visuelle et personnalisation",
    logoUrl: "URL du logo",
    coverImageUrl: "URL de l'image de couverture",
    primaryColor: "Couleur principale",
    secondaryColor: "Couleur secondaire",
    preview: "Apercu",
    location: "Localisation",
    locationDetails: "Adresse et details de localisation de l'hotel",
    address: "Adresse",
    city: "Ville",
    country: "Pays",
    timezone: "Fuseau horaire",
    contact: "Contact",
    contactInfo: "Informations de contact de l'hotel",
    email: "Email",
    phone: "Telephone",
    website: "Site web",
    creating: "Creation...",
    createHotel: "Creer hotel",
    cancel: "Annuler",
    placeholders: {
      hotelName: "ex: Grand Hotel Paris",
      description: "Une breve description de l'hotel...",
      url: "https://...",
      primaryColor: "#1a1a2e",
      secondaryColor: "#f5a623",
      previewHotelName: "Nom de l'hotel",
      address: "123 Avenue des Champs-Elysees",
      city: "Paris",
      country: "France",
      email: "contact@hotel.com",
      phone: "+33 1 23 45 67 89",
      website: "https://www.hotel.com",
    },
  },
  es: {
    hotelNameRequired: "El nombre del hotel es obligatorio",
    failedToCreateHotel: "No se pudo crear el hotel",
    failedToCreateTryAgain: "No se pudo crear el hotel. Intentalo de nuevo.",
    title: "Agregar nuevo hotel",
    subtitle: "Incorpora un nuevo hotel socio a la plataforma MyStay.",
    basicInformation: "Informacion basica",
    essentialDetails: "Detalles esenciales del hotel",
    hotelNameRequiredLabel: "Nombre del hotel *",
    description: "Descripcion",
    starRating: "Calificacion por estrellas",
    selectRating: "Seleccionar calificacion",
    starSingular: "Estrella",
    starPlural: "Estrellas",
    currency: "Moneda",
    branding: "Marca",
    visualIdentity: "Identidad visual y personalizacion",
    logoUrl: "URL del logo",
    coverImageUrl: "URL de imagen de portada",
    primaryColor: "Color primario",
    secondaryColor: "Color secundario",
    preview: "Vista previa",
    location: "Ubicacion",
    locationDetails: "Direccion y detalles de ubicacion del hotel",
    address: "Direccion",
    city: "Ciudad",
    country: "Pais",
    timezone: "Zona horaria",
    contact: "Contacto",
    contactInfo: "Informacion de contacto del hotel",
    email: "Correo",
    phone: "Telefono",
    website: "Sitio web",
    creating: "Creando...",
    createHotel: "Crear hotel",
    cancel: "Cancelar",
    placeholders: {
      hotelName: "ej., Grand Hotel Paris",
      description: "Breve descripcion del hotel...",
      url: "https://...",
      primaryColor: "#1a1a2e",
      secondaryColor: "#f5a623",
      previewHotelName: "Nombre del hotel",
      address: "123 Avenue des Champs-Elysees",
      city: "Paris",
      country: "Francia",
      email: "contact@hotel.com",
      phone: "+33 1 23 45 67 89",
      website: "https://www.hotel.com",
    },
  },
} as const;

type FormData = {
  name: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  currency: string;
  starRating: string;
};

export default function NewHotelPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/platform/hotels/new";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = newHotelCopy[locale];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    logoUrl: "",
    coverImageUrl: "",
    primaryColor: "#1a1a2e",
    secondaryColor: "#f5a623",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    timezone: "Europe/Paris",
    currency: "EUR",
    starRating: ""
  });

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    if (!form.name.trim()) {
      setError(t.hotelNameRequired);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/platform/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          coverImageUrl: form.coverImageUrl.trim() || null,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          website: form.website.trim() || null,
          timezone: form.timezone,
          currency: form.currency,
          starRating: form.starRating ? parseInt(form.starRating, 10) : null
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? t.failedToCreateHotel);
        return;
      }

      const data = await response.json();
      router.push(`/platform/hotels/${data.hotel.id}`);
    } catch {
      setError(t.failedToCreateTryAgain);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/platform/hotels">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">
            {t.subtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t.basicInformation}
            </CardTitle>
            <CardDescription>{t.essentialDetails}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.hotelNameRequiredLabel}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t.placeholders.hotelName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder={t.placeholders.description}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starRating">{t.starRating}</Label>
                <select
                  id="starRating"
                  value={form.starRating}
                  onChange={(e) => handleChange("starRating", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">{t.selectRating}</option>
                  <option value="1">1 {t.starSingular}</option>
                  <option value="2">2 {t.starPlural}</option>
                  <option value="3">3 {t.starPlural}</option>
                  <option value="4">4 {t.starPlural}</option>
                  <option value="5">5 {t.starPlural}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{t.currency}</Label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t.branding}
            </CardTitle>
            <CardDescription>{t.visualIdentity}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">{t.logoUrl}</Label>
                <Input
                  id="logoUrl"
                  value={form.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder={t.placeholders.url}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">{t.coverImageUrl}</Label>
                <Input
                  id="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={(e) => handleChange("coverImageUrl", e.target.value)}
                  placeholder={t.placeholders.url}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t.primaryColor}</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    placeholder={t.placeholders.primaryColor}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">{t.secondaryColor}</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.secondaryColor}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    placeholder={t.placeholders.secondaryColor}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="space-y-2">
              <Label>{t.preview}</Label>
              <div
                className="flex h-24 items-center justify-center rounded-lg"
                style={{ backgroundColor: form.primaryColor }}
              >
                <span
                  className="text-lg font-semibold"
                  style={{ color: form.secondaryColor }}
                >
                  {form.name || t.placeholders.previewHotelName}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.location}
            </CardTitle>
            <CardDescription>{t.locationDetails}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t.address}</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder={t.placeholders.address}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">{t.city}</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder={t.placeholders.city}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t.country}</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder={t.placeholders.country}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t.timezone}</Label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t.contact}
            </CardTitle>
            <CardDescription>{t.contactInfo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={t.placeholders.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder={t.placeholders.phone}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t.website}</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder={t.placeholders.website}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t.creating : t.createHotel}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/platform/hotels">{t.cancel}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
