"use client";

import { useState } from "react";
import { Grip, Plus, Settings, Trash2, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type FieldType = "text" | "number" | "select" | "checkbox" | "textarea";

type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
};

type RequestTemplate = {
  id: string;
  department: string;
  name: string;
  description: string;
  fields: FormField[];
  active: boolean;
};

const departments = ["concierge", "housekeeping", "room_service", "spa", "reception"];

export default function RequestTemplatesPage() {
  const [templates, setTemplates] = useState<RequestTemplate[]>([
    {
      id: "tmpl-1",
      department: "housekeeping",
      name: "Amenity Request",
      description: "Quick request for room amenities",
      active: true,
      fields: [
        {
          id: "fld-1",
          label: "Item",
          type: "select",
          required: true,
          options: ["Towels", "Pillows", "Toiletries", "Blankets", "Hangers"]
        },
        {
          id: "fld-2",
          label: "Quantity",
          type: "number",
          required: true,
          placeholder: "1"
        },
        {
          id: "fld-3",
          label: "Special Instructions",
          type: "textarea",
          required: false,
          placeholder: "Any special requests..."
        }
      ]
    }
  ]);

  const [editingTemplate, setEditingTemplate] = useState<RequestTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    const newTemplate: RequestTemplate = {
      id: `tmpl-${Date.now()}`,
      department: "concierge",
      name: "New Template",
      description: "",
      active: true,
      fields: []
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingTemplate) return;

    if (isCreating) {
      setTemplates([...templates, editingTemplate]);
      setIsCreating(false);
    } else {
      setTemplates(templates.map((t) => (t.id === editingTemplate.id ? editingTemplate : t)));
    }
    setEditingTemplate(null);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const addField = () => {
    if (!editingTemplate) return;

    const newField: FormField = {
      id: `fld-${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false
    };

    setEditingTemplate({
      ...editingTemplate,
      fields: [...editingTemplate.fields, newField]
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      fields: editingTemplate.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      )
    });
  };

  const removeField = (fieldId: string) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      fields: editingTemplate.fields.filter((f) => f.id !== fieldId)
    });
  };

  if (editingTemplate) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Create Request Template" : "Edit Request Template"}</CardTitle>
            <CardDescription>
              Configure standardized request forms for your department
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder="e.g., Amenity Request"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={editingTemplate.department}
                  onValueChange={(value: string) =>
                    setEditingTemplate({ ...editingTemplate, department: value })
                  }
                >
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingTemplate.description}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, description: e.target.value })
                }
                placeholder="Brief description of this template"
              />
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Form Fields</h3>
                <Button onClick={addField} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>

              {editingTemplate.fields.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No fields added yet. Click &quot;Add Field&quot; to create one.
                </p>
              )}

              <div className="space-y-3">
                {editingTemplate.fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(field.id, { label: e.target.value })
                            }
                            placeholder="e.g., Item"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="textarea">Text Area</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Required</Label>
                          <Select
                            value={field.required ? "yes" : "no"}
                            onValueChange={(value: string) =>
                              updateField(field.id, { required: value === "yes" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {field.type === "select" && (
                        <div className="mt-4 space-y-2">
                          <Label>Options (comma-separated)</Label>
                          <Input
                            value={field.options?.join(", ") ?? ""}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      {(field.type === "text" || field.type === "textarea") && (
                        <div className="mt-4 space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder ?? ""}
                            onChange={(e) =>
                              updateField(field.id, { placeholder: e.target.value })
                            }
                            placeholder="Placeholder text..."
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {isCreating ? "Create Template" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create standardized forms for common guest requests
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description || "No description"}
                  </CardDescription>
                </div>
                {template.active && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {template.department.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{template.fields.length} fields</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingTemplate(template)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No templates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first request template to standardize guest requests.
            </p>
            <Button onClick={handleCreateNew} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
