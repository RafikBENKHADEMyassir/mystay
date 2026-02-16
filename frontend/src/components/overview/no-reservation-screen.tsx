"use client";

import { AppLink } from "@/components/ui/app-link";
import { Hotel } from "lucide-react";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";

type Props = {
  locale: Locale;
  content: GuestContent["pages"]["home"]["noReservation"];
};

export function NoReservationScreen({ locale, content }: Props) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Hotel className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-3 text-2xl font-bold">{content.title}</h1>
        <p className="mb-8 text-muted-foreground">{content.description}</p>
        <div className="flex flex-col gap-3">
          <AppLink href={withLocale(locale, "/link-reservation")}>
            <span className="block w-full rounded-2xl bg-foreground py-3 text-center text-sm font-semibold text-background shadow-sm">
              {content.linkReservation}
            </span>
          </AppLink>
          <AppLink href={withLocale(locale, "/hotels")}>
            <span className="block w-full rounded-2xl border border-border bg-background py-3 text-center text-sm font-semibold text-foreground shadow-sm">
              {content.explore}
            </span>
          </AppLink>
        </div>
      </div>
    </div>
  );
}
