"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

const messageTemplatesFiltersCopy = {
  en: {
    search: "Search",
    searchPlaceholder: "Search for message name",
    channel: "Channel",
    allChannels: "All channels",
    status: "Status",
    allStatuses: "All statuses",
    reset: "Reset",
    channels: {
      email: "Email",
      sms: "SMS",
      app: "App",
    },
    statuses: {
      draft: "Draft",
      published: "Published",
      archived: "Archived",
    },
  },
  fr: {
    search: "Recherche",
    searchPlaceholder: "Rechercher un nom de message",
    channel: "Canal",
    allChannels: "Tous les canaux",
    status: "Statut",
    allStatuses: "Tous les statuts",
    reset: "Reinitialiser",
    channels: {
      email: "Email",
      sms: "SMS",
      app: "Application",
    },
    statuses: {
      draft: "Brouillon",
      published: "Publie",
      archived: "Archive",
    },
  },
  es: {
    search: "Buscar",
    searchPlaceholder: "Buscar nombre del mensaje",
    channel: "Canal",
    allChannels: "Todos los canales",
    status: "Estado",
    allStatuses: "Todos los estados",
    reset: "Restablecer",
    channels: {
      email: "Correo",
      sms: "SMS",
      app: "App",
    },
    statuses: {
      draft: "Borrador",
      published: "Publicado",
      archived: "Archivado",
    },
  },
} as const;

function formatChannelLabel(value: string, localeCopy: (typeof messageTemplatesFiltersCopy)[keyof typeof messageTemplatesFiltersCopy]) {
  const normalized = value.trim().toLowerCase() as keyof typeof localeCopy.channels;
  return localeCopy.channels[normalized] ?? value.toUpperCase();
}

function formatStatusLabel(value: string, localeCopy: (typeof messageTemplatesFiltersCopy)[keyof typeof messageTemplatesFiltersCopy]) {
  const normalized = value.trim().toLowerCase() as keyof typeof localeCopy.statuses;
  return localeCopy.statuses[normalized] ?? value.replaceAll("_", " ");
}

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
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = messageTemplatesFiltersCopy[locale];
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
        <Label htmlFor="mt-search">{t.search}</Label>
        <Input
          id="mt-search"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mt-channel">{t.channel}</Label>
        <select
          id="mt-channel"
          className={nativeSelectClassName}
          value={searchParams?.get("channel") ?? ""}
          onChange={(event) => updateChannel(event.target.value)}
        >
          <option value="">{t.allChannels}</option>
          {stableChannels.map((channel) => (
            <option key={channel} value={channel}>
              {formatChannelLabel(channel, t)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mt-status">{t.status}</Label>
        <select
          id="mt-status"
          className={nativeSelectClassName}
          value={searchParams?.get("status") ?? ""}
          onChange={(event) => updateStatus(event.target.value)}
        >
          <option value="">{t.allStatuses}</option>
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
