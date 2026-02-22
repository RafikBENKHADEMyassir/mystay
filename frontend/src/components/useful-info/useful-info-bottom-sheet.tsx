"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";
import { AppLink } from "@/components/ui/app-link";

type UsefulInfoItem = {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  sortOrder: number;
};

type UsefulInfoCategory = {
  id: string;
  title: string;
  icon: string | null;
  sortOrder: number;
  items: UsefulInfoItem[];
};

type Props = {
  hotelId: string;
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

function hasBoldMarkers(content: string) {
  return content.includes("**");
}

export function UsefulInfoBottomSheet({ hotelId, onClose }: Props) {
  const locale = useLocale();
  const [categories, setCategories] = useState<UsefulInfoCategory[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabBarRef = useRef<HTMLDivElement>(null);
  const isScrollingToTab = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/hotels/${hotelId}/useful-informations`);
        if (!res.ok) return;
        const data = await res.json();
        const cats = data.categories ?? [];
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].id);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [hotelId]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  const handleScroll = useCallback(() => {
    if (isScrollingToTab.current) return;
    const container = scrollRef.current;
    if (!container || categories.length === 0) return;

    const scrollTop = container.scrollTop;
    const offset = 100;
    let current = categories[0].id;

    for (const cat of categories) {
      const el = sectionRefs.current.get(cat.id);
      if (el && el.offsetTop - offset <= scrollTop) {
        current = cat.id;
      }
    }

    setActiveTab(current);
  }, [categories]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeBtn = tabBarRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  const handleTabClick = useCallback((catId: string) => {
    setActiveTab(catId);
    const el = sectionRefs.current.get(catId);
    const container = scrollRef.current;
    if (!el || !container) return;

    isScrollingToTab.current = true;
    container.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });

    setTimeout(() => {
      isScrollingToTab.current = false;
    }, 500);
  }, []);

  const setSectionRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  const handleCopy = useCallback((itemId: string, content: string) => {
    const plain = content.replace(/\*\*/g, "").replace(/^[^:]+:\s*/, "");
    navigator.clipboard.writeText(plain);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" data-testid="useful-info-sheet">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative z-[101] mt-auto flex h-[88vh] flex-col rounded-t-[20px] bg-white transition-transform duration-300 ease-out",
          isClosing ? "translate-y-full" : "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="h-1 w-9 rounded-full bg-gray-300" />
        </div>

        {/* Title */}
        <p className="flex-shrink-0 text-center text-base font-semibold text-gray-900 pb-1">
          Informations utiles
        </p>

        {/* Subtitle */}
        <p className="flex-shrink-0 text-center text-[13px] leading-tight text-gray-400 px-10 pb-4">
          Retrouvez ici toutes les informations utiles{"\n"}pour votre séjour.
        </p>

        {/* Tab bar */}
        {categories.length > 0 && (
          <div className="flex-shrink-0 border-b border-gray-100 bg-white">
            <div ref={tabBarRef} className="flex overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleTabClick(cat.id)}
                  data-tab-id={cat.id}
                  data-testid={`useful-info-tab-${cat.id}`}
                  className={cn(
                    "flex-shrink-0 border-b-2 px-4 pb-2.5 pt-1.5 text-[13px] font-medium transition-colors whitespace-nowrap",
                    activeTab === cat.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400"
                  )}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          )}

          {!isLoading && categories.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-400">
              Aucune information disponible.
            </p>
          )}

          {!isLoading && categories.length > 0 && (
            <div data-testid="useful-info-content">
              {categories.map((cat, catIdx) => (
                <div
                  key={cat.id}
                  ref={(el) => setSectionRef(cat.id, el)}
                  data-testid={`useful-info-section-${cat.id}`}
                >
                  {/* Divider between categories */}
                  {catIdx > 0 && <div className="mx-5 h-px bg-gray-200" />}

                  <div className="px-5 pt-5 pb-5">
                    <h3 className="text-[22px] font-light text-gray-800 mb-2.5">
                      {cat.title}
                    </h3>

                    <div className="space-y-0.5">
                      {cat.items.map((item) => {
                        const bold = hasBoldMarkers(item.content);
                        const isPassword = item.title.toLowerCase().includes("mot de passe");

                        return (
                          <div key={item.id} className="flex items-start gap-2">
                            <p
                              className={cn(
                                "text-[14px] leading-[1.6]",
                                bold
                                  ? "font-medium text-gray-900"
                                  : "text-gray-400"
                              )}
                            >
                              <RichText text={item.content} />
                            </p>
                            {isPassword && (
                              <button
                                onClick={() => handleCopy(item.id, item.content)}
                                className="mt-0.5 flex-shrink-0"
                                aria-label="Copy password"
                              >
                                <Copy
                                  className={cn(
                                    "h-4 w-4",
                                    copiedId === item.id ? "text-green-500" : "text-gray-400"
                                  )}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Divider before link */}
              <div className="mx-5 h-px bg-gray-200" />

              {/* Contact reception link */}
              <div className="px-5 py-5">
                <AppLink
                  href={withLocale(locale, "/messages?department=reception")}
                  className="inline-flex items-center gap-0.5 text-[13px] text-gray-400"
                  data-testid="useful-info-contact-link"
                >
                  Contacter la réception
                  <ChevronRight className="h-3.5 w-3.5" />
                </AppLink>
              </div>

              <div className="h-[40vh]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
