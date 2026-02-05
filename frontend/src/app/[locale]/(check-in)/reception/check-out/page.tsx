"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Heart, Loader2, Smile } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type CheckoutPreview = {
  stay: {
    id: string;
    confirmationNumber: string;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
  };
  folio: {
    reservationId: string | null;
    currency: string;
    balanceCents: number;
    charges: Array<{
      id: string;
      date: string;
      description: string;
      category: string | null;
      amountCents: number;
    }>;
  };
};

type CheckoutConfirmResult = {
  ok: boolean;
  totals: { balanceCents: number; tipCents: number; totalCents: number; currency: string };
  invoice: { id: string; downloadUrl: string | null };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function formatMoney(locale: string, amountCents: number, currency: string) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(languageTag, { style: "currency", currency }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function parseMoneyToCents(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed * 100));
}

export default function CheckoutPage() {
  const locale = useLocale();
  const { token, overview, isLoading: isSessionLoading } = useGuestOverview();

  const [data, setData] = useState<CheckoutPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [presetTipPercent, setPresetTipPercent] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customUnit, setCustomUnit] = useState<"percent" | "amount">("percent");
  const [customValue, setCustomValue] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<CheckoutConfirmResult | null>(null);

  const strings = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Check-out",
        details: "Détails",
        total: "Total",
        tipTitle: "Laissez un pourboire au personnel de l’hôtel.",
        percent5: "5 %",
        percent10: "10 %",
        percent15: "15 %",
        customize: "Personnaliser",
        enterAmount: "Entrez un montant",
        back: "Retour",
        validate: "Valider",
        confirmPay: "Confirmer et payer",
        thanks: "Le personnel de l’hôtel vous remercie pour votre pourboire.",
        viewInvoices: "Voir mes factures"
      };
    }
    return {
      title: "Check-out",
      details: "Details",
      total: "Total",
      tipTitle: "Leave a tip for hotel staff.",
      percent5: "5%",
      percent10: "10%",
      percent15: "15%",
      customize: "Custom",
      enterAmount: "Enter an amount",
      back: "Back",
      validate: "Validate",
      confirmPay: "Confirm and pay",
      thanks: "Hotel staff thanks you for your tip.",
      viewInvoices: "View invoices"
    };
  }, [locale]);

  useEffect(() => {
    if (!token || !overview) return;

    setIsLoading(true);
    setError(null);

    fetch(new URL("/api/v1/guest/checkout", apiBaseUrl).toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          const code = typeof payload?.error === "string" ? payload.error : `checkout_failed_${res.status}`;
          throw new Error(code);
        }
        return (await res.json()) as CheckoutPreview;
      })
      .then((payload) => setData(payload))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "checkout_failed";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [overview, token]);

  const currency = data?.folio.currency ?? overview?.hotel.currency ?? "EUR";
  const balanceCents = data?.folio.balanceCents ?? 0;
  const displayCharges = useMemo(() => {
    const charges = data?.folio.charges ?? [];
    return charges.filter((c) => (c.category ?? "").toLowerCase() !== "room");
  }, [data?.folio.charges]);

  const tipSelection = useMemo(() => {
    if (customMode) {
      if (!customValue.trim()) return { tipCents: 0, label: null };
      if (customUnit === "percent") {
        const parsed = Number.parseFloat(customValue.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) return { tipCents: 0, label: null };
        return { tipCents: Math.round((balanceCents * parsed) / 100), label: `${parsed}%` };
      }
      const cents = parseMoneyToCents(customValue);
      if (cents === null) return { tipCents: 0, label: null };
      return { tipCents: cents, label: formatMoney(locale, cents, currency) };
    }

    if (!presetTipPercent) return { tipCents: 0, label: null };
    return { tipCents: Math.round((balanceCents * presetTipPercent) / 100), label: `${presetTipPercent}%` };
  }, [balanceCents, customMode, customUnit, customValue, currency, locale, presetTipPercent]);

  const totalCents = balanceCents + tipSelection.tipCents;

  async function confirmCheckout() {
    if (!token) return;
    setIsConfirming(true);
    setError(null);

    const payload: Record<string, unknown> = {};
    if (customMode) {
      if (customUnit === "percent") {
        const parsed = Number.parseFloat(customValue.replace(",", "."));
        if (Number.isFinite(parsed) && parsed >= 0) payload.tipPercent = parsed;
      } else {
        const cents = parseMoneyToCents(customValue);
        if (cents !== null) payload.tipAmountCents = cents;
      }
    } else if (presetTipPercent) {
      payload.tipPercent = presetTipPercent;
    }

    try {
      const res = await fetch(new URL("/api/v1/guest/checkout/confirm", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = (await res.json().catch(() => null)) as CheckoutConfirmResult | { error?: string } | null;
      if (!res.ok) {
        const code = typeof (data as { error?: string } | null)?.error === "string" ? (data as { error: string }).error : `checkout_failed_${res.status}`;
        throw new Error(code);
      }

      setConfirmed(data as CheckoutConfirmResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : "checkout_failed";
      setError(message);
    } finally {
      setIsConfirming(false);
    }
  }

  if (isSessionLoading || !overview) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hotelName = overview.hotel.name;

  if (confirmed?.ok) {
    return (
      <div>
        <Topbar title={strings.title} subtitle={hotelName} backHref={withLocale(locale, "/")} />
        <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-6">
          <div className="rounded-2xl bg-muted/10 p-6 text-center ring-1 ring-border">
            <Heart className="mx-auto h-10 w-10 text-rose-600" />
            <p className="mt-4 text-base font-semibold text-foreground">{strings.thanks}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatMoney(locale, confirmed.totals.totalCents, confirmed.totals.currency)}
            </p>
          </div>

          <Link
            href={withLocale(locale, "/profile")}
            className="flex items-center justify-between rounded-2xl bg-background px-4 py-4 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border"
          >
            <span>{strings.viewInvoices}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Topbar title={strings.title} subtitle={hotelName} backHref={withLocale(locale, "/")} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}

        {data ? (
          <>
            <section className="rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              <p className="text-sm text-muted-foreground">
                {locale === "fr" ? "Chambre n°" : "Room"}{" "}
                <span className="font-semibold text-foreground">{data.stay.roomNumber ?? "—"}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">{locale === "fr" ? "Check‑in" : "Check‑in"}</p>
                  <p>{data.stay.checkIn}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{locale === "fr" ? "Check‑out" : "Check‑out"}</p>
                  <p>{data.stay.checkOut}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              <p className="text-sm font-semibold text-foreground">{strings.details}</p>
              <div className="mt-3 space-y-2 rounded-xl bg-background px-4 py-3 shadow-sm ring-1 ring-border">
                {displayCharges.length ? (
                  displayCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{charge.description}</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(locale, charge.amountCents, currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{locale === "fr" ? "Aucun extra." : "No extras."}</p>
                )}

                <div className="mt-2 border-t pt-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">{strings.total}</span>
                  <span className="text-lg font-semibold text-foreground">{formatMoney(locale, balanceCents, currency)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background ring-1 ring-border">
                  <Smile className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{strings.tipTitle}</p>
              </div>

              {!customMode ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <TipButton
                    label={strings.percent5}
                    selected={presetTipPercent === 5}
                    onClick={() => setPresetTipPercent((current) => (current === 5 ? null : 5))}
                  />
                  <TipButton
                    label={strings.percent10}
                    selected={presetTipPercent === 10}
                    onClick={() => setPresetTipPercent((current) => (current === 10 ? null : 10))}
                  />
                  <TipButton
                    label={strings.percent15}
                    selected={presetTipPercent === 15}
                    onClick={() => setPresetTipPercent((current) => (current === 15 ? null : 15))}
                  />
                  <TipButton
                    label={strings.customize}
                    selected={false}
                    onClick={() => {
                      setCustomMode(true);
                      setPresetTipPercent(null);
                    }}
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3 ring-1 ring-border">
                    <input
                      value={customValue}
                      onChange={(event) => setCustomValue(event.target.value)}
                      placeholder={strings.enterAmount}
                      className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCustomUnit("percent")}
                        className={cn(
                          "h-9 w-9 rounded-xl text-sm font-semibold ring-1 ring-border",
                          customUnit === "percent" ? "bg-foreground text-background" : "bg-muted/20 text-foreground"
                        )}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomUnit("amount")}
                        className={cn(
                          "h-9 w-9 rounded-xl text-sm font-semibold ring-1 ring-border",
                          customUnit === "amount" ? "bg-foreground text-background" : "bg-muted/20 text-foreground"
                        )}
                      >
                        €
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMode(false);
                        setCustomValue("");
                      }}
                      className="w-full rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-foreground shadow-sm"
                    >
                      {strings.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomMode(false)}
                      className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
                    >
                      {strings.validate}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={confirmCheckout}
              disabled={isConfirming}
              className="mt-2 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
            >
              {isConfirming
                ? "..."
                : `${strings.confirmPay} • ${formatMoney(locale, totalCents, currency)}`}
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}

function TipButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-foreground shadow-sm",
        selected && "bg-foreground text-background"
      )}
    >
      {label}
    </button>
  );
}
