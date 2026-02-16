"use client";

import { useEffect, useMemo, useState } from "react";

import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";

const defaultHotelId = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID ?? "H-FOURSEASONS";

type GuestContentResponse = {
  content?: GuestContent;
};

export function useGuestContent(locale: Locale, hotelId?: string | null) {
  const resolvedHotelId = useMemo(() => {
    const normalized = typeof hotelId === "string" ? hotelId.trim() : "";
    return normalized || defaultHotelId;
  }, [hotelId]);

  const [content, setContent] = useState<GuestContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const response = await fetch(
          `/api/hotels/${encodeURIComponent(resolvedHotelId)}/guest-content?locale=${encodeURIComponent(locale)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          if (!cancelled) setContent(null);
          return;
        }

        const data = (await response.json()) as GuestContentResponse;
        if (!cancelled) {
          setContent(data?.content ?? null);
        }
      } catch {
        if (!cancelled) setContent(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [locale, resolvedHotelId]);

  return {
    content,
    isLoading
  };
}
