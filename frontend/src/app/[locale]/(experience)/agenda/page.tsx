"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Leaf,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { AppLink } from "@/components/ui/app-link";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";
import {
  clampDay,
  formatTime,
  parseDateOrNull,
  startOfDay,
} from "@/lib/utils/date";

type EventItem = {
  id: string;
  type: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
};

type AgendaPageContent = NonNullable<
  ReturnType<typeof useGuestContent>["content"]
>["pages"]["agenda"];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(value: Date, amount: number): Date {
  return startOfDay(new Date(value.getTime() + amount * DAY_MS));
}

function startOfWeek(value: Date): Date {
  const day = startOfDay(value);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

function toDayKey(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocaleTag(locale: Locale): string {
  if (locale === "fr") return "fr-FR";
  if (locale === "es") return "es-ES";
  return "en-US";
}

const WEEKDAY_KEYS = ["L", "M", "M", "J", "V", "S", "D"];

function normalizeMetadata(
  input: EventItem["metadata"]
): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? input
    : {};
}

function readMetadataText(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const val = metadata[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

function isInviteEvent(event: EventItem): boolean {
  const md = normalizeMetadata(event.metadata);
  const variant = readMetadataText(md, "variant")?.toLowerCase();
  const kind = readMetadataText(md, "kind")?.toLowerCase();
  return (
    event.type === "invite" ||
    variant === "invite" ||
    kind === "suggestion"
  );
}

function isInviteActionable(event: EventItem): boolean {
  if (!isInviteEvent(event)) return false;
  return !["confirmed", "declined", "cancelled"].includes(
    event.status
  );
}

function resolveEventHref(locale: Locale, event: EventItem): string {
  const md = normalizeMetadata(event.metadata);
  const linkUrl = readMetadataText(md, "linkUrl");
  if (linkUrl) {
    const normalized = linkUrl.startsWith("/")
      ? linkUrl
      : `/${linkUrl}`;
    return withLocale(locale, normalized);
  }
  if (event.type === "spa" || event.type === "spa-gym")
    return withLocale(locale, "/spa");
  if (event.type === "gym") return withLocale(locale, "/gym");
  if (event.type === "restaurant")
    return withLocale(locale, "/restaurants");
  if (event.type === "transfer")
    return withLocale(locale, "/concierge");
  if (event.type === "housekeeping")
    return withLocale(locale, "/housekeeping");
  return withLocale(locale, "/agenda");
}

function minutesUntil(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.round(
    (d.getTime() - Date.now()) / 60000
  );
  return diff > 0 && diff < 120 ? diff : null;
}

function isWithinRange(
  day: Date,
  from: Date,
  to: Date
): boolean {
  const val = startOfDay(day).getTime();
  return val >= from.getTime() && val <= to.getTime();
}

function startOfMonth(value: Date): Date {
  return startOfDay(
    new Date(value.getFullYear(), value.getMonth(), 1)
  );
}

function endOfMonth(value: Date): Date {
  return startOfDay(
    new Date(value.getFullYear(), value.getMonth() + 1, 0)
  );
}

export default function AgendaPage() {
  const locale = useLocale();

  const [session, setSession] = useState<ReturnType<
    typeof getDemoSession
  > | null>(null);
  const [anchorDay, setAnchorDay] = useState<Date>(() =>
    startOfDay(new Date())
  );
  const [monthExpanded, setMonthExpanded] = useState(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingEventId, setRespondingEventId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  const { content, isLoading } = useGuestContent(
    locale,
    session?.hotelId
  );
  const page = content?.pages.agenda;

  const stayStart = useMemo(() => {
    const parsed = parseDateOrNull(session?.checkIn);
    return parsed ? startOfDay(parsed) : null;
  }, [session?.checkIn]);

  const stayEnd = useMemo(() => {
    const parsed = parseDateOrNull(session?.checkOut);
    return parsed ? startOfDay(parsed) : null;
  }, [session?.checkOut]);

  useEffect(() => {
    if (!stayStart || !stayEnd) return;
    setAnchorDay((c) => clampDay(c, stayStart, stayEnd));
  }, [stayStart, stayEnd]);

  const weekStart = useMemo(
    () => startOfWeek(anchorDay),
    [anchorDay]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const anchorKey = toDayKey(anchorDay);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(toLocaleTag(locale), {
        weekday: "long",
        day: "numeric",
        month: "short",
      }).format(anchorDay);
    } catch {
      return anchorKey;
    }
  }, [locale, anchorDay, anchorKey]);

  const monthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(toLocaleTag(locale), {
        month: "long",
      }).format(anchorDay);
    } catch {
      return "";
    }
  }, [locale, anchorDay]);

  const monthGrid = useMemo(() => {
    if (!monthExpanded) return [];
    const ms = startOfMonth(anchorDay);
    const me = endOfMonth(anchorDay);
    const firstWeekStart = startOfWeek(ms);
    const rows: Date[][] = [];
    let current = firstWeekStart;
    while (current.getTime() <= me.getTime() || rows.length < 5) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(current);
        current = addDays(current, 1);
      }
      rows.push(week);
      if (current.getTime() > me.getTime() && rows.length >= 5)
        break;
    }
    return rows;
  }, [monthExpanded, anchorDay]);

  // Fetch range: when month expanded, fetch month; otherwise just the day
  const fetchFrom = monthExpanded
    ? startOfMonth(anchorDay)
    : anchorDay;
  const fetchTo = monthExpanded
    ? endOfMonth(anchorDay)
    : anchorDay;

  async function loadEvents(
    s = session,
    from = fetchFrom,
    to = fetchTo
  ) {
    if (!s || !page) return;
    setIsLoadingEvents(true);
    setError(null);
    try {
      const url = new URL("/api/v1/events", apiBaseUrl);
      url.searchParams.set("stayId", s.stayId);
      url.searchParams.set("from", toDayKey(from));
      url.searchParams.set("to", toDayKey(to));
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${s.guestToken}` },
      });
      if (!res.ok) {
        setError(page.errors.loadAgenda);
        return;
      }
      const data = (await res.json()) as {
        items?: EventItem[];
      };
      setEvents(
        Array.isArray(data.items) ? data.items : []
      );
    } catch {
      setError(page.errors.backendUnreachable);
    } finally {
      setIsLoadingEvents(false);
    }
  }

  useEffect(() => {
    if (!session || !page) return;
    void loadEvents(session, fetchFrom, fetchTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.stayId,
    page?.title,
    fetchFrom.getTime(),
    fetchTo.getTime(),
  ]);

  async function respondToInvite(
    eventId: string,
    action: "accept" | "decline"
  ) {
    if (!session || !page) return;
    setRespondingEventId(eventId);
    setError(null);
    try {
      const res = await fetch(
        new URL(
          `/api/v1/events/${encodeURIComponent(eventId)}/respond`,
          apiBaseUrl
        ).toString(),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.guestToken}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      if (!res.ok) {
        setError(page.errors.respondAction);
        return;
      }
      const payload = (await res.json()) as {
        item?: EventItem | null;
      };
      if (payload.item) {
        setEvents((c) =>
          c.map((e) => (e.id === eventId ? payload.item! : e))
        );
      } else {
        await loadEvents();
      }
    } catch {
      setError(page.errors.respondAction);
    } finally {
      setRespondingEventId(null);
    }
  }

  const milestoneEvents = useMemo(() => {
    if (!page || !session) return [] as EventItem[];
    const items: EventItem[] = [];
    const checkIn = parseDateOrNull(session.checkIn);
    const checkOut = parseDateOrNull(session.checkOut);
    if (checkIn) {
      const at = new Date(
        checkIn.getFullYear(),
        checkIn.getMonth(),
        checkIn.getDate(),
        15,
        0,
        0
      );
      if (
        isWithinRange(at, fetchFrom, fetchTo)
      ) {
        items.push({
          id: "milestone-check-in",
          type: "milestone",
          title: page.milestones.checkIn,
          startAt: at.toISOString(),
          endAt: null,
          status: "scheduled",
        });
      }
    }
    if (checkOut) {
      const at = new Date(
        checkOut.getFullYear(),
        checkOut.getMonth(),
        checkOut.getDate(),
        11,
        0,
        0
      );
      if (
        isWithinRange(at, fetchFrom, fetchTo)
      ) {
        items.push({
          id: "milestone-check-out",
          type: "milestone",
          title: page.milestones.checkOut,
          startAt: at.toISOString(),
          endAt: null,
          status: "scheduled",
        });
      }
    }
    return items;
  }, [page, session, fetchFrom, fetchTo]);

  const dayEvents = useMemo(() => {
    const all = [...events, ...milestoneEvents].filter((e) => {
      const d = new Date(e.startAt);
      return toDayKey(d) === anchorKey;
    });
    return all.sort(
      (a, b) =>
        new Date(a.startAt).getTime() -
        new Date(b.startAt).getTime()
    );
  }, [events, milestoneEvents, anchorKey]);

  const eventDayKeys = useMemo(() => {
    const keys = new Set<string>();
    [...events, ...milestoneEvents].forEach((e) => {
      const d = new Date(e.startAt);
      keys.add(toDayKey(d));
    });
    return keys;
  }, [events, milestoneEvents]);

  const canGoPrev =
    !stayStart ||
    addDays(anchorDay, -1).getTime() >= stayStart.getTime();
  const canGoNext =
    !stayEnd ||
    addDays(anchorDay, 1).getTime() <= stayEnd.getTime();

  function goPrev() {
    setAnchorDay((c) => {
      const next = addDays(c, -1);
      return stayStart && stayEnd
        ? clampDay(next, stayStart, stayEnd)
        : next;
    });
  }
  function goNext() {
    setAnchorDay((c) => {
      const next = addDays(c, 1);
      return stayStart && stayEnd
        ? clampDay(next, stayStart, stayEnd)
        : next;
    });
  }

  if (isLoading || !page) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white px-5 py-8">
        <div className="rounded-[6px] border border-black/[0.06] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <h1 className="text-[24px] font-light leading-tight text-black/75">
            {page.title}
          </h1>
          <p className="mt-3 text-[15px] text-black/50">
            {page.connectStay}
          </p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white"
          >
            {page.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Topbar */}
      <div className="pointer-events-none sticky top-0 z-20">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-2.5 pr-4"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0.75) 25%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0) 100%)",
            backgroundSize: "100% 90px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <AppLink
            href={withLocale(locale, "/")}
            className="flex items-center gap-3 rounded-lg p-2"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
            <span className="text-[20px] tracking-[-0.2px] text-black">
              {page.title}
            </span>
          </AppLink>
          <Leaf className="h-8 w-8 text-black/70" />
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Date header */}
        <div className="flex items-center justify-between">
          {!monthExpanded ? (
            <p className="text-[20px] font-light leading-[1.15] capitalize text-black">
              {dateLabel}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="text-black/40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-[20px] font-light capitalize text-black">
                {monthLabel}
              </p>
              <button
                type="button"
                onClick={goNext}
                className="text-black/40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMonthExpanded((c) => !c)}
            className="flex items-center gap-1 text-black/50"
          >
            <Calendar className="h-5 w-5" />
            {monthExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Week strip or Month grid */}
        {!monthExpanded ? (
          <div className="mt-3">
            <div className="grid grid-cols-7 gap-0">
              {weekDays.map((day, idx) => {
                const key = toDayKey(day);
                const isSelected = key === anchorKey;
                const hasEvents = eventDayKeys.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAnchorDay(day)}
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <span className="text-[13px] text-black/50">
                      {WEEKDAY_KEYS[idx]}
                    </span>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-[15px]",
                        isSelected
                          ? "bg-black text-white"
                          : "text-black"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        hasEvents && !isSelected
                          ? "bg-black/50"
                          : "bg-transparent"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <div className="grid grid-cols-7 gap-0 text-center">
              {WEEKDAY_KEYS.map((k, i) => (
                <span
                  key={i}
                  className="py-1 text-[13px] font-medium text-black/50"
                >
                  {k}
                </span>
              ))}
            </div>
            {monthGrid.map((week, wi) => (
              <div
                key={wi}
                className="grid grid-cols-7 gap-0"
              >
                {week.map((day) => {
                  const key = toDayKey(day);
                  const isSelected = key === anchorKey;
                  const isCurrentMonth =
                    day.getMonth() === anchorDay.getMonth();
                  const hasEvents = eventDayKeys.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setAnchorDay(day);
                        setMonthExpanded(false);
                      }}
                      className="flex flex-col items-center gap-0.5 py-1.5"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-[15px]",
                          isSelected
                            ? "bg-black text-white"
                            : isCurrentMonth
                              ? "text-black"
                              : "text-black/30"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <span
                        className={cn(
                          "h-1 w-1 rounded-full",
                          hasEvents && !isSelected
                            ? "bg-black/50"
                            : "bg-transparent"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-[#b70926]">{error}</p>
        )}

        {/* Timeline */}
        {isLoadingEvents ? (
          <div className="mt-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-black/30" />
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-[15px] text-black/50">
              {page.emptyTitle}
            </p>
            <p className="mt-1 text-[14px] text-black/30">
              {page.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="mt-6">
            {dayEvents.map((event, idx) => (
              <TimelineEvent
                key={event.id}
                locale={locale}
                page={page}
                event={event}
                isLast={idx === dayEvents.length - 1}
                isResponding={respondingEventId === event.id}
                onRespond={respondToInvite}
              />
            ))}
          </div>
        )}

        {/* Prev/Next day navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            className={cn(
              "flex items-center gap-1 text-[15px] text-black/50",
              !canGoPrev && "opacity-30"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{page.previousRangeAria}</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className={cn(
              "flex items-center gap-1 text-[15px] text-black/50",
              !canGoNext && "opacity-30"
            )}
          >
            <span>{page.nextRangeAria}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({
  locale,
  page,
  event,
  isLast,
  isResponding,
  onRespond,
}: {
  locale: Locale;
  page: AgendaPageContent;
  event: EventItem;
  isLast: boolean;
  isResponding: boolean;
  onRespond: (id: string, action: "accept" | "decline") => void;
}) {
  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : null;
  const startTime = Number.isNaN(startDate.getTime())
    ? "--:--"
    : formatTime(locale, startDate);
  const endTime =
    endDate && !Number.isNaN(endDate.getTime())
      ? formatTime(locale, endDate)
      : null;

  const invite = isInviteEvent(event);
  const actionable = isInviteActionable(event);
  const href = resolveEventHref(locale, event);
  const countdown = minutesUntil(event.startAt);
  const md = normalizeMetadata(event.metadata);
  const hotelInviter = readMetadataText(md, "inviter", "contact");

  if (invite) {
    return (
      <div className="flex gap-3">
        {/* Time column */}
        <div className="flex w-[44px] shrink-0 flex-col items-end">
          <span className="text-[13px] leading-[1.15] text-black/50">
            {startTime}
          </span>
          {!isLast && (
            <div className="mx-auto mt-1 flex-1 border-l border-black/10" />
          )}
          {endTime && (
            <span className="text-[13px] leading-[1.15] text-black/50">
              {endTime}
            </span>
          )}
        </div>
        {/* Card */}
        <div className="mb-4 flex-1 overflow-hidden rounded-[6px] border border-black/[0.06] bg-black p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          {hotelInviter && (
            <p className="text-[13px] leading-[1.15] text-white/70">
              {hotelInviter}
            </p>
          )}
          <p className="mt-1 text-[15px] font-medium leading-[1.15] text-white">
            {event.title}
          </p>
          {actionable && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onRespond(event.id, "decline")}
                disabled={isResponding}
                className="rounded-[6px] bg-white py-2.5 text-[14px] font-medium text-black disabled:opacity-50"
              >
                {isResponding
                  ? page.actions.responding
                  : page.actions.decline}
              </button>
              <button
                type="button"
                onClick={() => onRespond(event.id, "accept")}
                disabled={isResponding}
                className="rounded-[6px] bg-white py-2.5 text-[14px] font-medium text-black disabled:opacity-50"
              >
                {isResponding
                  ? page.actions.responding
                  : page.actions.viewDetails}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Time column */}
      <div className="flex w-[44px] shrink-0 flex-col items-end">
        <span className="text-[13px] leading-[1.15] text-black/50">
          {startTime}
        </span>
        {!isLast && (
          <div className="mx-auto mt-1 flex-1 border-l border-black/10" />
        )}
        {endTime && (
          <span className="text-[13px] leading-[1.15] text-black/50">
            {endTime}
          </span>
        )}
      </div>
      {/* Card */}
      <div className="mb-4 flex-1">
        <AppLink
          href={href}
          className="flex items-center justify-between rounded-[6px] border border-black/[0.06] bg-white px-3 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-[1.15] text-black">
              {event.title}
            </p>
            {countdown !== null && (
              <p className="mt-1 text-[13px] leading-[1.15] text-black/50">
                ({page.labels.duration}: {countdown}m)
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-black/30" />
        </AppLink>

        {/* Suggestion between events */}
        {event.type === "transfer" && (
          <div className="mt-3 flex items-start gap-2 px-1">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-black/30" />
            <p className="text-[13px] leading-[1.35] text-black/40">
              {page.notifications.preEventText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
