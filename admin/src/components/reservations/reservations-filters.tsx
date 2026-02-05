"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function setParam(next: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) next.set(key, trimmed);
  else next.delete(key);
}

export function ReservationsFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "/reservations";
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      setParam(next, "search", search);
      next.delete("page");
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

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
        <Label htmlFor="res-from">Arrival date</Label>
        <Input
          id="res-from"
          type="date"
          value={searchParams?.get("from") ?? ""}
          onChange={(event) => updateDate("from", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="res-to">Departure date</Label>
        <Input
          id="res-to"
          type="date"
          value={searchParams?.get("to") ?? ""}
          onChange={(event) => updateDate("to", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="res-search">Search</Label>
        <Input
          id="res-search"
          placeholder="Search guest name or booking number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Button type="button" variant="outline" onClick={reset}>
        Reset
      </Button>
    </div>
  );
}

