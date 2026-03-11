"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

const paymentLinksFiltersCopy = {
  en: {
    from: "From",
    to: "To",
    search: "Search",
    searchPlaceholder: "Search for name or reservation number",
    status: "Status",
    all: "All",
    reset: "Reset",
    statuses: {
      created: "Created",
      paid: "Paid",
      failed: "Failed",
      expired: "Expired",
    },
  },
  fr: {
    from: "De",
    to: "A",
    search: "Recherche",
    searchPlaceholder: "Rechercher nom ou numero de reservation",
    status: "Statut",
    all: "Tous",
    reset: "Reinitialiser",
    statuses: {
      created: "Cree",
      paid: "Paye",
      failed: "Echoue",
      expired: "Expire",
    },
  },
  es: {
    from: "Desde",
    to: "Hasta",
    search: "Buscar",
    searchPlaceholder: "Buscar nombre o numero de reserva",
    status: "Estado",
    all: "Todos",
    reset: "Restablecer",
    statuses: {
      created: "Creado",
      paid: "Pagado",
      failed: "Fallido",
      expired: "Expirado",
    },
  },
} as const;

function formatStatusLabel(value: string, localeCopy: (typeof paymentLinksFiltersCopy)[keyof typeof paymentLinksFiltersCopy]) {
  const normalized = value.trim().toLowerCase() as keyof typeof localeCopy.statuses;
  return localeCopy.statuses[normalized] ?? value.replace("_", " ");
}

function setParam(next: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) next.set(key, trimmed);
  else next.delete(key);
}

type PaymentLinksFiltersProps = {
  statuses: string[];
};

export function PaymentLinksFilters({ statuses }: PaymentLinksFiltersProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/payment-links";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = paymentLinksFiltersCopy[locale];
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  const stableStatuses = useMemo(() => statuses.filter(Boolean), [statuses]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const currentSearch = searchParams?.get("search") ?? "";
      if (currentSearch === search) return;

      const next = new URLSearchParams(searchParams?.toString() ?? "");
      setParam(next, "search", search);
      next.delete("page");
      next.delete("paymentLinkId");
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

  function updateDate(key: "from" | "to", value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, key, value);
    next.delete("page");
    next.delete("paymentLinkId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function updateStatus(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, "status", value);
    next.delete("page");
    next.delete("paymentLinkId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete("from");
    next.delete("to");
    next.delete("search");
    next.delete("status");
    next.delete("page");
    next.delete("paymentLinkId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[170px,170px,1fr,200px,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="pl-from">{t.from}</Label>
        <Input
          id="pl-from"
          type="date"
          value={searchParams?.get("from") ?? ""}
          onChange={(event) => updateDate("from", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pl-to">{t.to}</Label>
        <Input
          id="pl-to"
          type="date"
          value={searchParams?.get("to") ?? ""}
          onChange={(event) => updateDate("to", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pl-search">{t.search}</Label>
        <Input
          id="pl-search"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pl-status">{t.status}</Label>
        <select
          id="pl-status"
          className={nativeSelectClassName}
          value={searchParams?.get("status") ?? ""}
          onChange={(event) => updateStatus(event.target.value)}
        >
          <option value="">{t.all}</option>
          {stableStatuses.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status, t)}
            </option>
          ))}
        </select>
      </div>

      <Button type="button" variant="outline" onClick={reset}>
        {t.reset}
      </Button>
    </div>
  );
}
