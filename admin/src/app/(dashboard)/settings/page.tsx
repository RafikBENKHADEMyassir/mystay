"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Palette, MapPin, Globe, Save, Users, Upload, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

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
};

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

const hotelSettingsCopy = {
  en: {
    failedLoad: "Failed to load hotel settings",
    failedUpload: "Failed to upload file",
    failedSave: "Failed to save settings",
    savedSuccess: "Settings saved successfully",
    loading: "Loading settings...",
    title: "Hotel Settings",
    subtitle: "Customize your hotel's branding and information.",
    manageStaff: "Manage Staff",
    previewHint: "This is how your hotel appears to guests in the app",
    basicInformation: "Basic Information",
    hotelName: "Hotel Name",
    description: "Description",
    starRating: "Star Rating",
    selectRating: "Select rating",
    starSingular: "Star",
    starPlural: "Stars",
    currency: "Currency",
    branding: "Branding",
    brandingDescription: "Visual identity shown to guests",
    logo: "Logo",
    coverImage: "Cover Image",
    uploading: "Uploading...",
    uploadLogo: "Upload Logo",
    uploadCoverImage: "Upload Cover Image",
    fileHint: "JPEG, PNG, WebP, or SVG. Max 5MB.",
    primaryColor: "Primary Color",
    accentColor: "Accent Color",
    location: "Location",
    address: "Address",
    city: "City",
    country: "Country",
    timezone: "Timezone",
    contactInformation: "Contact Information",
    email: "Email",
    phone: "Phone",
    website: "Website",
    saving: "Saving...",
    saveChanges: "Save Changes",
    placeholders: {
      logoAlt: "Hotel logo",
      logoPreviewAlt: "Logo preview",
      coverPreviewAlt: "Cover preview",
      previewHotelName: "Hotel Name",
      hotelName: "Hotel name",
      description: "A brief description...",
      address: "Street address",
      city: "City",
      country: "Country",
      email: "contact@hotel.com",
      phone: "+33 1 23 45 67 89",
      website: "https://www.hotel.com",
    },
  },
  fr: {
    failedLoad: "Impossible de charger les parametres de l'hotel",
    failedUpload: "Impossible de telecharger le fichier",
    failedSave: "Impossible d'enregistrer les parametres",
    savedSuccess: "Parametres enregistres avec succes",
    loading: "Chargement des parametres...",
    title: "Parametres de l'hotel",
    subtitle: "Personnalisez l'image de marque et les informations de votre hotel.",
    manageStaff: "Gerer le personnel",
    previewHint: "Voici comment votre hotel apparait aux clients dans l'application",
    basicInformation: "Informations de base",
    hotelName: "Nom de l'hotel",
    description: "Description",
    starRating: "Classement etoiles",
    selectRating: "Selectionner classement",
    starSingular: "Etoile",
    starPlural: "Etoiles",
    currency: "Devise",
    branding: "Image de marque",
    brandingDescription: "Identite visuelle affichee aux clients",
    logo: "Logo",
    coverImage: "Image de couverture",
    uploading: "Telechargement...",
    uploadLogo: "Telecharger logo",
    uploadCoverImage: "Telecharger image de couverture",
    fileHint: "JPEG, PNG, WebP ou SVG. Max 5MB.",
    primaryColor: "Couleur principale",
    accentColor: "Couleur d'accent",
    location: "Localisation",
    address: "Adresse",
    city: "Ville",
    country: "Pays",
    timezone: "Fuseau horaire",
    contactInformation: "Informations de contact",
    email: "Email",
    phone: "Telephone",
    website: "Site web",
    saving: "Enregistrement...",
    saveChanges: "Enregistrer modifications",
    placeholders: {
      logoAlt: "Logo hotel",
      logoPreviewAlt: "Apercu logo",
      coverPreviewAlt: "Apercu couverture",
      previewHotelName: "Nom de l'hotel",
      hotelName: "Nom de l'hotel",
      description: "Une breve description...",
      address: "Adresse",
      city: "Ville",
      country: "Pays",
      email: "contact@hotel.com",
      phone: "+33 1 23 45 67 89",
      website: "https://www.hotel.com",
    },
  },
  es: {
    failedLoad: "No se pudo cargar la configuracion del hotel",
    failedUpload: "No se pudo subir el archivo",
    failedSave: "No se pudo guardar la configuracion",
    savedSuccess: "Configuracion guardada correctamente",
    loading: "Cargando configuracion...",
    title: "Configuracion del hotel",
    subtitle: "Personaliza la marca y la informacion de tu hotel.",
    manageStaff: "Gestionar personal",
    previewHint: "Asi aparece tu hotel para los huespedes en la app",
    basicInformation: "Informacion basica",
    hotelName: "Nombre del hotel",
    description: "Descripcion",
    starRating: "Calificacion por estrellas",
    selectRating: "Seleccionar calificacion",
    starSingular: "Estrella",
    starPlural: "Estrellas",
    currency: "Moneda",
    branding: "Marca",
    brandingDescription: "Identidad visual mostrada a los huespedes",
    logo: "Logo",
    coverImage: "Imagen de portada",
    uploading: "Subiendo...",
    uploadLogo: "Subir logo",
    uploadCoverImage: "Subir imagen de portada",
    fileHint: "JPEG, PNG, WebP o SVG. Max 5MB.",
    primaryColor: "Color primario",
    accentColor: "Color de acento",
    location: "Ubicacion",
    address: "Direccion",
    city: "Ciudad",
    country: "Pais",
    timezone: "Zona horaria",
    contactInformation: "Informacion de contacto",
    email: "Correo",
    phone: "Telefono",
    website: "Sitio web",
    saving: "Guardando...",
    saveChanges: "Guardar cambios",
    placeholders: {
      logoAlt: "Logo del hotel",
      logoPreviewAlt: "Vista previa del logo",
      coverPreviewAlt: "Vista previa de portada",
      previewHotelName: "Nombre del hotel",
      hotelName: "Nombre del hotel",
      description: "Breve descripcion...",
      address: "Direccion",
      city: "Ciudad",
      country: "Pais",
      email: "contact@hotel.com",
      phone: "+33 1 23 45 67 89",
      website: "https://www.hotel.com",
    },
  },
} as const;

export default function HotelSettingsPage() {
  const pathname = usePathname() ?? "/settings";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = hotelSettingsCopy[locale];

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadHotel() {
      try {
        const response = await fetch("/api/hotel/settings");
        if (!response.ok) {
          throw new Error(t.failedLoad);
        }
        const data = await response.json();
        const h = data.hotel as Hotel;
        setHotel(h);
        setForm({
          name: h.name || "",
          description: h.description || "",
          logoUrl: h.logoUrl || "",
          coverImageUrl: h.coverImageUrl || "",
          primaryColor: h.primaryColor || "#1a1a2e",
          secondaryColor: h.secondaryColor || "#f5a623",
          address: h.address || "",
          city: h.city || "",
          country: h.country || "",
          phone: h.phone || "",
          email: h.email || "",
          website: h.website || "",
          timezone: h.timezone || "Europe/Paris",
          currency: h.currency || "EUR",
          starRating: h.starRating?.toString() || ""
        });
      } catch (err) {
        setError(t.failedLoad);
      } finally {
        setIsLoading(false);
      }
    }
    loadHotel();
  }, [t.failedLoad]);

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
  }

  async function handleFileUpload(file: File, type: "logo" | "cover") {
    const setUploading = type === "logo" ? setIsUploadingLogo : setIsUploadingCover;
    
    try {
      setUploading(true);
      setError(null);

      const formData = new window.FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? t.failedUpload);
      }

      const data = await response.json();
      const field = type === "logo" ? "logoUrl" : "coverImageUrl";
      handleChange(field, data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failedUpload);
    } finally {
      setUploading(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "cover") {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  }

  function clearImage(type: "logo" | "cover") {
    const field = type === "logo" ? "logoUrl" : "coverImageUrl";
    handleChange(field, "");
    if (type === "logo" && logoInputRef.current) {
      logoInputRef.current.value = "";
    } else if (type === "cover" && coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/hotel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
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
        throw new Error(data?.error ?? t.failedSave);
      }

      setSuccess(t.savedSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failedSave);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.subtitle}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/staff">
            <Users className="mr-2 h-4 w-4" />
            {t.manageStaff}
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-600">
            {success}
          </div>
        )}

        {/* Branding Preview */}
        <Card className="overflow-hidden">
          <div
            className="flex h-32 items-center justify-center"
            style={{
              backgroundColor: form.primaryColor,
              backgroundImage: form.coverImageUrl ? `url(${form.coverImageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt={t.placeholders.logoAlt}
                className="h-16 w-auto max-w-[150px] object-contain"
              />
            ) : (
              <span
                className="text-2xl font-bold"
                style={{ color: form.secondaryColor }}
              >
                {form.name || t.placeholders.previewHotelName}
              </span>
            )}
          </div>
          <CardContent className="p-4">
            <p className="text-center text-sm text-muted-foreground">
              {t.previewHint}
            </p>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              {t.basicInformation}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.hotelName}</Label>
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              {t.branding}
            </CardTitle>
            <CardDescription>{t.brandingDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logoFile">{t.logo}</Label>
                <div className="space-y-2">
                  <input
                    ref={logoInputRef}
                    id="logoFile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => handleFileInputChange(e, "logo")}
                    className="hidden"
                  />
                  {form.logoUrl ? (
                    <div className="relative flex items-center gap-2 rounded-md border border-input bg-background p-3">
                      <img
                        src={form.logoUrl}
                        alt={t.placeholders.logoPreviewAlt}
                        className="h-16 w-16 rounded object-contain"
                      />
                      <div className="flex-1 truncate text-sm text-muted-foreground">
                        {form.logoUrl.split("/").pop()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearImage("logo")}
                        disabled={isUploadingLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingLogo ? t.uploading : t.uploadLogo}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.fileHint}
                </p>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="coverFile">{t.coverImage}</Label>
                <div className="space-y-2">
                  <input
                    ref={coverInputRef}
                    id="coverFile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => handleFileInputChange(e, "cover")}
                    className="hidden"
                  />
                  {form.coverImageUrl ? (
                    <div className="relative flex items-center gap-2 rounded-md border border-input bg-background p-3">
                      <img
                        src={form.coverImageUrl}
                        alt={t.placeholders.coverPreviewAlt}
                        className="h-16 w-16 rounded object-cover"
                      />
                      <div className="flex-1 truncate text-sm text-muted-foreground">
                        {form.coverImageUrl.split("/").pop()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearImage("cover")}
                        disabled={isUploadingCover}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingCover ? t.uploading : t.uploadCoverImage}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.fileHint}
                </p>
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
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">{t.accentColor}</Label>
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
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              {t.location}
            </CardTitle>
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
            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label htmlFor="timezone">{t.timezone}</Label>
                <select
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              {t.contactInformation}
            </CardTitle>
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

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? t.saving : t.saveChanges}
          </Button>
        </div>
      </form>
    </div>
  );
}
