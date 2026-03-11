"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Shield, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

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

const staffNewCopy = {
  en: {
    title: "Add Staff Member",
    subtitle: "Create a new staff account for this hotel.",
    accountInformation: "Account Information",
    accountInformationDescription: "Login credentials for the staff member",
    email: "Email *",
    password: "Password *",
    displayName: "Display Name",
    emailPlaceholder: "staff@hotel.com",
    passwordPlaceholder: "At least 6 characters",
    displayNamePlaceholder: "John Doe",
    role: "Role",
    roleDescription: "Choose the access level for this staff member",
    departments: "Departments",
    departmentsDescription: "Select departments this staff member can access",
    departmentsDescriptionAdminSuffix: "(admins have access to all departments)",
    creating: "Creating...",
    createStaffMember: "Create Staff Member",
    cancel: "Cancel",
    errors: {
      emailPasswordRequired: "Email and password are required",
      passwordLength: "Password must be at least 6 characters",
      createFailed: "Failed to create staff member",
      createFailedRetry: "Failed to create staff member. Please try again.",
    },
    roles: {
      admin: {
        label: "Admin",
        description: "Full access to all hotel features and staff management",
      },
      manager: {
        label: "Manager",
        description: "Can manage departments and view reports",
      },
      staff: {
        label: "Staff",
        description: "Access to assigned department features",
      },
    },
  },
  fr: {
    title: "Ajouter membre staff",
    subtitle: "Creez un nouveau compte staff pour cet hotel.",
    accountInformation: "Informations du compte",
    accountInformationDescription: "Identifiants de connexion du membre staff",
    email: "Email *",
    password: "Mot de passe *",
    displayName: "Nom affiche",
    emailPlaceholder: "staff@hotel.com",
    passwordPlaceholder: "Au moins 6 caracteres",
    displayNamePlaceholder: "John Doe",
    role: "Role",
    roleDescription: "Choisissez le niveau d'acces de ce membre staff",
    departments: "Departements",
    departmentsDescription: "Selectionnez les departements accessibles",
    departmentsDescriptionAdminSuffix: "(les admins ont acces a tous les departements)",
    creating: "Creation...",
    createStaffMember: "Creer membre staff",
    cancel: "Annuler",
    errors: {
      emailPasswordRequired: "Email et mot de passe sont obligatoires",
      passwordLength: "Le mot de passe doit avoir au moins 6 caracteres",
      createFailed: "Echec de creation du membre staff",
      createFailedRetry: "Echec de creation du membre staff. Reessayez.",
    },
    roles: {
      admin: {
        label: "Admin",
        description: "Acces complet aux fonctionnalites hotel et gestion du staff",
      },
      manager: {
        label: "Manager",
        description: "Peut gerer les departements et voir les rapports",
      },
      staff: {
        label: "Staff",
        description: "Acces aux fonctionnalites des departements assignes",
      },
    },
  },
  es: {
    title: "Agregar miembro staff",
    subtitle: "Crea una nueva cuenta staff para este hotel.",
    accountInformation: "Informacion de la cuenta",
    accountInformationDescription: "Credenciales de acceso del miembro staff",
    email: "Email *",
    password: "Contrasena *",
    displayName: "Nombre visible",
    emailPlaceholder: "staff@hotel.com",
    passwordPlaceholder: "Minimo 6 caracteres",
    displayNamePlaceholder: "John Doe",
    role: "Rol",
    roleDescription: "Elige el nivel de acceso para este miembro staff",
    departments: "Departamentos",
    departmentsDescription: "Selecciona los departamentos que puede usar",
    departmentsDescriptionAdminSuffix: "(los admins tienen acceso a todos los departamentos)",
    creating: "Creando...",
    createStaffMember: "Crear miembro staff",
    cancel: "Cancelar",
    errors: {
      emailPasswordRequired: "Email y contrasena son obligatorios",
      passwordLength: "La contrasena debe tener al menos 6 caracteres",
      createFailed: "Error al crear miembro staff",
      createFailedRetry: "No se pudo crear el miembro staff. Intenta nuevamente.",
    },
    roles: {
      admin: {
        label: "Admin",
        description: "Acceso completo a todas las funciones del hotel y gestion de staff",
      },
      manager: {
        label: "Manager",
        description: "Puede gestionar departamentos y ver reportes",
      },
      staff: {
        label: "Staff",
        description: "Acceso a funciones de departamentos asignados",
      },
    },
  },
} as const;

const ROLE_VALUES = ["admin", "manager", "staff"] as const;

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
  const pathname = usePathname() ?? `/platform/hotels/${hotelId}/staff/new`;
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = staffNewCopy[locale];
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
      setError(t.errors.emailPasswordRequired);
      return;
    }

    if (form.password.length < 6) {
      setError(t.errors.passwordLength);
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
        setError(data?.error ?? t.errors.createFailed);
        return;
      }

      router.push(`/platform/hotels/${hotelId}`);
      router.refresh();
    } catch {
      setError(t.errors.createFailedRetry);
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

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.accountInformation}
            </CardTitle>
            <CardDescription>{t.accountInformationDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t.emailPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={t.passwordPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t.displayName}</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder={t.displayNamePlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        {/* Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.role}
            </CardTitle>
            <CardDescription>{t.roleDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROLE_VALUES.map((role) => (
              <label
                key={role}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  form.role === role
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={form.role === role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{t.roles[role].label}</p>
                  <p className="text-sm text-muted-foreground">{t.roles[role].description}</p>
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
              {t.departments}
            </CardTitle>
            <CardDescription>
              {t.departmentsDescription}
              {form.role === "admin" && ` ${t.departmentsDescriptionAdminSuffix}`}
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
            {isLoading ? t.creating : t.createStaffMember}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/platform/hotels/${hotelId}`}>{t.cancel}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
