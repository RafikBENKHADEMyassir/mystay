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

export function AudienceFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "/audience";
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

  function updateOptInDate(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, "from", value);
    setParam(next, "to", value);
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
    <div className="grid gap-3 md:grid-cols-[200px,1fr,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="aud-optin-date">Opt-in date</Label>
        <Input
          id="aud-optin-date"
          type="date"
          value={searchParams?.get("from") ?? ""}
          onChange={(event) => updateOptInDate(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="aud-search">Search</Label>
        <Input
          id="aud-search"
          placeholder="Search name or email"
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

