"use client";

import { AppLink } from "@/components/ui/app-link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";
import {
  formatDayName,
  formatTime,
  capitalizeFirstLetter,
  startOfDay,
  isSameDay,
  clampDay,
} from "@/lib/utils/date";
import type { AgendaEvent } from "@/types/overview";

type Props = {
  locale: Locale;
  content: Pick<
    GuestContent["pages"]["home"]["overview"],
    "viewAgenda" | "anotherTime" | "see" | "invitesYou" | "previousDayAria" | "nextDayAria"
  >;
  hotelName: string;
  events: AgendaEvent[];
  selectedDay: Date;
  stayStart: Date;
  stayEnd: Date;
  onDayChange: (day: Date) => void;
};

export function AgendaSection({
  locale,
  content,
  hotelName,
  events,
  selectedDay,
  stayStart,
  stayEnd,
  onDayChange,
}: Props) {
  const dayName = capitalizeFirstLetter(formatDayName(locale, selectedDay), locale);

  const canGoPrevDay = selectedDay.getTime() > stayStart.getTime();
  const canGoNextDay = selectedDay.getTime() < stayEnd.getTime();

  const dayEvents = events
    .filter((event) => isSameDay(startOfDay(new Date(event.startAt)), selectedDay))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 2);

  const handlePrevDay = () => {
    if (!canGoPrevDay) return;
    onDayChange(clampDay(new Date(selectedDay.getTime() - 86400000), stayStart, stayEnd));
  };

  const handleNextDay = () => {
    if (!canGoNextDay) return;
    onDayChange(clampDay(new Date(selectedDay.getTime() + 86400000), stayStart, stayEnd));
  };

  return (
    <div className="px-4 pb-4">
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={cn(
                "rounded-full p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                !canGoPrevDay && "pointer-events-none opacity-40"
              )}
              onClick={handlePrevDay}
              aria-label={content.previousDayAria}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold capitalize text-foreground">{dayName}</p>
            <button
              type="button"
              className={cn(
                "rounded-full p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                !canGoNextDay && "pointer-events-none opacity-40"
              )}
              onClick={handleNextDay}
              aria-label={content.nextDayAria}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <AppLink
            href={withLocale(locale, "/agenda")}
            className="text-xs font-medium text-muted-foreground hover:underline"
          >
            {content.viewAgenda}
          </AppLink>
        </div>

        {/* Timeline */}
        <div className="relative mt-3 pl-8">
          {/* Vertical Line */}
          <div className="absolute left-3 top-0 h-full w-px bg-border" />

          {dayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <div className="space-y-4">
              {dayEvents.map((event) => (
                <AgendaEventItem
                  key={event.id}
                  locale={locale}
                  hotelName={hotelName}
                  event={event}
                  strings={content}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type AgendaEventItemProps = {
  locale: Locale;
  hotelName: string;
  event: AgendaEvent;
  strings: {
    viewAgenda: string;
    anotherTime: string;
    see: string;
    invitesYou: string;
    previousDayAria: string;
    nextDayAria: string;
  };
};

function AgendaEventItem({ locale, hotelName, event, strings: t }: AgendaEventItemProps) {
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  const isInvite = event.type === "invite" || event.metadata?.variant === "invite";

  const href = (() => {
    const linkUrl = typeof event.metadata?.linkUrl === "string" ? event.metadata.linkUrl : null;
    if (linkUrl) return withLocale(locale, linkUrl);
    if (event.type === "spa") return withLocale(locale, "/spa-gym");
    if (event.type === "restaurant") return withLocale(locale, "/restaurants");
    if (event.type === "transfer") return withLocale(locale, "/concierge");
    return withLocale(locale, "/agenda");
  })();

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute -left-5 top-1 h-2 w-2 rounded-full border-2 bg-background",
          isInvite ? "border-foreground bg-foreground" : "border-border"
        )}
      />

      {isInvite ? (
        <div className="flex gap-3">
          <div className="w-10 text-[11px] leading-4 text-muted-foreground">
            <p>{formatTime(locale, start)}</p>
            {end ? <p className="mt-8">{formatTime(locale, end)}</p> : null}
          </div>
          <div className="flex-1 rounded-xl border border-border bg-background p-3">
            <p className="text-[11px] text-muted-foreground">
              {hotelName} {t.invitesYou}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-foreground">{event.title}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted/30"
              >
                {t.anotherTime}
              </button>
              <AppLink
                href={href}
                className="rounded-full bg-foreground px-4 py-1.5 text-[12px] font-semibold text-background"
              >
                {t.see}
              </AppLink>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 text-[11px] leading-4 text-muted-foreground">
            <p>{formatTime(locale, start)}</p>
            {end ? <p>{formatTime(locale, end)}</p> : null}
          </div>
          <AppLink
            href={href}
            className="flex flex-1 items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/30"
          >
            <span className="text-[12px] text-muted-foreground">{event.title}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </AppLink>
        </div>
      )}
    </div>
  );
}
