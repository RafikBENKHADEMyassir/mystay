"use client";

import { useEffect, useState } from "react";
import type { ExperienceSection } from "@/types/overview";

type UseExperienceSectionsResult = {
  sections: ExperienceSection[];
  error: string | null;
  isLoading: boolean;
};

export function useExperienceSections(hotelId: string | undefined): UseExperienceSectionsResult {
  const [sections, setSections] = useState<ExperienceSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadExperiences() {
      if (!hotelId) return;

      setIsLoading(true);
      try {
        setError(null);
        const res = await fetch(`/api/hotels/${encodeURIComponent(hotelId)}/experiences`, { cache: "no-store" });
        if (!res.ok) {
          setSections([]);
          setError(`fetch_failed_${res.status}`);
          return;
        }

        const data = (await res.json()) as { sections?: ExperienceSection[] };
        setSections(Array.isArray(data.sections) ? data.sections : []);
      } catch {
        setSections([]);
        setError("fetch_failed");
      } finally {
        setIsLoading(false);
      }
    }

    void loadExperiences();
  }, [hotelId]);

  return { sections, error, isLoading };
}
