"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe, Loader2, Plus, Redo2, Save, Trash2, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type HotelDirectoryBlock =
  | { id: string; type: "section"; title: string }
  | { id: string; type: "heading"; level: number; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "button"; label: string; href: string }
  | { id: string; type: "image"; url: string; caption?: string | null }
  | { id: string; type: "video"; url: string }
  | { id: string; type: "divider" };

type HotelDirectoryLocaleContent = {
  blocks: HotelDirectoryBlock[];
};

export type HotelDirectoryDocument = {
  version: number;
  defaultLocale: string;
  locales: Record<string, HotelDirectoryLocaleContent>;
};

type HotelDirectoryPage = {
  hotelId: string;
  draft: unknown;
  published: unknown;
  draftSavedAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

type HotelDirectoryEditorProps = {
  canManage: boolean;
};

function createId(prefix: string) {
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10);
  return `${prefix}-${value}`.toUpperCase();
}

function normalizeDocument(raw: unknown): HotelDirectoryDocument {
  const fallback: HotelDirectoryDocument = { version: 1, defaultLocale: "en", locales: { en: { blocks: [] } } };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const version = typeof (raw as { version?: unknown }).version === "number" ? (raw as { version: number }).version : 1;
  const defaultLocale =
    typeof (raw as { defaultLocale?: unknown }).defaultLocale === "string" && (raw as { defaultLocale: string }).defaultLocale.trim()
      ? (raw as { defaultLocale: string }).defaultLocale.trim()
      : "en";

  const localesRaw = (raw as { locales?: unknown }).locales;
  const locales: Record<string, HotelDirectoryLocaleContent> = {};
  if (localesRaw && typeof localesRaw === "object" && !Array.isArray(localesRaw)) {
    for (const [key, value] of Object.entries(localesRaw as Record<string, unknown>)) {
      if (!key.trim()) continue;
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const blocksRaw = (value as { blocks?: unknown }).blocks;
      const blocks: HotelDirectoryBlock[] = Array.isArray(blocksRaw)
        ? (blocksRaw as unknown[])
            .map((item) => {
              if (!item || typeof item !== "object" || Array.isArray(item)) return null;
              const id = typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : "";
              const type = typeof (item as { type?: unknown }).type === "string" ? (item as { type: string }).type : "";
              if (!id.trim() || !type.trim()) return null;
              return item as HotelDirectoryBlock;
            })
            .filter((item): item is HotelDirectoryBlock => Boolean(item))
        : [];
      locales[key] = { blocks };
    }
  }

  if (!locales[defaultLocale]) locales[defaultLocale] = { blocks: [] };

  return { version, defaultLocale, locales };
}

function localeLabel(locale: string) {
  const value = locale.trim().toLowerCase();
  if (value === "en") return "English";
  if (value === "fr") return "Français";
  return locale;
}

function formatTime(value: string | null) {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not saved yet";
  return `Saved: ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function ensureLocaleDoc(doc: HotelDirectoryDocument, locale: string): HotelDirectoryDocument {
  if (doc.locales[locale]) return doc;
  return {
    ...doc,
    locales: {
      ...doc.locales,
      [locale]: { blocks: [] }
    }
  };
}

function updateLocaleBlocks(doc: HotelDirectoryDocument, locale: string, updater: (blocks: HotelDirectoryBlock[]) => HotelDirectoryBlock[]) {
  const safe = ensureLocaleDoc(doc, locale);
  const existing = safe.locales[locale]?.blocks ?? [];
  const nextBlocks = updater(existing);
  return {
    ...safe,
    locales: {
      ...safe.locales,
      [locale]: { blocks: nextBlocks }
    }
  };
}

function cardForType(type: HotelDirectoryBlock["type"]) {
  if (type === "heading") return { title: "Heading", description: "Large title text." };
  if (type === "paragraph") return { title: "Paragraph", description: "Body text block." };
  if (type === "button") return { title: "Button", description: "Call-to-action link." };
  if (type === "image") return { title: "Image", description: "Image URL + caption." };
  if (type === "video") return { title: "Video", description: "Embed video URL." };
  if (type === "divider") return { title: "Divider", description: "Simple separator line." };
  return { title: "Section", description: "Visual section header." };
}

export function HotelDirectoryEditor({ canManage }: HotelDirectoryEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<HotelDirectoryPage | null>(null);
  const [doc, setDoc] = useState<HotelDirectoryDocument>(() => ({ version: 1, defaultLocale: "en", locales: { en: { blocks: [] } } }));

  const historyRef = useRef<HotelDirectoryDocument[]>([]);
  const futureRef = useRef<HotelDirectoryDocument[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [panelTab, setPanelTab] = useState<"insert" | "layers" | "pages">("insert");
  const [previewMode, setPreviewMode] = useState(false);
  const [translationMode, setTranslationMode] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState("en");

  const activeLocale = selectedLocale.trim() || "en";
  const localeDoc = doc.locales[activeLocale] ?? { blocks: [] };

  const canEditLocale = canManage && !previewMode && (translationMode || activeLocale === doc.defaultLocale);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch("/api/staff/hotel-directory", { cache: "no-store" })
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as { page?: HotelDirectoryPage | null; error?: string } | null;
        if (!res.ok) throw new Error(payload?.error ?? `backend_error_${res.status}`);
        return payload?.page ?? null;
      })
      .then((loaded) => {
        if (cancelled) return;
        setPage(loaded);
        const normalized = normalizeDocument(loaded?.draft ?? null);
        setDoc(normalized);
        setSelectedLocale(normalized.defaultLocale);
        historyRef.current = [];
        futureRef.current = [];
      })
      .catch(() => {
        if (cancelled) return;
        setError("Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const locales = useMemo(() => {
    const keys = Object.keys(doc.locales);
    keys.sort((a, b) => a.localeCompare(b));
    return keys;
  }, [doc.locales]);

  function commit(updater: (current: HotelDirectoryDocument) => HotelDirectoryDocument) {
    setDoc((current) => {
      const next = updater(current);
      if (next === current) return current;

      historyRef.current.push(current);
      futureRef.current = [];
      return next;
    });
  }

  function updateBlock(blockId: string, patch: Partial<HotelDirectoryBlock>) {
    commit((current) =>
      updateLocaleBlocks(current, activeLocale, (blocks) =>
        blocks.map((block) => (block.id === blockId ? ({ ...block, ...patch } as HotelDirectoryBlock) : block))
      )
    );
  }

  function removeBlock(blockId: string) {
    commit((current) => updateLocaleBlocks(current, activeLocale, (blocks) => blocks.filter((block) => block.id !== blockId)));
  }

  function moveBlock(fromIndex: number, toIndex: number) {
    commit((current) =>
      updateLocaleBlocks(current, activeLocale, (blocks) => {
        if (fromIndex < 0 || fromIndex >= blocks.length) return blocks;
        const clampedTo = Math.max(0, Math.min(blocks.length, toIndex));
        if (clampedTo === fromIndex) return blocks;

        const copy = blocks.slice();
        const [removed] = copy.splice(fromIndex, 1);
        const insertIndex = Math.max(0, Math.min(copy.length, fromIndex < clampedTo ? clampedTo - 1 : clampedTo));
        copy.splice(insertIndex, 0, removed);
        return copy;
      })
    );
  }

  function insertBlock(type: HotelDirectoryBlock["type"]) {
    const baseId = type === "heading" ? "H" : type === "paragraph" ? "P" : type === "button" ? "B" : type === "image" ? "IMG" : type === "video" ? "VID" : type === "divider" ? "DIV" : "SEC";

    const block: HotelDirectoryBlock =
      type === "heading"
        ? { id: createId(baseId), type, level: 2, text: "Heading" }
        : type === "paragraph"
          ? { id: createId(baseId), type, text: "Text..." }
          : type === "button"
            ? { id: createId(baseId), type, label: "Button", href: "/" }
            : type === "image"
              ? { id: createId(baseId), type, url: "", caption: "" }
              : type === "video"
                ? { id: createId(baseId), type, url: "" }
                : type === "divider"
                  ? { id: createId(baseId), type }
                  : { id: createId(baseId), type, title: "Section" };

    commit((current) => updateLocaleBlocks(current, activeLocale, (blocks) => [...blocks, block]));
  }

  function undo() {
    setDoc((current) => {
      const previous = historyRef.current.pop();
      if (!previous) return current;
      futureRef.current.push(current);
      return previous;
    });
  }

  function redo() {
    setDoc((current) => {
      const next = futureRef.current.pop();
      if (!next) return current;
      historyRef.current.push(current);
      return next;
    });
  }

  async function saveDraft() {
    if (!canManage) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/staff/hotel-directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_draft", document: doc })
      });

      const payload = (await response.json().catch(() => null)) as { page?: HotelDirectoryPage | null; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? `backend_error_${response.status}`);

      setPage(payload?.page ?? null);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publish() {
    if (!canManage) return;
    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch("/api/staff/hotel-directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", document: doc })
      });

      const payload = (await response.json().catch(() => null)) as { page?: HotelDirectoryPage | null; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? `backend_error_${response.status}`);

      setPage(payload?.page ?? null);
    } catch {
      setError("Could not publish. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  function renderBlockPreview(block: HotelDirectoryBlock) {
    if (block.type === "divider") return <Separator className="my-6" />;
    if (block.type === "heading") {
      const Tag = block.level <= 1 ? "h1" : block.level === 2 ? "h2" : "h3";
      return <Tag className={cn("font-semibold tracking-tight", block.level <= 1 ? "text-2xl" : block.level === 2 ? "text-xl" : "text-lg")}>{block.text}</Tag>;
    }
    if (block.type === "paragraph") {
      return <p className="whitespace-pre-line text-sm text-muted-foreground">{block.text}</p>;
    }
    if (block.type === "button") {
      return (
        <Button asChild className="w-full sm:w-auto">
          <a href={block.href || "#"} target="_blank" rel="noreferrer">
            {block.label}
          </a>
        </Button>
      );
    }
    if (block.type === "image") {
      return (
        <div className="space-y-2">
          <div className="aspect-video w-full rounded-xl border bg-muted/30">
            {block.url ? <img src={block.url} alt={block.caption ?? ""} className="h-full w-full rounded-xl object-cover" /> : null}
          </div>
          {block.caption ? <p className="text-xs text-muted-foreground">{block.caption}</p> : null}
        </div>
      );
    }
    if (block.type === "video") {
      return (
        <div className="space-y-2">
          <div className="aspect-video w-full rounded-xl border bg-muted/30" />
          <p className="text-xs text-muted-foreground">{block.url ? block.url : "Video URL"}</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border bg-muted/10 px-4 py-3">
        <p className="text-sm font-semibold">{block.title}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Hotel Directory</h1>
            <Badge variant="secondary">Draft</Badge>
            {!canManage ? <Badge variant="outline">Read-only</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">Drag-and-drop content builder with preview, languages, and publish flow.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {formatTime(page?.draftSavedAt ?? null)}
          </Badge>
          <Button variant={previewMode ? "secondary" : "outline"} onClick={() => setPreviewMode((value) => !value)}>
            Preview
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Close</Link>
          </Button>
          <Button onClick={saveDraft} disabled={!canManage || isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          <Button onClick={publish} disabled={!canManage || isPublishing} className="gap-2">
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Editor</CardTitle>
            <CardDescription>Insert components, manage layers, and switch languages.</CardDescription>

            <div className="flex gap-1">
              <Button size="sm" variant={panelTab === "insert" ? "secondary" : "ghost"} onClick={() => setPanelTab("insert")}>
                Insert
              </Button>
              <Button size="sm" variant={panelTab === "layers" ? "secondary" : "ghost"} onClick={() => setPanelTab("layers")}>
                Layers
              </Button>
              <Button size="sm" variant={panelTab === "pages" ? "secondary" : "ghost"} onClick={() => setPanelTab("pages")}>
                Pages
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="hd-locale">Language</Label>
              <div className="flex items-center gap-2">
                <select
                  id="hd-locale"
                  className={nativeSelectClassName}
                  value={activeLocale}
                  onChange={(event) => setSelectedLocale(event.target.value)}
                  disabled={locales.length <= 1}
                >
                  {locales.map((locale) => (
                    <option key={locale} value={locale}>
                      {localeLabel(locale)}
                      {locale === doc.defaultLocale ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  Translation mode
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={translationMode}
                    onChange={(event) => setTranslationMode(event.target.checked)}
                    disabled={!canManage}
                  />
                  {translationMode ? "On" : "Off"}
                </label>
              </div>

              {!canEditLocale && canManage && activeLocale !== doc.defaultLocale ? (
                <p className="text-xs text-muted-foreground">Enable translation mode to edit this language.</p>
              ) : null}
            </div>

            {panelTab === "insert" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Section</p>
                  <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => insertBlock("section")} disabled={!canEditLocale}>
                    <Plus className="h-4 w-4" />
                    Section
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Text</p>
                  <div className="grid gap-2">
                    {(["heading", "paragraph"] as const).map((type) => {
                      const card = cardForType(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => insertBlock(type)}
                          disabled={!canEditLocale}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="flex-1 text-left">
                            <span className="block text-sm font-semibold">{card.title}</span>
                            <span className="block text-xs text-muted-foreground">{card.description}</span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Buttons</p>
                  <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => insertBlock("button")} disabled={!canEditLocale}>
                    <Plus className="h-4 w-4" />
                    Button
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Media</p>
                  <div className="grid gap-2">
                    {(["image", "video"] as const).map((type) => {
                      const card = cardForType(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => insertBlock(type)}
                          disabled={!canEditLocale}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="flex-1 text-left">
                            <span className="block text-sm font-semibold">{card.title}</span>
                            <span className="block text-xs text-muted-foreground">{card.description}</span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Layouts</p>
                  <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => insertBlock("divider")} disabled={!canEditLocale}>
                    <Plus className="h-4 w-4" />
                    Divider
                  </Button>
                </div>
              </div>
            ) : panelTab === "layers" ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Undo/redo and layer order.</p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={undo} disabled={historyRef.current.length === 0}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={redo} disabled={futureRef.current.length === 0}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {localeDoc.blocks.map((block, index) => (
                    <div key={block.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs">
                      <span className="truncate">
                        {index + 1}. {cardForType(block.type).title}
                      </span>
                      <Badge variant="outline" className="font-mono">
                        {block.type}
                      </Badge>
                    </div>
                  ))}
                  {localeDoc.blocks.length === 0 ? <p className="text-xs text-muted-foreground">No blocks yet.</p> : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Single-page editor (Home).</p>
                <div className="rounded-md border bg-muted/10 px-3 py-2 text-sm font-semibold">Home</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Live preview of the guest hotel directory page.</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {localeLabel(activeLocale)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border bg-muted/10 p-4">
              <div className="grid gap-4 lg:grid-cols-[220px,1fr] lg:items-center">
                <div className="aspect-video w-full rounded-xl bg-muted/30" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Hotel name</p>
                    <p className="text-xs text-muted-foreground">Room type name</p>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-foreground">Check-in</p>
                      <p>Day, Mon, DD, Year</p>
                      <p>hh:mm</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Check-out</p>
                      <p>Day, Mon, DD, Year</p>
                      <p>hh:mm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {localeDoc.blocks.map((block, index) => {
                if (previewMode) {
                  return (
                    <div key={block.id} className="space-y-2">
                      {renderBlockPreview(block)}
                    </div>
                  );
                }

                return (
                  <div
                    key={block.id}
                    className={cn("rounded-2xl border bg-background p-4 shadow-sm", dragOverIndex === index && "ring-2 ring-primary")}
                    draggable={canEditLocale}
                    onDragStart={(event) => {
                      if (!canEditLocale) return;
                      event.dataTransfer.setData("text/plain", String(index));
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(event) => {
                      if (!canEditLocale) return;
                      event.preventDefault();
                      setDragOverIndex(index);
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDragLeave={() => {
                      setDragOverIndex((current) => (current === index ? null : current));
                    }}
                    onDragEnd={() => setDragOverIndex(null)}
                    onDrop={(event) => {
                      if (!canEditLocale) return;
                      event.preventDefault();
                      const raw = event.dataTransfer.getData("text/plain");
                      const fromIndex = Number(raw);
                      if (!Number.isFinite(fromIndex)) return;
                      setDragOverIndex(null);
                      moveBlock(fromIndex, index);
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {index + 1}
                        </Badge>
                        <p className="text-sm font-semibold">{cardForType(block.type).title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{block.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canEditLocale || index === 0}
                          onClick={() => moveBlock(index, index - 1)}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canEditLocale || index === localeDoc.blocks.length - 1}
                          onClick={() => moveBlock(index, index + 2)}
                        >
                          ↓
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={!canEditLocale} onClick={() => removeBlock(block.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {block.type === "heading" ? (
                        <>
                          <div className="grid gap-3 sm:grid-cols-[140px,1fr] sm:items-end">
                            <div className="space-y-2">
                              <Label>Level</Label>
                              <select
                                className={nativeSelectClassName}
                                value={block.level}
                                onChange={(event) => updateBlock(block.id, { level: Number(event.target.value) })}
                                disabled={!canEditLocale}
                              >
                                <option value={1}>H1</option>
                                <option value={2}>H2</option>
                                <option value={3}>H3</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Text</Label>
                              <Input
                                value={block.text}
                                onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                                disabled={!canEditLocale}
                              />
                            </div>
                          </div>
                          <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                        </>
                      ) : block.type === "paragraph" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Text</Label>
                            <Textarea
                              value={block.text}
                              onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                              disabled={!canEditLocale}
                              className="min-h-[120px]"
                            />
                          </div>
                          <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                        </>
                      ) : block.type === "button" ? (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Label</Label>
                              <Input
                                value={block.label}
                                onChange={(event) => updateBlock(block.id, { label: event.target.value })}
                                disabled={!canEditLocale}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>URL</Label>
                              <Input
                                value={block.href}
                                onChange={(event) => updateBlock(block.id, { href: event.target.value })}
                                disabled={!canEditLocale}
                              />
                            </div>
                          </div>
                          <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                        </>
                      ) : block.type === "image" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              placeholder="https://..."
                              value={block.url}
                              onChange={(event) => updateBlock(block.id, { url: event.target.value })}
                              disabled={!canEditLocale}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Caption</Label>
                            <Input
                              value={block.caption ?? ""}
                              onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                              disabled={!canEditLocale}
                            />
                          </div>
                          <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                        </>
                      ) : block.type === "video" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                              placeholder="https://..."
                              value={block.url}
                              onChange={(event) => updateBlock(block.id, { url: event.target.value })}
                              disabled={!canEditLocale}
                            />
                          </div>
                          <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                        </>
                      ) : block.type === "divider" ? (
                        <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={block.title}
                              onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                              disabled={!canEditLocale}
                            />
                          </div>
                          <div className="rounded-xl border bg-muted/10 px-4 py-3">{renderBlockPreview(block)}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {localeDoc.blocks.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
                  Drag and drop layouts here
                </div>
              ) : null}

              {!previewMode && localeDoc.blocks.length > 0 ? (
                <div
                  className={cn(
                    "rounded-2xl border border-dashed px-6 py-6 text-center text-xs text-muted-foreground",
                    canEditLocale ? "hover:bg-muted/20" : "opacity-60"
                  )}
                  onDragOver={(event) => {
                    if (!canEditLocale) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    if (!canEditLocale) return;
                    event.preventDefault();
                    const raw = event.dataTransfer.getData("text/plain");
                    const fromIndex = Number(raw);
                    if (!Number.isFinite(fromIndex)) return;
                    setDragOverIndex(null);
                    moveBlock(fromIndex, localeDoc.blocks.length);
                  }}
                >
                  Drop here to move to the end
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
