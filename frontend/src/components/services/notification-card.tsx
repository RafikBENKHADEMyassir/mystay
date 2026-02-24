"use client";

import { AppLink } from "@/components/ui/app-link";
import { History } from "lucide-react";

import { cn } from "@/lib/utils";

type NotificationSlide = {
  badge: string;
  message: string;
  href?: string;
};

type NotificationCardProps = {
  slides: NotificationSlide[];
  showHistory?: boolean;
  historyAriaLabel?: string;
  onHistoryClick?: () => void;
  className?: string;
};

export function NotificationCard({
  slides,
  showHistory = true,
  historyAriaLabel,
  onHistoryClick,
  className,
}: NotificationCardProps) {
  if (slides.length === 0) return null;

  const slide = slides[0];

  const content = (
    <div
      className={cn(
        "rounded-md border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="overflow-x-auto overflow-y-clip">
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black">
              {slide.badge}
            </span>
            {slide.href && (
              <svg width="21" height="10" viewBox="0 0 21 10" className="text-black/60">
                <path d="M1 5h18M14 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-[15px] leading-snug text-black/50">
            {slide.message}
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center gap-1.5 py-2">
        {showHistory && (
          <button
            onClick={onHistoryClick}
            className="absolute -right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition hover:bg-gray-50"
            aria-label={historyAriaLabel ?? "View history"}
          >
            <History className="h-5 w-5" />
          </button>
        )}
        <span className="h-1 w-[18px] rounded-full bg-black" />
        {slides.length > 1 && (
          <span className="h-1 w-1 rounded-full bg-black/50" />
        )}
      </div>
    </div>
  );

  if (slide.href) {
    return <AppLink href={slide.href}>{content}</AppLink>;
  }

  return content;
}
