"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Plus, Trash2, GripVertical, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

type Dish = {
  id: string;
  image: string;
  caption: string;
};

type MenuItem = {
  name: string;
  price?: string;
};

type MenuSubsection = {
  id: string;
  title: string;
  items: MenuItem[];
  linkText?: string;
};

type MenuSection = {
  id: string;
  title: string;
  price?: string;
  items?: MenuItem[];
  subsections?: MenuSubsection[];
};

export type RestaurantConfig = {
  coverImage?: string;
  description?: string;
  hours?: string;
  dishes?: Dish[];
  menuSections?: MenuSection[];
};

type Props = {
  itemId: string;
  config: RestaurantConfig;
  backendUrl: string;
  onSaved?: () => void;
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const restaurantEditorCopy = {
  en: {
    uploadFailed: "Upload failed",
    coverUploadFailed: "Cover upload failed",
    dishUploadFailed: "Dish upload failed",
    savedSuccess: "Restaurant config saved!",
    saveFailed: "Save failed",
    unknown: "unknown",
    title: "Restaurant Configuration",
    saving: "Saving...",
    saveConfig: "Save config",
    coverPhoto: "Cover Photo (bottom sheet header)",
    coverAlt: "Cover",
    uploadCover: "Upload cover",
    description: "Description",
    descriptionPlaceholder: "Our fine dining seafood restaurant...",
    hours: "Hours",
    hoursPlaceholder: "Open every day from 11:00 to 14:00 and from 19:00 to 23:00.",
    dishPhotos: "Dish Photos (carousel)",
    addDish: "Add dish",
    dishAlt: "Dish",
    captionPlaceholder: "Caption",
    menuSections: "Menu Sections",
    addSection: "Add section",
    sectionTitlePlaceholder: "Section title (e.g. Menu of the day)",
    sectionPricePlaceholder: "Price (e.g. 32,99 EUR)",
    itemsTitle: "Items (name + price)",
    item: "Item",
    itemNamePlaceholder: "Item name",
    pricePlaceholder: "Price",
    subsectionsTitle: "Subsections (e.g. \"Starters of choice\", \"Main course of choice\")",
    subsection: "Subsection",
    subsectionTitlePlaceholder: "Subsection title",
    linkTextPlaceholder: "Link text (optional)",
    addItem: "Add item",
  },
  fr: {
    uploadFailed: "Echec de telechargement",
    coverUploadFailed: "Echec telechargement cover",
    dishUploadFailed: "Echec telechargement plat",
    savedSuccess: "Configuration restaurant enregistree !",
    saveFailed: "Echec de sauvegarde",
    unknown: "inconnu",
    title: "Configuration restaurant",
    saving: "Enregistrement...",
    saveConfig: "Enregistrer config",
    coverPhoto: "Photo de couverture (entete de la feuille)",
    coverAlt: "Couverture",
    uploadCover: "Telecharger cover",
    description: "Description",
    descriptionPlaceholder: "Notre restaurant gastronomique de fruits de mer...",
    hours: "Horaires",
    hoursPlaceholder: "Ouvert tous les jours de 11h a 14h et de 19h a 23h.",
    dishPhotos: "Photos des plats (carrousel)",
    addDish: "Ajouter plat",
    dishAlt: "Plat",
    captionPlaceholder: "Legende",
    menuSections: "Sections du menu",
    addSection: "Ajouter section",
    sectionTitlePlaceholder: "Titre section (ex: Menu du jour)",
    sectionPricePlaceholder: "Prix (ex: 32,99 EUR)",
    itemsTitle: "Elements (nom + prix)",
    item: "Element",
    itemNamePlaceholder: "Nom element",
    pricePlaceholder: "Prix",
    subsectionsTitle: "Sous-sections (ex: \"Entrees au choix\", \"Plats au choix\")",
    subsection: "Sous-section",
    subsectionTitlePlaceholder: "Titre sous-section",
    linkTextPlaceholder: "Texte lien (optionnel)",
    addItem: "Ajouter element",
  },
  es: {
    uploadFailed: "Error de carga",
    coverUploadFailed: "Error al subir portada",
    dishUploadFailed: "Error al subir plato",
    savedSuccess: "Configuracion de restaurante guardada!",
    saveFailed: "Error al guardar",
    unknown: "desconocido",
    title: "Configuracion de restaurante",
    saving: "Guardando...",
    saveConfig: "Guardar config",
    coverPhoto: "Foto de portada (encabezado de hoja)",
    coverAlt: "Portada",
    uploadCover: "Subir portada",
    description: "Descripcion",
    descriptionPlaceholder: "Nuestro restaurante gourmet de mariscos...",
    hours: "Horario",
    hoursPlaceholder: "Abierto todos los dias de 11:00 a 14:00 y de 19:00 a 23:00.",
    dishPhotos: "Fotos de platos (carrusel)",
    addDish: "Agregar plato",
    dishAlt: "Plato",
    captionPlaceholder: "Leyenda",
    menuSections: "Secciones del menu",
    addSection: "Agregar seccion",
    sectionTitlePlaceholder: "Titulo de seccion (ej: Menu del dia)",
    sectionPricePlaceholder: "Precio (ej: 32,99 EUR)",
    itemsTitle: "Items (nombre + precio)",
    item: "Item",
    itemNamePlaceholder: "Nombre del item",
    pricePlaceholder: "Precio",
    subsectionsTitle: "Subsecciones (ej: \"Entradas a elegir\", \"Plato principal a elegir\")",
    subsection: "Subseccion",
    subsectionTitlePlaceholder: "Titulo subseccion",
    linkTextPlaceholder: "Texto enlace (opcional)",
    addItem: "Agregar item",
  },
} as const;

export function RestaurantConfigEditor({ itemId, config: initialConfig, backendUrl, onSaved }: Props) {
  const pathname = usePathname() ?? "/home-carousels";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = restaurantEditorCopy[locale];

  const [config, setConfig] = useState<RestaurantConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`${backendUrl}/api/v1/upload`, { method: "POST", body: form });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || t.uploadFailed);
      const url = data.url ?? "";
      return url.startsWith("http") ? url : `${backendUrl}${url}`;
    },
    [backendUrl, t.uploadFailed]
  );

  const handleCoverUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        setConfig((prev) => ({ ...prev, coverImage: url }));
      } catch {
        setMessage(t.coverUploadFailed);
      }
    },
    [t.coverUploadFailed, uploadImage]
  );

  const handleDishUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        setConfig((prev) => ({
          ...prev,
          dishes: [...(prev.dishes ?? []), { id: genId(), image: url, caption: "" }],
        }));
      } catch {
        setMessage(t.dishUploadFailed);
      }
    },
    [t.dishUploadFailed, uploadImage]
  );

  const updateDishCaption = (dishId: string, caption: string) => {
    setConfig((prev) => ({
      ...prev,
      dishes: (prev.dishes ?? []).map((d) => (d.id === dishId ? { ...d, caption } : d)),
    }));
  };

  const removeDish = (dishId: string) => {
    setConfig((prev) => ({
      ...prev,
      dishes: (prev.dishes ?? []).filter((d) => d.id !== dishId),
    }));
  };

  const addMenuSection = () => {
    setConfig((prev) => ({
      ...prev,
      menuSections: [
        ...(prev.menuSections ?? []),
        { id: genId(), title: "", items: [] },
      ],
    }));
  };

  const updateMenuSection = (idx: number, updates: Partial<MenuSection>) => {
    setConfig((prev) => ({
      ...prev,
      menuSections: (prev.menuSections ?? []).map((s, i) =>
        i === idx ? { ...s, ...updates } : s
      ),
    }));
  };

  const removeMenuSection = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      menuSections: (prev.menuSections ?? []).filter((_, i) => i !== idx),
    }));
  };

  const addMenuItem = (sectionIdx: number) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      section.items = [...(section.items ?? []), { name: "", price: "" }];
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const updateMenuItem = (sectionIdx: number, itemIdx: number, updates: Partial<MenuItem>) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      section.items = (section.items ?? []).map((item, i) =>
        i === itemIdx ? { ...item, ...updates } : item
      );
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const removeMenuItem = (sectionIdx: number, itemIdx: number) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      section.items = (section.items ?? []).filter((_, i) => i !== itemIdx);
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const addSubsection = (sectionIdx: number) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      section.subsections = [
        ...(section.subsections ?? []),
        { id: genId(), title: "", items: [] },
      ];
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const updateSubsection = (sectionIdx: number, subIdx: number, updates: Partial<MenuSubsection>) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      section.subsections = (section.subsections ?? []).map((sub, i) =>
        i === subIdx ? { ...sub, ...updates } : sub
      );
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const removeSubsection = (sectionIdx: number, subIdx: number) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      section.subsections = (section.subsections ?? []).filter((_, i) => i !== subIdx);
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const addSubsectionItem = (sectionIdx: number, subIdx: number) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      const subs = [...(section.subsections ?? [])];
      subs[subIdx] = { ...subs[subIdx], items: [...(subs[subIdx].items ?? []), { name: "" }] };
      section.subsections = subs;
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const updateSubsectionItem = (sectionIdx: number, subIdx: number, itemIdx: number, updates: Partial<MenuItem>) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      const subs = [...(section.subsections ?? [])];
      subs[subIdx] = {
        ...subs[subIdx],
        items: (subs[subIdx].items ?? []).map((item, i) => (i === itemIdx ? { ...item, ...updates } : item)),
      };
      section.subsections = subs;
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const removeSubsectionItem = (sectionIdx: number, subIdx: number, itemIdx: number) => {
    setConfig((prev) => {
      const sections = [...(prev.menuSections ?? [])];
      const section = { ...sections[sectionIdx] };
      const subs = [...(section.subsections ?? [])];
      subs[subIdx] = {
        ...subs[subIdx],
        items: (subs[subIdx].items ?? []).filter((_, i) => i !== itemIdx),
      };
      section.subsections = subs;
      sections[sectionIdx] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("mystay_staff_token="))
        ?.split("=")[1];

      const resp = await fetch(
        `${backendUrl}/api/v1/staff/experiences/items/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ restaurantConfig: config }),
        }
      );

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || `Error ${resp.status}`);
      }

      setMessage(t.savedSuccess);
      onSaved?.();
    } catch (err) {
      setMessage(`${t.saveFailed}: ${err instanceof Error ? err.message : t.unknown}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border bg-amber-50/30 dark:bg-amber-950/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t.title}</h3>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="mr-2 h-4 w-4" />
          {saving ? t.saving : t.saveConfig}
        </Button>
      </div>

      {message && (
        <div className={`rounded p-2 text-sm ${message.startsWith(t.saveFailed) ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700 dark:text-green-400"}`}>
          {message}
        </div>
      )}

      {/* Cover image */}
      <div className="space-y-2">
        <Label>{t.coverPhoto}</Label>
        <div className="flex items-center gap-3">
          {config.coverImage && (
            <div className="relative h-20 w-32 overflow-hidden rounded border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.coverImage} alt={t.coverAlt} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, coverImage: undefined }))}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <label className="cursor-pointer rounded border border-dashed px-3 py-2 text-sm hover:bg-muted/50">
            <Upload className="mr-1 inline h-4 w-4" />
            {t.uploadCover}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>{t.description}</Label>
        <Textarea
          value={config.description ?? ""}
          onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
          placeholder={t.descriptionPlaceholder}
          rows={3}
        />
      </div>

      {/* Hours */}
      <div className="space-y-2">
        <Label>{t.hours}</Label>
        <Input
          value={config.hours ?? ""}
          onChange={(e) => setConfig((p) => ({ ...p, hours: e.target.value }))}
          placeholder={t.hoursPlaceholder}
        />
      </div>

      {/* Dish carousel photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t.dishPhotos}</Label>
          <label className="cursor-pointer rounded border border-dashed px-2 py-1 text-xs hover:bg-muted/50">
            <Plus className="mr-1 inline h-3 w-3" />
            {t.addDish}
            <input type="file" accept="image/*" className="hidden" onChange={handleDishUpload} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          {(config.dishes ?? []).map((dish) => (
            <div key={dish.id} className="space-y-1">
              <div className="relative h-20 w-24 overflow-hidden rounded border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dish.image} alt={dish.caption || t.dishAlt} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeDish(dish.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Input
                value={dish.caption}
                onChange={(e) => updateDishCaption(dish.id, e.target.value)}
                placeholder={t.captionPlaceholder}
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t.menuSections}</Label>
          <Button type="button" size="sm" variant="outline" onClick={addMenuSection}>
            <Plus className="mr-1 h-3 w-3" />
            {t.addSection}
          </Button>
        </div>

        {(config.menuSections ?? []).map((section, sIdx) => (
          <Card key={section.id} className="bg-background">
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={section.title}
                  onChange={(e) => updateMenuSection(sIdx, { title: e.target.value })}
                  placeholder={t.sectionTitlePlaceholder}
                  className="h-8 flex-1"
                />
                <Input
                  value={section.price ?? ""}
                  onChange={(e) => updateMenuSection(sIdx, { price: e.target.value })}
                  placeholder={t.sectionPricePlaceholder}
                  className="h-8 w-36"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeMenuSection(sIdx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              {/* Direct items (for sections like Entrees, Plats, Desserts) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{t.itemsTitle}</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addMenuItem(sIdx)} className="h-6 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    {t.item}
                  </Button>
                </div>
                {(section.items ?? []).map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateMenuItem(sIdx, iIdx, { name: e.target.value })}
                      placeholder={t.itemNamePlaceholder}
                      className="h-7 flex-1 text-sm"
                    />
                    <Input
                      value={item.price ?? ""}
                      onChange={(e) => updateMenuItem(sIdx, iIdx, { price: e.target.value })}
                      placeholder={t.pricePlaceholder}
                      className="h-7 w-24 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMenuItem(sIdx, iIdx)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Subsections (for Menu du jour with Entrees au choix, Plats au choix, etc.) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.subsectionsTitle}
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addSubsection(sIdx)} className="h-6 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    {t.subsection}
                  </Button>
                </div>
                {(section.subsections ?? []).map((sub, subIdx) => (
                  <div key={sub.id} className="ml-4 space-y-2 border-l-2 border-muted pl-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={sub.title}
                        onChange={(e) => updateSubsection(sIdx, subIdx, { title: e.target.value })}
                        placeholder={t.subsectionTitlePlaceholder}
                        className="h-7 flex-1 text-sm"
                      />
                      <Input
                        value={sub.linkText ?? ""}
                        onChange={(e) => updateSubsection(sIdx, subIdx, { linkText: e.target.value })}
                        placeholder={t.linkTextPlaceholder}
                        className="h-7 w-40 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSubsection(sIdx, subIdx)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {(sub.items ?? []).map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-2 ml-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateSubsectionItem(sIdx, subIdx, iIdx, { name: e.target.value })}
                          placeholder={t.itemNamePlaceholder}
                          className="h-6 flex-1 text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSubsectionItem(sIdx, subIdx, iIdx)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => addSubsectionItem(sIdx, subIdx)}
                      className="h-6 text-xs ml-2"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t.addItem}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
