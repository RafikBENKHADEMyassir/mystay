"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function setParam(next: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) next.set(key, trimmed);
  else next.delete(key);
}

const reservationsFiltersCopy = {
  en: {
    arrivalDate: "Arrival date",
    departureDate: "Departure date",
    search: "Search",
    searchPlaceholder: "Search guest name or booking number",
    reset: "Reset",
  },
  fr: {
    arrivalDate: "Date d'arrivee",
    departureDate: "Date de depart",
    search: "Recherche",
    searchPlaceholder: "Rechercher nom client ou numero de reservation",
    reset: "Reinitialiser",
  },
  es: {
    arrivalDate: "Fecha de llegada",
    departureDate: "Fecha de salida",
    search: "Buscar",
    searchPlaceholder: "Buscar nombre de huesped o numero de reserva",
    reset: "Restablecer",
  },
} as const;

export function ReservationsFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "/reservations";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = reservationsFiltersCopy[locale];
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");
  const searchParamsRef = useRef(searchParams);
  const isTypingRef = useRef(false);

  searchParamsRef.current = searchParams;

  useEffect(() => {
    if (isTypingRef.current) return;
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    isTypingRef.current = true;
    setSearch(value);
  }, []);

  useEffect(() => {
    if (!isTypingRef.current) return;

    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParamsRef.current?.toString() ?? "");
      setParam(next, "search", search);
      next.delete("page");
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
      isTypingRef.current = false;
    }, 400);

    return () => clearTimeout(handle);
  }, [pathname, router, search]);

  function updateDate(key: "from" | "to", value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, key, value);
    next.delete("page");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete("from");
    next.delete("to");
    next.delete("search");
    next.delete("page");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[160px,160px,1fr,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="res-from">{t.arrivalDate}</Label>
        <Input
          id="res-from"
          type="date"
          value={searchParams?.get("from") ?? ""}
          onChange={(event) => updateDate("from", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="res-to">{t.departureDate}</Label>
        <Input
          id="res-to"
          type="date"
          value={searchParams?.get("to") ?? ""}
          onChange={(event) => updateDate("to", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="res-search">{t.search}</Label>
        <Input
          id="res-search"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </div>

      <Button type="button" variant="outline" onClick={reset}>
        {t.reset}
      </Button>
    </div>
  );
}
