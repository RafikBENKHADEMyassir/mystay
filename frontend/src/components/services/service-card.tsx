"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  title: string;
  href: string;
  chatHref?: string;
  iconImage?: string;
  className?: string;
};

export function ServiceCard({
  title,
  href,
  chatHref,
  iconImage,
  className,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[6px] border border-black/[0.06] bg-white pb-6 pt-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <AppLink
        href={href}
        className="flex flex-col items-center gap-3"
      >
        {iconImage ? (
          <div className="relative h-[60px] w-[60px] overflow-hidden">
            <Image
              src={iconImage}
              alt={title}
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-muted">
            <span className="text-xl font-light text-muted-foreground">
              {title.charAt(0)}
            </span>
          </div>
        )}
        <span className="text-center text-[16px] font-light leading-tight text-black">
          {title}
        </span>
      </AppLink>

      {chatHref && (
        <AppLink
          href={chatHref}
          className="absolute -right-[7px] top-[calc(50%-42px)] flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/65 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-[6px] transition-transform hover:scale-105 active:scale-95"
          aria-label={`Chat with ${title}`}
        >
          <MessageCircle className="h-6 w-6 text-black/80" />
        </AppLink>
      )}
    </div>
  );
}
