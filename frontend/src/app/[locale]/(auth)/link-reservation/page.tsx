"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Hotel } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

function getLinkStrings(locale: string) {
  if (locale === "fr") {
    return {
      topbarTitle: "Lier une réservation",
      title: "Associez votre réservation",
      subtitle: "Entrez votre numéro de confirmation pour accéder aux services de votre hôtel",
      confirmationLabel: "Numéro de confirmation",
      confirmationPlaceholder: "Ex: ABC123456",
      link: "Lier la réservation",
      skip: "Explorer les hôtels",
      noReservation: "Pas encore de réservation ?",
      exploreHotels: "Découvrez nos hôtels partenaires",
      required: "Ce champ est requis",
      notFound: "Aucune réservation trouvée avec ce numéro",
      unexpectedError: "Une erreur inattendue s'est produite"
    };
  }

  return {
    topbarTitle: "Link Reservation",
    title: "Link your reservation",
    subtitle: "Enter your confirmation number to access your hotel services",
    confirmationLabel: "Confirmation number",
    confirmationPlaceholder: "e.g. ABC123456",
    link: "Link Reservation",
    skip: "Explore Hotels",
    noReservation: "No reservation yet?",
    exploreHotels: "Discover our partner hotels",
    required: "This field is required",
    notFound: "No reservation found with this number",
    unexpectedError: "An unexpected error occurred"
  };
}

function requiredMessage(locale: string) {
  return locale === "fr" ? "Ce champ est requis" : "This field is required";
}

export default function LinkReservationPage() {
  const locale = useLocale();
  const router = useRouter();

  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strings = useMemo(() => getLinkStrings(locale), [locale]);

  const confirmationError = submitted && !confirmationNumber.trim() ? requiredMessage(locale) : null;

  async function handleLink() {
    setSubmitted(true);
    setError(null);

    if (!confirmationNumber.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/link-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationNumber })
      });

      const data = await res.json();

      if (res.ok) {
        router.push(withLocale(locale, "/"));
      } else {
        if (data.error === "reservation_not_found") {
          setError(strings.notFound);
        } else {
          setError(data.error || strings.unexpectedError);
        }
      }
    } catch {
      setError(strings.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Topbar 
        title={strings.topbarTitle} 
        backHref={withLocale(locale, "/")} 
      />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        <div className="flex flex-col items-center pt-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/40">
            <Hotel className="h-10 w-10 text-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">{strings.title}</h1>
          <p className="text-sm text-muted-foreground">{strings.subtitle}</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
          <LabeledField
            label={strings.confirmationLabel}
            value={confirmationNumber}
            onChange={setConfirmationNumber}
            placeholder={strings.confirmationPlaceholder}
            error={confirmationError}
          />
        </section>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLink}
            disabled={isLoading}
            className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
          >
            {isLoading ? "..." : strings.link}
          </button>
          <Link
            href={withLocale(locale, "/hotels")}
            className="w-full rounded-2xl border border-border bg-background py-3 text-center text-sm font-semibold text-foreground shadow-sm"
          >
            {strings.skip}
          </Link>
        </div>

        <p className="pt-4 text-center text-sm text-muted-foreground">
          {strings.noReservation}{" "}
          <Link href={withLocale(locale, "/hotels")} className="font-semibold text-foreground underline">
            {strings.exploreHotels}
          </Link>
        </p>
      </main>
    </div>
  );
}

type LabeledFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
};

function LabeledField({ label, value, onChange, placeholder, type = "text", error }: LabeledFieldProps) {
  return (
    <div className="space-y-1">
      <div
        className={cn(
          "relative rounded-xl bg-background px-4 py-3 shadow-sm ring-1 ring-border",
          error && "ring-destructive"
        )}
      >
        <p className="text-xs text-muted-foreground">{label}</p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          className={cn(
            "mt-1 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70",
            error && "pr-10"
          )}
        />
        {error ? <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" /> : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
