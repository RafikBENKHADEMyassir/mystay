"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Settings, Trash2, Type } from "lucide-react";

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
import { defaultAdminLocale, getAdminLocaleFromPathname, type AdminLocale } from "@/lib/admin-locale";

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

const departments = ["concierge", "housekeeping", "room_service", "spa", "reception"] as const;
type DepartmentKey = (typeof departments)[number];

const requestTemplatesCopy = {
  en: {
    editorCreateTitle: "Create Request Template",
    editorEditTitle: "Edit Request Template",
    editorDescription: "Configure standardized request forms for your department",
    templateName: "Template Name",
    templateNamePlaceholder: "e.g., Amenity Request",
    department: "Department",
    description: "Description",
    descriptionPlaceholder: "Brief description of this template",
    formFields: "Form Fields",
    addField: "Add Field",
    noFields: "No fields added yet. Click \"Add Field\" to create one.",
    fieldLabel: "Field Label",
    fieldLabelPlaceholder: "e.g., Item",
    fieldType: "Field Type",
    required: "Required",
    yes: "Yes",
    no: "No",
    options: "Options (comma-separated)",
    optionsPlaceholder: "Option 1, Option 2, Option 3",
    placeholder: "Placeholder",
    placeholderText: "Placeholder text...",
    cancel: "Cancel",
    createTemplate: "Create Template",
    saveChanges: "Save Changes",
    pageTitle: "Request Templates",
    pageSubtitle: "Create standardized forms for common guest requests",
    newTemplate: "New Template",
    noDescription: "No description",
    active: "Active",
    field: "field",
    fields: "fields",
    edit: "Edit",
    noTemplatesTitle: "No templates yet",
    noTemplatesDescription: "Create your first request template to standardize guest requests.",
    createFirstTemplate: "Create Template",
    deleteConfirm: "Are you sure you want to delete this template?",
    fieldTypes: {
      text: "Text",
      number: "Number",
      select: "Dropdown",
      checkbox: "Checkbox",
      textarea: "Text Area",
    },
    departments: {
      concierge: "Concierge",
      housekeeping: "Housekeeping",
      room_service: "Room service",
      spa: "Spa",
      reception: "Reception",
    },
    defaults: {
      amenityRequest: "Amenity Request",
      amenityDescription: "Quick request for room amenities",
      item: "Item",
      quantity: "Quantity",
      specialInstructions: "Special Instructions",
      newTemplateName: "New Template",
      newFieldName: "New Field",
      optionTowels: "Towels",
      optionPillows: "Pillows",
      optionToiletries: "Toiletries",
      optionBlankets: "Blankets",
      optionHangers: "Hangers",
      one: "1",
      specialInstructionsPlaceholder: "Any special requests...",
    },
  },
  fr: {
    editorCreateTitle: "Creer un modele de demande",
    editorEditTitle: "Modifier le modele de demande",
    editorDescription: "Configurez des formulaires standards pour votre departement",
    templateName: "Nom du modele",
    templateNamePlaceholder: "ex: Demande d'amenites",
    department: "Departement",
    description: "Description",
    descriptionPlaceholder: "Breve description de ce modele",
    formFields: "Champs du formulaire",
    addField: "Ajouter un champ",
    noFields: "Aucun champ ajoute. Cliquez sur \"Ajouter un champ\" pour en creer un.",
    fieldLabel: "Libelle du champ",
    fieldLabelPlaceholder: "ex: Article",
    fieldType: "Type de champ",
    required: "Obligatoire",
    yes: "Oui",
    no: "Non",
    options: "Options (separees par des virgules)",
    optionsPlaceholder: "Option 1, Option 2, Option 3",
    placeholder: "Placeholder",
    placeholderText: "Texte du placeholder...",
    cancel: "Annuler",
    createTemplate: "Creer le modele",
    saveChanges: "Enregistrer",
    pageTitle: "Modeles de demandes",
    pageSubtitle: "Creez des formulaires standards pour les demandes frequentes",
    newTemplate: "Nouveau modele",
    noDescription: "Aucune description",
    active: "Actif",
    field: "champ",
    fields: "champs",
    edit: "Modifier",
    noTemplatesTitle: "Aucun modele pour le moment",
    noTemplatesDescription: "Creez votre premier modele pour standardiser les demandes clients.",
    createFirstTemplate: "Creer un modele",
    deleteConfirm: "Voulez-vous vraiment supprimer ce modele ?",
    fieldTypes: {
      text: "Texte",
      number: "Nombre",
      select: "Liste",
      checkbox: "Case a cocher",
      textarea: "Zone de texte",
    },
    departments: {
      concierge: "Conciergerie",
      housekeeping: "Menage",
      room_service: "Room service",
      spa: "Spa",
      reception: "Reception",
    },
    defaults: {
      amenityRequest: "Demande d'amenites",
      amenityDescription: "Demande rapide pour les amenites de chambre",
      item: "Article",
      quantity: "Quantite",
      specialInstructions: "Instructions speciales",
      newTemplateName: "Nouveau modele",
      newFieldName: "Nouveau champ",
      optionTowels: "Serviettes",
      optionPillows: "Oreillers",
      optionToiletries: "Produits de toilette",
      optionBlankets: "Couvertures",
      optionHangers: "Cintres",
      one: "1",
      specialInstructionsPlaceholder: "Demandes particulieres...",
    },
  },
  es: {
    editorCreateTitle: "Crear plantilla de solicitud",
    editorEditTitle: "Editar plantilla de solicitud",
    editorDescription: "Configura formularios estandarizados para tu departamento",
    templateName: "Nombre de la plantilla",
    templateNamePlaceholder: "ej: Solicitud de amenidades",
    department: "Departamento",
    description: "Descripcion",
    descriptionPlaceholder: "Breve descripcion de esta plantilla",
    formFields: "Campos del formulario",
    addField: "Agregar campo",
    noFields: "Aun no hay campos. Haz clic en \"Agregar campo\" para crear uno.",
    fieldLabel: "Etiqueta del campo",
    fieldLabelPlaceholder: "ej: Articulo",
    fieldType: "Tipo de campo",
    required: "Obligatorio",
    yes: "Si",
    no: "No",
    options: "Opciones (separadas por comas)",
    optionsPlaceholder: "Opcion 1, Opcion 2, Opcion 3",
    placeholder: "Placeholder",
    placeholderText: "Texto del placeholder...",
    cancel: "Cancelar",
    createTemplate: "Crear plantilla",
    saveChanges: "Guardar cambios",
    pageTitle: "Plantillas de solicitudes",
    pageSubtitle: "Crea formularios estandarizados para solicitudes frecuentes",
    newTemplate: "Nueva plantilla",
    noDescription: "Sin descripcion",
    active: "Activa",
    field: "campo",
    fields: "campos",
    edit: "Editar",
    noTemplatesTitle: "Aun no hay plantillas",
    noTemplatesDescription: "Crea tu primera plantilla para estandarizar solicitudes de huespedes.",
    createFirstTemplate: "Crear plantilla",
    deleteConfirm: "Estas seguro de que quieres eliminar esta plantilla?",
    fieldTypes: {
      text: "Texto",
      number: "Numero",
      select: "Desplegable",
      checkbox: "Casilla",
      textarea: "Area de texto",
    },
    departments: {
      concierge: "Conserjeria",
      housekeeping: "Limpieza",
      room_service: "Room service",
      spa: "Spa",
      reception: "Recepcion",
    },
    defaults: {
      amenityRequest: "Solicitud de amenidades",
      amenityDescription: "Solicitud rapida para amenidades de la habitacion",
      item: "Articulo",
      quantity: "Cantidad",
      specialInstructions: "Instrucciones especiales",
      newTemplateName: "Nueva plantilla",
      newFieldName: "Nuevo campo",
      optionTowels: "Toallas",
      optionPillows: "Almohadas",
      optionToiletries: "Articulos de aseo",
      optionBlankets: "Mantas",
      optionHangers: "Perchas",
      one: "1",
      specialInstructionsPlaceholder: "Alguna solicitud especial...",
    },
  },
} as const;

function buildInitialTemplates(locale: AdminLocale): RequestTemplate[] {
  const defaults = requestTemplatesCopy[locale].defaults;
  return [
    {
      id: "tmpl-1",
      department: "housekeeping",
      name: defaults.amenityRequest,
      description: defaults.amenityDescription,
      active: true,
      fields: [
        {
          id: "fld-1",
          label: defaults.item,
          type: "select",
          required: true,
          options: [
            defaults.optionTowels,
            defaults.optionPillows,
            defaults.optionToiletries,
            defaults.optionBlankets,
            defaults.optionHangers,
          ],
        },
        {
          id: "fld-2",
          label: defaults.quantity,
          type: "number",
          required: true,
          placeholder: defaults.one,
        },
        {
          id: "fld-3",
          label: defaults.specialInstructions,
          type: "textarea",
          required: false,
          placeholder: defaults.specialInstructionsPlaceholder,
        },
      ],
    },
  ];
}

export default function RequestTemplatesPage() {
  const pathname = usePathname() ?? "/request-templates";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = requestTemplatesCopy[locale];
  const [templates, setTemplates] = useState<RequestTemplate[]>(() => buildInitialTemplates(locale));

  const [editingTemplate, setEditingTemplate] = useState<RequestTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    const newTemplate: RequestTemplate = {
      id: `tmpl-${Date.now()}`,
      department: "concierge",
      name: t.defaults.newTemplateName,
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
    if (confirm(t.deleteConfirm)) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const addField = () => {
    if (!editingTemplate) return;

    const newField: FormField = {
      id: `fld-${Date.now()}`,
      label: t.defaults.newFieldName,
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
            <CardTitle>{isCreating ? t.editorCreateTitle : t.editorEditTitle}</CardTitle>
            <CardDescription>
              {t.editorDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">{t.templateName}</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder={t.templateNamePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">{t.department}</Label>
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
                        {t.departments[dept]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                value={editingTemplate.description}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, description: e.target.value })
                }
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t.formFields}</h3>
                <Button onClick={addField} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addField}
                </Button>
              </div>

              {editingTemplate.fields.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t.noFields}
                </p>
              )}

              <div className="space-y-3">
                {editingTemplate.fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>{t.fieldLabel}</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(field.id, { label: e.target.value })
                            }
                            placeholder={t.fieldLabelPlaceholder}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t.fieldType}</Label>
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
                              <SelectItem value="text">{t.fieldTypes.text}</SelectItem>
                              <SelectItem value="number">{t.fieldTypes.number}</SelectItem>
                              <SelectItem value="select">{t.fieldTypes.select}</SelectItem>
                              <SelectItem value="checkbox">{t.fieldTypes.checkbox}</SelectItem>
                              <SelectItem value="textarea">{t.fieldTypes.textarea}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t.required}</Label>
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
                              <SelectItem value="yes">{t.yes}</SelectItem>
                              <SelectItem value="no">{t.no}</SelectItem>
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
                          <Label>{t.options}</Label>
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
                            placeholder={t.optionsPlaceholder}
                          />
                        </div>
                      )}

                      {(field.type === "text" || field.type === "textarea") && (
                        <div className="mt-4 space-y-2">
                          <Label>{t.placeholder}</Label>
                          <Input
                            value={field.placeholder ?? ""}
                            onChange={(e) =>
                              updateField(field.id, { placeholder: e.target.value })
                            }
                            placeholder={t.placeholderText}
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
                {t.cancel}
              </Button>
              <Button onClick={handleSave}>
                {isCreating ? t.createTemplate : t.saveChanges}
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
          <h1 className="text-3xl font-bold tracking-tight">{t.pageTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {t.pageSubtitle}
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          {t.newTemplate}
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
                    {template.description || t.noDescription}
                  </CardDescription>
                </div>
                {template.active && (
                  <Badge variant="outline" className="text-xs">
                    {t.active}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {(t.departments as Record<string, string>)[template.department] ??
                      template.department.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {template.fields.length} {template.fields.length === 1 ? t.field : t.fields}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingTemplate(template)}
                >
                  {t.edit}
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
            <h3 className="mt-4 text-lg font-medium">{t.noTemplatesTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.noTemplatesDescription}
            </p>
            <Button onClick={handleCreateNew} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              {t.createFirstTemplate}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
