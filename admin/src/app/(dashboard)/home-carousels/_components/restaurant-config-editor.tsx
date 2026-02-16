"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function RestaurantConfigEditor({ itemId, config: initialConfig, backendUrl, onSaved }: Props) {
  const [config, setConfig] = useState<RestaurantConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`${backendUrl}/api/v1/upload`, { method: "POST", body: form });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      const url = data.url ?? "";
      return url.startsWith("http") ? url : `${backendUrl}${url}`;
    },
    [backendUrl]
  );

  const handleCoverUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        setConfig((prev) => ({ ...prev, coverImage: url }));
      } catch {
        setMessage("Cover upload failed");
      }
    },
    [uploadImage]
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
        setMessage("Dish upload failed");
      }
    },
    [uploadImage]
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

      setMessage("Restaurant config saved!");
      onSaved?.();
    } catch (err) {
      setMessage(`Save failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border bg-amber-50/30 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Restaurant Configuration</h3>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save config"}
        </Button>
      </div>

      {message && (
        <div className={`rounded p-2 text-sm ${message.startsWith("Save failed") ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700"}`}>
          {message}
        </div>
      )}

      {/* Cover image */}
      <div className="space-y-2">
        <Label>Cover Photo (bottom sheet header)</Label>
        <div className="flex items-center gap-3">
          {config.coverImage && (
            <div className="relative h-20 w-32 overflow-hidden rounded border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.coverImage} alt="Cover" className="h-full w-full object-cover" />
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
            Upload cover
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={config.description ?? ""}
          onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
          placeholder="Our fine dining seafood restaurant..."
          rows={3}
        />
      </div>

      {/* Hours */}
      <div className="space-y-2">
        <Label>Hours</Label>
        <Input
          value={config.hours ?? ""}
          onChange={(e) => setConfig((p) => ({ ...p, hours: e.target.value }))}
          placeholder="Ouvert tous les jours, de 11h à 14h et de 19h à 23h."
        />
      </div>

      {/* Dish carousel photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Dish Photos (carousel)</Label>
          <label className="cursor-pointer rounded border border-dashed px-2 py-1 text-xs hover:bg-muted/50">
            <Plus className="mr-1 inline h-3 w-3" />
            Add dish
            <input type="file" accept="image/*" className="hidden" onChange={handleDishUpload} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          {(config.dishes ?? []).map((dish) => (
            <div key={dish.id} className="space-y-1">
              <div className="relative h-20 w-24 overflow-hidden rounded border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dish.image} alt={dish.caption || "Dish"} className="h-full w-full object-cover" />
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
                placeholder="Caption"
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Menu Sections</Label>
          <Button type="button" size="sm" variant="outline" onClick={addMenuSection}>
            <Plus className="mr-1 h-3 w-3" />
            Add section
          </Button>
        </div>

        {(config.menuSections ?? []).map((section, sIdx) => (
          <Card key={section.id} className="bg-white">
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={section.title}
                  onChange={(e) => updateMenuSection(sIdx, { title: e.target.value })}
                  placeholder="Section title (e.g. Menu du jour)"
                  className="h-8 flex-1"
                />
                <Input
                  value={section.price ?? ""}
                  onChange={(e) => updateMenuSection(sIdx, { price: e.target.value })}
                  placeholder="Price (e.g. 32,99 EUR)"
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
                  <span className="text-xs font-medium text-muted-foreground">Items (name + price)</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addMenuItem(sIdx)} className="h-6 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Item
                  </Button>
                </div>
                {(section.items ?? []).map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateMenuItem(sIdx, iIdx, { name: e.target.value })}
                      placeholder="Item name"
                      className="h-7 flex-1 text-sm"
                    />
                    <Input
                      value={item.price ?? ""}
                      onChange={(e) => updateMenuItem(sIdx, iIdx, { price: e.target.value })}
                      placeholder="Price"
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
                    Subsections (e.g. &quot;Entrees au choix&quot;, &quot;Plats au choix&quot;)
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addSubsection(sIdx)} className="h-6 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Subsection
                  </Button>
                </div>
                {(section.subsections ?? []).map((sub, subIdx) => (
                  <div key={sub.id} className="ml-4 space-y-2 border-l-2 border-muted pl-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={sub.title}
                        onChange={(e) => updateSubsection(sIdx, subIdx, { title: e.target.value })}
                        placeholder="Subsection title"
                        className="h-7 flex-1 text-sm"
                      />
                      <Input
                        value={sub.linkText ?? ""}
                        onChange={(e) => updateSubsection(sIdx, subIdx, { linkText: e.target.value })}
                        placeholder="Link text (optional)"
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
                          placeholder="Item name"
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
                      Add item
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
