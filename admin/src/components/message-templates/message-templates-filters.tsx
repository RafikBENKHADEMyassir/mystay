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

type MessageTemplatesFiltersProps = {
  channels: string[];
  statuses: string[];
};

export function MessageTemplatesFilters({ channels, statuses }: MessageTemplatesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/message-templates";
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  const stableChannels = useMemo(() => channels.filter(Boolean), [channels]);
  const stableStatuses = useMemo(() => statuses.filter(Boolean), [statuses]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      setParam(next, "search", search);
      // Preserve page and templateId so opening a detail panel is not overwritten by this sync
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

  function updateChannel(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, "channel", value);
    next.delete("page");
    next.delete("templateId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function updateStatus(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    setParam(next, "status", value);
    next.delete("page");
    next.delete("templateId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete("search");
    next.delete("channel");
    next.delete("status");
    next.delete("page");
    next.delete("templateId");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr,200px,200px,auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="mt-search">Search</Label>
        <Input id="mt-search" placeholder="Search for message name" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mt-channel">Channel</Label>
        <select
          id="mt-channel"
          className={nativeSelectClassName}
          value={searchParams?.get("channel") ?? ""}
          onChange={(event) => updateChannel(event.target.value)}
        >
          <option value="">All channels</option>
          {stableChannels.map((channel) => (
            <option key={channel} value={channel}>
              {channel.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mt-status">Status</Label>
        <select
          id="mt-status"
          className={nativeSelectClassName}
          value={searchParams?.get("status") ?? ""}
          onChange={(event) => updateStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {stableStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
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

