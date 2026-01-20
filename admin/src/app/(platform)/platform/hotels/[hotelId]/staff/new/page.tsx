"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Shield, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEPARTMENTS = [
  "reception",
  "concierge",
  "housekeeping",
  "restaurant",
  "room_service",
  "spa",
  "gym",
  "maintenance"
];

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all hotel features and staff management" },
  { value: "manager", label: "Manager", description: "Can manage departments and view reports" },
  { value: "staff", label: "Staff", description: "Access to assigned department features" }
];

type FormData = {
  email: string;
  password: string;
  displayName: string;
  role: string;
  departments: string[];
};

export default function NewStaffPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
    displayName: "",
    role: "staff",
    departments: []
  });

  function handleChange(field: keyof Omit<FormData, "departments">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDepartment(dept: string) {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/platform/hotels/${hotelId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          displayName: form.displayName.trim() || null,
          role: form.role,
          departments: form.departments
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Failed to create staff member");
        return;
      }

      router.push(`/platform/hotels/${hotelId}`);
      router.refresh();
    } catch {
      setError("Failed to create staff member. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Add Staff Member</h1>
          <p className="text-muted-foreground">
            Create a new staff account for this hotel.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Login credentials for the staff member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="staff@hotel.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </CardContent>
        </Card>

        {/* Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role
            </CardTitle>
            <CardDescription>Choose the access level for this staff member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROLES.map((role) => (
              <label
                key={role.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  form.role === role.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={form.role === role.value}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Departments
            </CardTitle>
            <CardDescription>
              Select departments this staff member can access
              {form.role === "admin" && " (admins have access to all departments)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {DEPARTMENTS.map((dept) => (
                <label
                  key={dept}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                    form.departments.includes(dept)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  } ${form.role === "admin" ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.departments.includes(dept) || form.role === "admin"}
                    onChange={() => toggleDepartment(dept)}
                    disabled={form.role === "admin"}
                  />
                  <span className="text-sm capitalize">{dept.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Staff Member"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
