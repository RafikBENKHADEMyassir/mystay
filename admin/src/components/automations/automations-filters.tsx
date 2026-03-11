"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

const automationsFiltersCopy = {
  en: {
    search: "Search",
    searchPlaceholder: "Search for automation name",
    status: "Status",
    allStatuses: "All statuses",
    active: "Active",
    paused: "Paused",
    reset: "Reset",
  },
  fr: {
    search: "Recherche",
    searchPlaceholder: "Rechercher un nom d'automatisation",
    status: "Statut",
    allStatuses: "Tous les statuts",
    active: "Actif",
    paused: "En pause",
    reset: "Reinitialiser",
  },
  es: {
    search: "Buscar",
    searchPlaceholder: "Buscar nombre de automatizacion",
    status: "Estado",
    allStatuses: "Todos los estados",
    active: "Activo",
    paused: "Pausado",
    reset: "Restablecer",
  },
} as const;

function setParam(next: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) next.set(key, trimmed);
  else next.delete(key);
}

export function AutomationsFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "/automations";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = automationsFiltersCopy[locale];
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      setParam(next, "search", search);
      // Preserve page and automationId so opening a detail panel is not overwritten by this sync
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

  function updateStatus(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, "status", value);
    next.delete("page");
    next.delete("automationId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete("search");
    next.delete("status");
    next.delete("page");
    next.delete("automationId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr,220px,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="auto-search">{t.search}</Label>
        <Input
          id="auto-search"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="auto-status">{t.status}</Label>
        <select
          id="auto-status"
          className={nativeSelectClassName}
          value={searchParams?.get("status") ?? ""}
          onChange={(event) => updateStatus(event.target.value)}
        >
          <option value="">{t.allStatuses}</option>
          <option value="active">{t.active}</option>
          <option value="paused">{t.paused}</option>
        </select>
      </div>

      <Button type="button" variant="outline" onClick={reset}>
        {t.reset}
      </Button>
    </div>
  );
}
