"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";

function setParam(next: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) next.set(key, trimmed);
  else next.delete(key);
}

type UpsellServicesFiltersProps = {
  categories: string[];
};

export function UpsellServicesFilters({ categories }: UpsellServicesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/upsell-services";
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  const stableCategories = useMemo(
    () => categories.filter(Boolean).filter((value, index, all) => all.indexOf(value) === index),
    [categories]
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      setParam(next, "search", search);
      // Preserve serviceId and new so opening a detail panel is not overwritten by this sync
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

  function updateCategory(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, "category", value);
    next.delete("serviceId");
    next.delete("new");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete("search");
    next.delete("category");
    next.delete("serviceId");
    next.delete("new");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr,260px,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="up-search">Search</Label>
        <Input id="up-search" placeholder="Search services or categories" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="up-category">Category</Label>
        <select
          id="up-category"
          className={nativeSelectClassName}
          value={searchParams?.get("category") ?? ""}
          onChange={(event) => updateCategory(event.target.value)}
        >
          <option value="">All categories</option>
          {stableCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <Button type="button" variant="outline" onClick={reset}>
        Reset
      </Button>
    </div>
  );
}

