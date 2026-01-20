"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, KeyRound, MessageCircle, Sparkles, Wifi, Hotel, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

type SessionData = {
  authenticated: boolean;
  user: {
    guestId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  stay: {
    hotelId: string;
    stayId: string;
  } | null;
};

type StayData = {
  hotelName: string;
  confirmationNumber: string;
  roomNumber: string | null;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
};

function formatDate(locale: string, value: Date) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", year: "numeric" }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Welcome screen for unauthenticated users
function WelcomeScreen({ locale }: { locale: string }) {
  const strings = locale === "fr" ? {
    title: "Bienvenue sur MySTAY",
    subtitle: "Votre expérience hôtelière, réinventée",
    signUp: "Créer un compte",
    signIn: "Se connecter",
    explore: "Explorer les hôtels"
  } : {
    title: "Welcome to MySTAY",
    subtitle: "Your hotel experience, reimagined",
    signUp: "Create Account",
    signIn: "Sign In",
    explore: "Explore Hotels"
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Hotel className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">{strings.title}</h1>
        <p className="mb-8 text-muted-foreground">{strings.subtitle}</p>
        <div className="flex flex-col gap-3">
          <Link href={withLocale(locale, "/signup")}>
            <Button className="w-full">
              {strings.signUp}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href={withLocale(locale, "/login")}>
            <Button variant="outline" className="w-full">
              {strings.signIn}
            </Button>
          </Link>
          <Link href={withLocale(locale, "/hotels")}>
            <Button variant="ghost" className="w-full text-muted-foreground">
              {strings.explore}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// No reservation screen
function NoReservationScreen({ locale, userName }: { locale: string; userName: string }) {
  const strings = locale === "fr" ? {
    greeting: `Bonjour ${userName}!`,
    title: "Pas de réservation active",
    description: "Liez une réservation pour accéder à tous les services de votre hôtel.",
    linkReservation: "Lier une réservation",
    explore: "Explorer les hôtels"
  } : {
    greeting: `Hello ${userName}!`,
    title: "No active reservation",
    description: "Link a reservation to access all hotel services.",
    linkReservation: "Link a Reservation",
    explore: "Explore Hotels"
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Hotel className="h-10 w-10 text-primary" />
        </div>
        <p className="mb-2 text-lg text-muted-foreground">{strings.greeting}</p>
        <h1 className="mb-3 text-2xl font-bold">{strings.title}</h1>
        <p className="mb-8 text-muted-foreground">{strings.description}</p>
        <div className="flex flex-col gap-3">
          <Link href={withLocale(locale, "/link-reservation")}>
            <Button className="w-full">
              {strings.linkReservation}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href={withLocale(locale, "/hotels")}>
            <Button variant="outline" className="w-full">
              {strings.explore}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [stayData, setStayData] = useState<StayData | null>(null);
  const [demoSession, setDemoSession] = useState<ReturnType<typeof getDemoSession>>(null);

  useEffect(() => {
    // Check for demo session first (backward compatibility)
    const demo = getDemoSession();
    if (demo) {
      setDemoSession(demo);
      setIsLoading(false);
      return;
    }

    // Check authentication
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: SessionData) => {
        setSession(data);
        // If user has a stay, we could fetch more details here
        // For now, we'll use the session data
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const strings = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Votre chambre",
        checkInButton: "Complétez votre check-in",
        roomLabel: "Chambre",
        guestsLabel: "Invités",
        adults: "adultes",
        children: "enfant",
        checkIn: "Check-in",
        checkOut: "Check-out",
        digitalKey: "Clé digitale de chambre",
        wifi: "Connexion Wi‑Fi",
        agenda: "Agenda",
        messages: "Messagerie",
        tailored: "Plaisirs sur mesure",
        history: "Historique de séjour et factures"
      };
    }

    return {
      title: "Your room",
      checkInButton: "Complete your check-in",
      roomLabel: "Room",
      guestsLabel: "Guests",
      adults: "adults",
      children: "child",
      checkIn: "Check-in",
      checkOut: "Check-out",
      digitalKey: "Digital room key",
      wifi: "Wi‑Fi",
      agenda: "Agenda",
      messages: "Messages",
      tailored: "Tailored experiences",
      history: "Stay history & invoices"
    };
  }, [locale]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - show welcome screen
  if (!session?.authenticated && !demoSession) {
    return <WelcomeScreen locale={locale} />;
  }

  // Authenticated but no reservation
  if (session?.authenticated && !session?.stay && !demoSession) {
    return <NoReservationScreen locale={locale} userName={session.user?.firstName ?? "Guest"} />;
  }

  // Has a stay (either from auth session or demo session)
  const roomNumber = demoSession?.roomNumber ?? "227";
  const adults = demoSession?.guests?.adults ?? 2;
  const children = demoSession?.guests?.children ?? 1;
  const checkInDate = parseDateOrNull(demoSession?.checkIn ?? null) ?? new Date("2025-11-03T09:00:00Z");
  const checkOutDate = parseDateOrNull(demoSession?.checkOut ?? null) ?? new Date("2025-11-12T16:00:00Z");
  const checkIn = formatDate(locale, checkInDate);
  const checkOut = formatDate(locale, checkOutDate);
  const hotelName = demoSession?.hotelName ?? "Hôtel Four Seasons";
  const confirmationNumber = demoSession?.confirmationNumber ?? "";
  const suiteName = "SEA VIEW SUITE";

  return (
    <div>
      <Topbar title={strings.title} subtitle={hotelName} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
          <div className="relative h-64 bg-gradient-to-br from-muted/60 via-muted/30 to-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.12),transparent_60%)]" />
            <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-foreground/70">{suiteName}</p>
                <div className="h-0.5 w-10 rounded-full bg-foreground/20" />
              </div>
              <Button asChild className="w-full rounded-2xl">
                <Link
                  href={
                    confirmationNumber
                      ? `${withLocale(locale, "/reception/check-in")}?confirmation=${encodeURIComponent(confirmationNumber)}`
                      : withLocale(locale, "/reception/check-in")
                  }
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/20">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  {strings.checkInButton}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {strings.roomLabel} <span className="font-semibold text-foreground">N° {roomNumber}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {strings.guestsLabel}{" "}
                <span className="font-semibold text-foreground">
                  {adults} {strings.adults} · {children} {strings.children}
                </span>
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs text-muted-foreground">
                {strings.checkIn} <span className="font-semibold text-foreground">{checkIn}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {strings.checkOut} <span className="font-semibold text-foreground">{checkOut}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-2 px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <QuickAction
                href={withLocale(locale, "/profile")}
                icon={<KeyRound className="h-4 w-4" />}
                label={strings.digitalKey}
              />
              <QuickAction
                href={withLocale(locale, "/agenda")}
                icon={<CalendarClock className="h-4 w-4" />}
                label={strings.agenda}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction
                href={withLocale(locale, "/profile")}
                icon={<Wifi className="h-4 w-4" />}
                label={strings.wifi}
              />
              <QuickAction
                href={withLocale(locale, "/messages")}
                icon={<MessageCircle className="h-4 w-4" />}
                label={strings.messages}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{strings.tailored}</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {["Fleurs", "Champagne", "Lettres", "Magazines", locale === "fr" ? "Vos espaces" : "Your spaces"].map(
              (label) => (
                <div
                  key={label}
                  className="min-w-[96px] rounded-2xl border bg-muted/20 px-3 py-4 text-center text-xs font-semibold text-foreground"
                >
                  {label}
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card">
          <Link
            href={withLocale(locale, "/profile")}
            className="flex items-center justify-between gap-3 px-4 py-4"
          >
            <span className="text-sm font-semibold text-foreground">{strings.history}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </main>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-background px-3 py-3 text-sm font-semibold text-foreground shadow-sm",
        "active:scale-[0.99]"
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted/40 text-foreground">
        {icon}
      </span>
      <span className="line-clamp-2 flex-1 text-xs">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
