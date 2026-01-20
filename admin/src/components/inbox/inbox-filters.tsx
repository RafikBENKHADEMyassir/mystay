"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";

type InboxFiltersProps = {
  departments: string[];
  statuses: string[];
};

export function InboxFilters({ departments, statuses }: InboxFiltersProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/inbox";
  const searchParams = useSearchParams();

  const dept = searchParams?.get("dept") ?? "";
  const status = searchParams?.get("status") ?? "";

  const [query, setQuery] = useState(searchParams?.get("q") ?? "");
  const initialQuery = searchParams?.get("q") ?? "";

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const stableDepartments = useMemo(() => departments.filter(Boolean), [departments]);
  const stableStatuses = useMemo(() => statuses.filter(Boolean), [statuses]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      const trimmed = query.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, query, router, searchParams]);

  function updateSelect(key: "dept" | "status", value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    const trimmed = value.trim();
    if (trimmed) next.set(key, trimmed);
    else next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function reset() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr,180px,180px,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="inbox-q">Search</Label>
        <Input
          id="inbox-q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title, department, id…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inbox-dept">Department</Label>
        <select
          id="inbox-dept"
          className={nativeSelectClassName}
          value={dept}
          onChange={(event) => updateSelect("dept", event.target.value)}
        >
          <option value="">All</option>
          {stableDepartments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inbox-status">Status</Label>
        <select
          id="inbox-status"
          className={nativeSelectClassName}
          value={status}
          onChange={(event) => updateSelect("status", event.target.value)}
        >
          <option value="">All</option>
          {stableStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
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
