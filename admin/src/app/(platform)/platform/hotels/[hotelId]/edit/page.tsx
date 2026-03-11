"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Palette, MapPin, Globe, Star, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

const editHotelCopy = {
  en: {
    hotelNameRequired: "Hotel name is required",
    failedToUpdate: "Failed to update hotel",
    failedToUpdateTryAgain: "Failed to update hotel. Please try again.",
    failedToLoad: "Failed to load hotel data.",
    title: "Edit Hotel",
    subtitle: "Update hotel details and configuration.",
    basicInformation: "Basic Information",
    essentialDetails: "Essential hotel details",
    hotelNameRequiredLabel: "Hotel Name *",
    description: "Description",
    starRating: "Star Rating",
    selectRating: "Select rating",
    starSingular: "Star",
    starPlural: "Stars",
    currency: "Currency",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
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
    saving: "Saving...",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    saved: "Changes saved successfully.",
    imageHint: "Direct link to an image file (.png, .jpg, .svg). Not a web page URL.",
    imageWarning: "This URL does not look like an image. Use a direct link to an image file.",
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
    failedToUpdate: "Impossible de mettre a jour l'hotel",
    failedToUpdateTryAgain: "Impossible de mettre a jour l'hotel. Veuillez reessayer.",
    failedToLoad: "Impossible de charger les donnees de l'hotel.",
    title: "Modifier l'hotel",
    subtitle: "Mettre a jour les details et la configuration de l'hotel.",
    basicInformation: "Informations de base",
    essentialDetails: "Details essentiels de l'hotel",
    hotelNameRequiredLabel: "Nom de l'hotel *",
    description: "Description",
    starRating: "Classement etoiles",
    selectRating: "Selectionner classement",
    starSingular: "Etoile",
    starPlural: "Etoiles",
    currency: "Devise",
    status: "Statut",
    active: "Actif",
    inactive: "Inactif",
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
    saving: "Enregistrement...",
    saveChanges: "Enregistrer",
    cancel: "Annuler",
    saved: "Modifications enregistrees avec succes.",
    imageHint: "Lien direct vers un fichier image (.png, .jpg, .svg). Pas une URL de page web.",
    imageWarning: "Cette URL ne semble pas etre une image. Utilisez un lien direct vers un fichier image.",
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
    failedToUpdate: "No se pudo actualizar el hotel",
    failedToUpdateTryAgain: "No se pudo actualizar el hotel. Intentalo de nuevo.",
    failedToLoad: "No se pudieron cargar los datos del hotel.",
    title: "Editar hotel",
    subtitle: "Actualizar detalles y configuracion del hotel.",
    basicInformation: "Informacion basica",
    essentialDetails: "Detalles esenciales del hotel",
    hotelNameRequiredLabel: "Nombre del hotel *",
    description: "Descripcion",
    starRating: "Calificacion por estrellas",
    selectRating: "Seleccionar calificacion",
    starSingular: "Estrella",
    starPlural: "Estrellas",
    currency: "Moneda",
    status: "Estado",
    active: "Activo",
    inactive: "Inactivo",
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
    saving: "Guardando...",
    saveChanges: "Guardar cambios",
    cancel: "Cancelar",
    saved: "Cambios guardados correctamente.",
    imageHint: "Enlace directo a un archivo de imagen (.png, .jpg, .svg). No una URL de pagina web.",
    imageWarning: "Esta URL no parece ser una imagen. Usa un enlace directo a un archivo de imagen.",
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

function looksLikeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico|avif)$/.test(path)) return true;
    if (parsed.hostname.includes("unsplash.com")) return true;
    if (parsed.hostname.includes("cloudinary.com")) return true;
    if (parsed.hostname.includes("imgur.com")) return true;
    if (parsed.searchParams.has("w") || parsed.searchParams.has("fit")) return true;
    if (path.endsWith("/") && path !== "/") return false;
    return true;
  } catch {
    return false;
  }
}

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
  isActive: boolean;
};

export default function EditHotelPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { hotelId } = useParams<{ hotelId: string }>();
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = editHotelCopy[locale];

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    starRating: "",
    isActive: true,
  });

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch(`/api/platform/hotels/${hotelId}`);
        if (!res.ok) {
          setError(t.failedToLoad);
          setIsFetching(false);
          return;
        }
        const data = await res.json();
        const h = data.hotel;
        if (!h) {
          setError(t.failedToLoad);
          setIsFetching(false);
          return;
        }
        setForm({
          name: h.name ?? "",
          description: h.description ?? "",
          logoUrl: h.logoUrl ?? "",
          coverImageUrl: h.coverImageUrl ?? "",
          primaryColor: h.primaryColor ?? "#1a1a2e",
          secondaryColor: h.secondaryColor ?? "#f5a623",
          address: h.address ?? "",
          city: h.city ?? "",
          country: h.country ?? "",
          phone: h.phone ?? "",
          email: h.email ?? "",
          website: h.website ?? "",
          timezone: h.timezone ?? "Europe/Paris",
          currency: h.currency ?? "EUR",
          starRating: h.starRating != null ? String(h.starRating) : "",
          isActive: h.isActive ?? true,
        });
      } catch {
        setError(t.failedToLoad);
      } finally {
        setIsFetching(false);
      }
    }
    fetchHotel();
  }, [hotelId, t.failedToLoad]);

  function handleChange(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
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
    setSuccess(null);

    try {
      const response = await fetch(`/api/platform/hotels/${hotelId}`, {
        method: "PATCH",
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
          starRating: form.starRating ? parseInt(form.starRating, 10) : null,
          isActive: form.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? t.failedToUpdate);
        return;
      }

      setSuccess(t.saved);
    } catch {
      setError(t.failedToUpdateTryAgain);
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/platform/hotels/${hotelId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
            {success}
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
            <div className="grid gap-4 md:grid-cols-3">
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
                  <option value="EUR">EUR</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="MAD">MAD</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t.status}</Label>
                <button
                  type="button"
                  onClick={() => handleChange("isActive", !form.isActive)}
                  className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {form.isActive ? (
                    <ToggleRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Badge variant={form.isActive ? "default" : "secondary"}>
                    {form.isActive ? t.active : t.inactive}
                  </Badge>
                </button>
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
                <p className="text-xs text-muted-foreground">{t.imageHint}</p>
                {form.logoUrl.trim() && !looksLikeImageUrl(form.logoUrl.trim()) && (
                  <p className="text-xs text-destructive">{t.imageWarning}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">{t.coverImageUrl}</Label>
                <Input
                  id="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={(e) => handleChange("coverImageUrl", e.target.value)}
                  placeholder={t.placeholders.url}
                />
                <p className="text-xs text-muted-foreground">{t.imageHint}</p>
                {form.coverImageUrl.trim() && !looksLikeImageUrl(form.coverImageUrl.trim()) && (
                  <p className="text-xs text-destructive">{t.imageWarning}</p>
                )}
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
                <option value="Europe/Zurich">Europe/Zurich</option>
                <option value="Europe/Rome">Europe/Rome</option>
                <option value="Africa/Casablanca">Africa/Casablanca</option>
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
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              t.saveChanges
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}`}>{t.cancel}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
