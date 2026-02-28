"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useRef, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceItem } from "@/types/overview";

type RestaurantConfig = {
  coverImage?: string;
  description?: string;
  hours?: string;
  dishes?: Array<{ id: string; image: string; caption?: string }>;
  menuSections?: Array<{
    id: string;
    title: string;
    price?: string;
    items?: Array<{ name: string; price?: string }>;
    subsections?: Array<{
      id: string;
      title: string;
      items?: Array<{ name: string; price?: string }>;
      linkText?: string;
      linkTarget?: string;
    }>;
  }>;
};

type Props = {
  item: ExperienceItem & { restaurantConfig?: RestaurantConfig };
  onBook: () => void;
  onClose: () => void;
};

export function RestaurantBottomSheet({ item, onBook, onClose }: Props) {
  const config = (item.restaurantConfig ?? {}) as RestaurantConfig;
  const menuSections = useMemo(() => config.menuSections ?? [], [config.menuSections]);
  const [activeTab, setActiveTab] = useState(menuSections[0]?.id ?? "");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const scrollRef = useRef<HTMLDivElement>(null);

  const resolveUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("/uploads/") ? `${apiBaseUrl}${url}` : url;
  };

  const tabTitles = menuSections.map((s) => ({ id: s.id, title: s.title }));

  const handleLinkClick = useCallback(
    (linkText: string, linkTarget?: string) => {
      if (linkTarget) {
        const target = menuSections.find((s) => s.id === linkTarget);
        if (target) {
          setActiveTab(target.id);
          return;
        }
      }
      const lower = linkText.toLowerCase();
      const target = menuSections.find(
        (s) => lower.includes(s.title.toLowerCase()) || s.title.toLowerCase().includes(lower)
      );
      if (target) {
        setActiveTab(target.id);
      }
    },
    [menuSections]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Bottom sheet - fixed height for consistent UX when switching tabs */}
      <div className="relative mt-auto flex h-[92vh] flex-col rounded-t-[20px] bg-white animate-in slide-in-from-bottom duration-300">
        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>

        {/* Cover image / title area */}
        <div className="relative flex-shrink-0">
          {config.coverImage ? (
            <div className="relative h-40 w-full overflow-hidden rounded-t-[20px]">
              <img
                src={resolveUrl(config.coverImage)}
                alt={item.label}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
              <h2 className="absolute bottom-4 left-0 right-0 text-center font-serif text-2xl font-light uppercase tracking-widest text-white">
                {item.label}
              </h2>
            </div>
          ) : (
            <div className="px-4 pb-2 pt-12 text-center">
              <h2 className="font-serif text-2xl font-light uppercase tracking-widest text-gray-900">
                {item.label}
              </h2>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain pb-24">
          {/* Dish carousel */}
          {config.dishes && config.dishes.length > 0 && (
            <div className="mt-4 px-4">
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                {config.dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="h-28 w-36 flex-shrink-0 overflow-hidden rounded-xl"
                  >
                    <img
                      src={resolveUrl(dish.image)}
                      alt={dish.caption || "Dish"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {config.description && (
            <div className="mt-4 px-6 text-center">
              <p className="text-sm leading-relaxed text-gray-500">
                {config.description}
              </p>
            </div>
          )}

          {/* Hours */}
          {config.hours && (
            <div className="mt-3 px-6 text-center">
              <p className="text-sm font-medium text-gray-700">{config.hours}</p>
            </div>
          )}

          {/* Menu tab bar */}
          {tabTitles.length > 0 && (
            <div className="mt-6 border-b border-gray-100">
              <div className="flex gap-0 overflow-x-auto px-4 no-scrollbar">
                {tabTitles.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-shrink-0 border-b-2 px-4 pb-3 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active menu section */}
          {menuSections
            .filter((s) => s.id === activeTab)
            .map((section) => (
              <div key={section.id} className="px-6 py-4">
                {/* Section header with price */}
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  {section.price && (
                    <span className="text-xl font-semibold text-gray-900">
                      {section.price}
                    </span>
                  )}
                </div>

                {/* Subsections (e.g. Entrees au choix, Plats au choix) */}
                {section.subsections?.map((sub) => (
                  <div key={sub.id} className="mt-4">
                    <p className="text-sm text-gray-400">{sub.title}</p>
                    {(sub.items ?? []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(sub.items ?? []).map((item, idx) => (
                          <p
                            key={idx}
                            className="text-sm font-medium text-gray-800"
                          >
                            {item.name}
                          </p>
                        ))}
                      </div>
                    )}
                    {sub.linkText && (
                      <button
                        onClick={() => handleLinkClick(sub.linkText!, sub.linkTarget)}
                        className="mt-2 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
                      >
                        {sub.linkText}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Direct items (with price) */}
                {section.items && section.items.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {section.items.map((menuItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between"
                      >
                        <p className="flex-1 text-sm font-medium text-gray-800">
                          {menuItem.name}
                        </p>
                        {menuItem.price && (
                          <span className="ml-4 text-sm text-gray-500">
                            {menuItem.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Sticky book button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-6 py-4">
          <button
            onClick={onBook}
            className="flex h-[50px] w-full items-center justify-center rounded-[8px] bg-gray-900 text-base font-semibold text-white active:scale-[0.99]"
          >
            Choisir ce restaurant
          </button>
        </div>
      </div>
    </div>
  );
}
