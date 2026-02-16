"use client";

import { useEffect, useState } from "react";
import type { RoomImage } from "@/types/overview";

export function useRoomThumbnail(hotelId: string | undefined, roomNumber: string | null | undefined): string | null {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoomThumbnail() {
      if (!hotelId) return;

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
        const url = new URL(`${apiBaseUrl}/api/v1/hotels/${hotelId}/room-images`);
        if (roomNumber) {
          url.searchParams.set("roomNumber", roomNumber);
        }

        const res = await fetch(url.toString());
        if (!res.ok) return;

        const data = (await res.json()) as { images?: RoomImage[] };
        const images = Array.isArray(data.images) ? data.images : [];
        const first = images
          .filter((img) => img.isActive)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];

        if (first?.imageUrl) {
          const imageUrl = first.imageUrl.startsWith("/")
            ? `${apiBaseUrl}${first.imageUrl}`
            : first.imageUrl;
          setThumbnailUrl(imageUrl);
        }
      } catch {
        // ignore
      }
    }

    void loadRoomThumbnail();
  }, [hotelId, roomNumber]);

  return thumbnailUrl;
}
