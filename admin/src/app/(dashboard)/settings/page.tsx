"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Palette, MapPin, Globe, Save, Users, Upload, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

export default function HotelSettingsPage() {
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
          throw new Error("Failed to load hotel settings");
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
        setError("Failed to load hotel settings");
      } finally {
        setIsLoading(false);
      }
    }
    loadHotel();
  }, []);

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
        throw new Error(data?.error ?? "Failed to upload file");
      }

      const data = await response.json();
      const field = type === "logo" ? "logoUrl" : "coverImageUrl";
      handleChange(field, data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
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
        throw new Error(data?.error ?? "Failed to save settings");
      }

      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hotel Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize your hotel&apos;s branding and information.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/staff">
            <Users className="mr-2 h-4 w-4" />
            Manage Staff
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
                alt="Hotel logo"
                className="h-16 w-auto max-w-[150px] object-contain"
              />
            ) : (
              <span
                className="text-2xl font-bold"
                style={{ color: form.secondaryColor }}
              >
                {form.name || "Hotel Name"}
              </span>
            )}
          </div>
          <CardContent className="p-4">
            <p className="text-center text-sm text-muted-foreground">
              This is how your hotel appears to guests in the app
            </p>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hotel Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Hotel name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="A brief description..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starRating">Star Rating</Label>
                <select
                  id="starRating"
                  value={form.starRating}
                  onChange={(e) => handleChange("starRating", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select rating</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
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
              Branding
            </CardTitle>
            <CardDescription>Visual identity shown to guests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logoFile">Logo</Label>
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
                        alt="Logo preview"
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
                      {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP, or SVG. Max 5MB.
                </p>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="coverFile">Cover Image</Label>
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
                        alt="Cover preview"
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
                      {isUploadingCover ? "Uploading..." : "Upload Cover Image"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP, or SVG. Max 5MB.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
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
                <Label htmlFor="secondaryColor">Accent Color</Label>
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
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
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
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="contact@hotel.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://www.hotel.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
