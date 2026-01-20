"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Palette, MapPin, Globe, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

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
      setError("Hotel name is required");
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
        setError(data?.error ?? "Failed to create hotel");
        return;
      }

      const data = await response.json();
      router.push(`/platform/hotels/${data.hotel.id}`);
    } catch {
      setError("Failed to create hotel. Please try again.");
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
          <h1 className="text-3xl font-bold tracking-tight">Add New Hotel</h1>
          <p className="text-muted-foreground">
            Onboard a new partner hotel to the MyStay platform.
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
              Basic Information
            </CardTitle>
            <CardDescription>Essential hotel details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hotel Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Grand Hotel Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="A brief description of the hotel..."
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
              Branding
            </CardTitle>
            <CardDescription>Visual identity and customization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={form.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={(e) => handleChange("coverImageUrl", e.target.value)}
                  placeholder="https://..."
                />
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
                    placeholder="#1a1a2e"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
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
                    placeholder="#f5a623"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="flex h-24 items-center justify-center rounded-lg"
                style={{ backgroundColor: form.primaryColor }}
              >
                <span
                  className="text-lg font-semibold"
                  style={{ color: form.secondaryColor }}
                >
                  {form.name || "Hotel Name"}
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
              Location
            </CardTitle>
            <CardDescription>Hotel address and location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="123 Avenue des Champs-Élysées"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="France"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
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
              Contact
            </CardTitle>
            <CardDescription>Hotel contact information</CardDescription>
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

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Hotel"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/platform/hotels">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
