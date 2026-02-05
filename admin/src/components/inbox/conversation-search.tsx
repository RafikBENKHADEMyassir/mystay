"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

function setParam(params: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) params.set(key, trimmed);
  else params.delete(key);
}

type ConversationSearchProps = {
  placeholder?: string;
};

export function ConversationSearch({ placeholder }: ConversationSearchProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/inbox";
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const currentSearch = searchParams?.get("search") ?? "";
    if (search.trim() === currentSearch.trim()) return;

    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      setParam(next, "search", search);
      next.delete("conversationId");
      next.delete("sent");
      next.delete("error");
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    }, 250);

    return () => clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

  return (
    <Input
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder={placeholder ?? "Search for name or booking number"}
    />
  );
}
