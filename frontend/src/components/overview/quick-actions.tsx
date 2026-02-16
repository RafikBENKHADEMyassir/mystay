"use client";

import { AppLink } from "@/components/ui/app-link";
import { ChevronRight } from "lucide-react";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";

type QuickActionChipProps = {
  href: string;
  label: string;
};

function QuickActionChip({ href, label }: QuickActionChipProps) {
  return (
    <AppLink
      href={href}
      className="flex min-w-[170px] items-center justify-between gap-3 rounded-[6px] border border-border bg-card px-4 py-3 text-[14px] font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30"
    >
      <span className="">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
    </AppLink>
  );
}

type Props = {
  locale: Locale;
  content: GuestContent["pages"]["home"]["overview"]["quickActions"];
};

export function QuickActions({ locale, content }: Props) {
  return (
    <div className="mt-4 overflow-x-auto px-4 no-scrollbar">
      <div className="flex gap-3 pb-1">
        <QuickActionChip   href={withLocale(locale, "/services")} label={content.upgradeRoom} />
        <QuickActionChip href={withLocale(locale, "/room-service")} label={content.roomService} />
        <QuickActionChip href={withLocale(locale, "/housekeeping")} label={content.housekeeping} />
      </div>
    </div>
  );
}
