"use client";

import { AppLink } from "@/components/ui/app-link";
import { ChevronRight, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotificationCardProps = {
  badge: string;
  message: string;
  href?: string;
  showHistory?: boolean;
  historyAriaLabel?: string;
  onHistoryClick?: () => void;
  className?: string;
};

export function NotificationCard({
  badge,
  message,
  href,
  showHistory = true,
  historyAriaLabel,
  onHistoryClick,
  className
}: NotificationCardProps) {
  const content = (
    <div
      className={cn(
        "relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="mb-2 rounded-full border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700"
          >
            {badge}
          </Badge>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        {href && <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-300" />}
      </div>

      {/* Carousel dots indicator */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <span className="h-1.5 w-6 rounded-full bg-gray-800" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
      </div>

      {/* History button */}
      {showHistory && (
        <button
          onClick={onHistoryClick}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50"
          aria-label={historyAriaLabel ?? ""}
        >
          <History className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (href) {
    return <AppLink href={href}>{content}</AppLink>;
  }

  return content;
}
