"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Shield, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

type StaffMember = {
  id: string;
  hotelId: string;
  email: string;
  displayName: string | null;
  role: string;
  departments: string[];
  createdAt: string;
};

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

const ROLE_VALUES = ["admin", "manager", "staff"] as const;

const settingsStaffCopy = {
  en: {
    loading: "Loading staff...",
    title: "Staff Management",
    subtitle: "Manage your hotel's staff members and their access.",
    addStaff: "Add Staff",
    addStaffMember: "Add Staff Member",
    addStaffDescription: "Create a new staff account for your hotel.",
    email: "Email *",
    password: "Password *",
    displayName: "Display Name",
    role: "Role",
    departments: "Departments",
    cancel: "Cancel",
    creating: "Creating...",
    create: "Create",
    staffMembers: "Staff Members",
    noStaff: "No staff members yet. Add your first staff member to get started.",
    staffMember: "staff member",
    staffMembersPlural: "staff members",
    errors: {
      loadStaff: "Failed to load staff members",
      loadStaffShort: "Failed to load staff",
      createStaff: "Failed to create staff",
      deleteStaff: "Failed to delete staff member",
      emailPasswordRequired: "Email and password are required",
      removeConfirm: "Are you sure you want to remove this staff member?",
    },
    placeholders: {
      email: "staff@hotel.com",
      password: "At least 6 characters",
      displayName: "John Doe",
    },
    roles: {
      admin: "Admin",
      manager: "Manager",
      staff: "Staff",
    },
  },
  fr: {
    loading: "Chargement du staff...",
    title: "Gestion du staff",
    subtitle: "Gerez les membres du staff de votre hotel et leurs acces.",
    addStaff: "Ajouter staff",
    addStaffMember: "Ajouter membre staff",
    addStaffDescription: "Creez un nouveau compte staff pour votre hotel.",
    email: "Email *",
    password: "Mot de passe *",
    displayName: "Nom affiche",
    role: "Role",
    departments: "Departements",
    cancel: "Annuler",
    creating: "Creation...",
    create: "Creer",
    staffMembers: "Membres du staff",
    noStaff: "Aucun membre staff pour le moment. Ajoutez votre premier membre staff.",
    staffMember: "membre staff",
    staffMembersPlural: "membres staff",
    errors: {
      loadStaff: "Echec du chargement des membres staff",
      loadStaffShort: "Echec du chargement du staff",
      createStaff: "Echec de creation du staff",
      deleteStaff: "Echec de suppression du membre staff",
      emailPasswordRequired: "Email et mot de passe sont obligatoires",
      removeConfirm: "Voulez-vous vraiment supprimer ce membre staff ?",
    },
    placeholders: {
      email: "staff@hotel.com",
      password: "Au moins 6 caracteres",
      displayName: "John Doe",
    },
    roles: {
      admin: "Admin",
      manager: "Manager",
      staff: "Staff",
    },
  },
  es: {
    loading: "Cargando staff...",
    title: "Gestion de staff",
    subtitle: "Gestiona los miembros del staff del hotel y sus accesos.",
    addStaff: "Agregar staff",
    addStaffMember: "Agregar miembro staff",
    addStaffDescription: "Crea una nueva cuenta staff para tu hotel.",
    email: "Email *",
    password: "Contrasena *",
    displayName: "Nombre visible",
    role: "Rol",
    departments: "Departamentos",
    cancel: "Cancelar",
    creating: "Creando...",
    create: "Crear",
    staffMembers: "Miembros del staff",
    noStaff: "Aun no hay miembros staff. Agrega el primero para empezar.",
    staffMember: "miembro staff",
    staffMembersPlural: "miembros staff",
    errors: {
      loadStaff: "No se pudieron cargar los miembros staff",
      loadStaffShort: "No se pudo cargar staff",
      createStaff: "No se pudo crear staff",
      deleteStaff: "No se pudo eliminar el miembro staff",
      emailPasswordRequired: "Email y contrasena son obligatorios",
      removeConfirm: "Seguro que deseas eliminar este miembro staff?",
    },
    placeholders: {
      email: "staff@hotel.com",
      password: "Minimo 6 caracteres",
      displayName: "John Doe",
    },
    roles: {
      admin: "Admin",
      manager: "Manager",
      staff: "Staff",
    },
  },
} as const;

export default function StaffManagementPage() {
  const pathname = usePathname() ?? "/settings/staff";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = settingsStaffCopy[locale];
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New staff form
  const [newStaffForm, setNewStaffForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "staff",
    departments: [] as string[]
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      const response = await fetch("/api/hotel/staff");
      if (!response.ok) throw new Error(t.errors.loadStaffShort);
      const data = await response.json();
      setStaff(data.items ?? []);
    } catch {
      setError(t.errors.loadStaff);
    } finally {
      setIsLoading(false);
    }
  }, [t.errors.loadStaff, t.errors.loadStaffShort]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  function toggleDepartment(dept: string) {
    setNewStaffForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept]
    }));
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (isCreating) return;

    if (!newStaffForm.email.trim() || !newStaffForm.password.trim()) {
      setCreateError(t.errors.emailPasswordRequired);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/hotel/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newStaffForm.email.trim(),
          password: newStaffForm.password,
          displayName: newStaffForm.displayName.trim() || null,
          role: newStaffForm.role,
          departments: newStaffForm.departments
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? t.errors.createStaff);
      }

      setIsAddDialogOpen(false);
      setNewStaffForm({
        email: "",
        password: "",
        displayName: "",
        role: "staff",
        departments: []
      });
      void loadStaff();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t.errors.createStaff);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteStaff(staffId: string) {
    if (!confirm(t.errors.removeConfirm)) return;

    try {
      const response = await fetch(`/api/hotel/staff/${staffId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(t.errors.deleteStaff);
      void loadStaff();
    } catch {
      alert(t.errors.deleteStaff);
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.subtitle}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.addStaff}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.addStaffMember}</DialogTitle>
              <DialogDescription>
                {t.addStaffDescription}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              {createError && (
                <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newEmail">{t.email}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder={t.placeholders.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t.password}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={t.placeholders.password}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDisplayName">{t.displayName}</Label>
                <Input
                  id="newDisplayName"
                  value={newStaffForm.displayName}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder={t.placeholders.displayName}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.role}</Label>
                <div className="flex gap-2">
                  {ROLE_VALUES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewStaffForm((prev) => ({ ...prev, role }))}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        newStaffForm.role === role
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      {t.roles[role]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.departments}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <label
                      key={dept}
                      className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-sm ${
                        newStaffForm.departments.includes(dept) ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newStaffForm.departments.includes(dept) || newStaffForm.role === "admin"}
                        onChange={() => toggleDepartment(dept)}
                        disabled={newStaffForm.role === "admin"}
                      />
                      <span className="capitalize">{dept.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? t.creating : t.create}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {t.staffMembers}
          </CardTitle>
          <CardDescription>
            {staff.length} {staff.length === 1 ? t.staffMember : t.staffMembersPlural}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {t.noStaff}
            </p>
          ) : (
            <div className="divide-y">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">
                      {member.displayName || member.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="capitalize">
                        <Shield className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                      {member.departments.slice(0, 4).map((dept) => (
                        <Badge key={dept} variant="secondary" className="capitalize text-xs">
                          {dept.replace("_", " ")}
                        </Badge>
                      ))}
                      {member.departments.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{member.departments.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteStaff(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
