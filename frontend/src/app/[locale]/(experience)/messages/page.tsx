"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Topbar } from "@/components/layout/topbar";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  hotelId: string;
  stayId: string | null;
  department: string;
  status: string;
  title: string;
  assignedStaffUser?: { id: string; displayName: string | null; email: string | null } | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  unreadCount?: number;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const departments = [
  { id: "reception", labelFr: "Réception", labelEn: "Reception" },
  { id: "concierge", labelFr: "Concierge", labelEn: "Concierge" },
  { id: "housekeeping", labelFr: "Housekeeping", labelEn: "Housekeeping" },
  { id: "room-service", labelFr: "Room service", labelEn: "Room service" },
  { id: "spa-gym", labelFr: "Spa & Gym", labelEn: "Spa & Gym" },
  { id: "restaurants", labelFr: "Restaurants", labelEn: "Restaurants" }
] as const;

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strings = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Messagerie directe",
        intro: "Entrez directement en contact avec notre personnel. Nous sommes à l’écoute.",
        connect: "Démarrer le check‑in",
        refresh: "Actualiser",
        newChat: "Nouvelle conversation",
        noThreads: "Aucune conversation pour le moment.",
        offline: "Backend inaccessible. Démarrez le backend puis réessayez."
      };
    }
    return {
      title: "Direct messaging",
      intro: "Reach hotel staff instantly. We’re listening.",
      connect: "Start check-in",
      refresh: "Refresh",
      newChat: "New conversation",
      noThreads: "No conversations yet.",
      offline: "Backend unreachable. Start the backend then refresh."
    };
  }, [locale]);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  async function loadThreads(activeSession = session) {
    if (!activeSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/v1/threads", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });

      if (!response.ok) {
        setError("Could not load threads.");
        return;
      }

      const data = (await response.json()) as { items?: Thread[] };
      setThreads(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(strings.offline);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadThreads(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  function departmentTitle(departmentId: string) {
    const normalized = departmentId.trim().replace(/_/g, "-");
    const matched = departments.find((item) => item.id === normalized);
    if (matched) return locale === "fr" ? matched.labelFr : matched.labelEn;
    return normalized.replace(/[-_]/g, " ").trim() || normalized;
  }

  async function openDepartmentThread(departmentId: string) {
    if (!session || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const normalizedDepartment = departmentId.trim().replace(/_/g, "-");
      const response = await fetch(new URL("/api/v1/threads", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          hotelId: session.hotelId,
          stayId: session.stayId,
          department: normalizedDepartment,
          title: departmentTitle(normalizedDepartment)
        })
      });

      if (!response.ok) {
        setError("Could not create thread.");
        return;
      }

      const created = (await response.json()) as { id?: string };
      if (created.id) {
        router.push(withLocale(locale, `/messages/${created.id}`));
        return;
      }

      await loadThreads(session);
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const requestedDepartment = (searchParams?.get("department") ?? "").trim();
  const handledDepartment = useRef<string | null>(null);
  useEffect(() => {
    if (!session) return;
    if (!requestedDepartment) return;

    const normalized = requestedDepartment.replace(/_/g, "-");
    if (handledDepartment.current === normalized) return;
    handledDepartment.current = normalized;
    void openDepartmentThread(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedDepartment, session?.guestToken]);

  return (
    <div>
      <Topbar title={strings.title} subtitle={session?.hotelName ?? "Hôtel Four Seasons"} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        <p className="text-sm text-muted-foreground">{strings.intro}</p>

        {!session ? (
          <Button asChild className="w-full rounded-2xl">
            <Link href={withLocale(locale, "/reception/check-in")}>{strings.connect}</Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{session.hotelName}</Badge>
            {session.roomNumber ? <Badge variant="outline">Room {session.roomNumber}</Badge> : null}
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => loadThreads()} disabled={isLoading}>
              {isLoading ? (locale === "fr" ? "Chargement…" : "Loading…") : strings.refresh}
            </Button>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-4">
            {session ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{strings.newChat}</p>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map((dept) => (
                    <Button
                      key={dept.id}
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => openDepartmentThread(dept.id)}
                      disabled={isCreating}
                    >
                      {locale === "fr" ? dept.labelFr : dept.labelEn}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {!isLoading && session && threads.length === 0 ? (
              <p className="text-sm text-muted-foreground">{strings.noThreads}</p>
            ) : null}

            <div className="space-y-3">
              {threads.map((thread) => {
                const departmentLabel = departmentTitle(thread.department);
                const displayName = (thread.assignedStaffUser?.displayName ?? "").trim() || departmentLabel;
                const subtitle = departmentLabel;

                const unreadCount = typeof thread.unreadCount === "number" ? thread.unreadCount : 0;

                return (
                  <Link
                    key={thread.id}
                    href={withLocale(locale, `/messages/${thread.id}`)}
                    className="block rounded-2xl bg-white shadow-sm ring-1 ring-border transition hover:bg-muted/10"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="relative">
                        <Avatar alt={displayName} className="h-12 w-12" />
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                      </div>
                      {unreadCount ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-2 text-xs font-semibold text-background">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className="h-6 w-6" />
                      )}
                      <span className="text-muted-foreground">›</span>
                    </div>

                    {thread.lastMessage ? (
                      <div className={cn("flex items-center gap-2 px-4 pb-3")}>
                        <span className="inline-flex items-center rounded-full bg-muted/30 px-3 py-1 text-xs text-foreground ring-1 ring-border">
                          {thread.lastMessage}
                        </span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted/10 text-xs text-muted-foreground ring-1 ring-border">
                          +1
                        </span>
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
