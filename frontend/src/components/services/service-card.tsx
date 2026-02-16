"use client";

import { AppLink } from "@/components/ui/app-link";
import { ChevronRight, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type ServiceCardProps = {
  title: string;
  href: string;
  chatHref?: string;
  backgroundImage: string;
  className?: string;
};

export function ServiceCard({
  title,
  href,
  chatHref,
  backgroundImage,
  className
}: ServiceCardProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Background Image */}
      <AppLink href={href} className="block">
        <div
          className="relative h-[88px] bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />

          {/* Title with chevron */}
          <div className="absolute inset-0 flex items-center px-4">
            <div className="flex items-center gap-1">
              <span className="text-lg font-medium text-white drop-shadow-md">
                {title}
              </span>
              <ChevronRight className="h-5 w-5 text-white/80" />
            </div>
          </div>
        </div>
      </AppLink>

      {/* Chat button */}
      {chatHref && (
        <AppLink
          href={chatHref}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={`Chat with ${title}`}
        >
          <MessageCircle className="h-5 w-5 text-gray-700" />
        </AppLink>
      )}
    </div>
  );
}
