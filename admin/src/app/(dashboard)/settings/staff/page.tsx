"use client";

import { useState, useEffect } from "react";
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

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" }
];

export default function StaffManagementPage() {
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

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      const response = await fetch("/api/hotel/staff");
      if (!response.ok) throw new Error("Failed to load staff");
      const data = await response.json();
      setStaff(data.items ?? []);
    } catch {
      setError("Failed to load staff members");
    } finally {
      setIsLoading(false);
    }
  }

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
      setCreateError("Email and password are required");
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
        throw new Error(data?.error ?? "Failed to create staff");
      }

      setIsAddDialogOpen(false);
      setNewStaffForm({
        email: "",
        password: "",
        displayName: "",
        role: "staff",
        departments: []
      });
      loadStaff();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create staff");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteStaff(staffId: string) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const response = await fetch(`/api/hotel/staff/${staffId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete");
      loadStaff();
    } catch {
      alert("Failed to delete staff member");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading staff...</p>
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
          <h1 className="text-2xl font-semibold">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your hotel&apos;s staff members and their access.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account for your hotel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              {createError && (
                <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email *</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="staff@hotel.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDisplayName">Display Name</Label>
                <Input
                  id="newDisplayName"
                  value={newStaffForm.displayName}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setNewStaffForm((prev) => ({ ...prev, role: role.value }))}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        newStaffForm.role === role.value
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Departments</Label>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create"}
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
            Staff Members
          </CardTitle>
          <CardDescription>
            {staff.length} staff member{staff.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No staff members yet. Add your first staff member to get started.
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
