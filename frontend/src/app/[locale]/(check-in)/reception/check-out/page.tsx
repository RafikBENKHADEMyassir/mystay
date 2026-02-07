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
    roomName?: string | null;
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

const mockCheckoutData: CheckoutPreview = {
  stay: {
    id: "S-MOCK",
    confirmationNumber: "12345",
    roomNumber: "227",
    roomName: "Sea View Suite",
    checkIn: "2025-11-03",
    checkOut: "2025-11-12"
  },
  folio: {
    reservationId: "R-MOCK",
    currency: "EUR",
    balanceCents: 26000,
    charges: [
      { id: "1", date: "2025-11-04", description: "Lit supplémentaire", category: "extra", amountCents: 20000 },
      { id: "2", date: "2025-11-04", description: "Fleurs", category: "extra", amountCents: 6000 }
    ]
  }
};

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
  const [customTipCents, setCustomTipCents] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customUnit, setCustomUnit] = useState<"percent" | "amount">("percent");
  const [customValue, setCustomValue] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<CheckoutConfirmResult | null>(null);

  const strings = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Check-out",
        yourCheckout: "Votre check-out",
        room: "Chambre n°",
        checkIn: "Check-in",
        checkOut: "Check-out",
        details: "Détails",
        noExtras: "Aucun extra.",
        totalExtras: "Total des extras",
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
        thanks: "Le personnel de l’hôtel vous remercie pour votre pourboire de",
        removeTip: "Je veux retirer mon pourboire",
        viewInvoices: "Voir mes factures"
      };
    }
    return {
      title: "Check-out",
      yourCheckout: "Your check-out",
      room: "Room",
      checkIn: "Check-in",
      checkOut: "Check-out",
      details: "Details",
      noExtras: "No extras.",
      totalExtras: "Total extras",
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
      thanks: "Hotel staff thanks you for your tip of",
      removeTip: "I want to remove my tip",
      viewInvoices: "View invoices"
    };
  }, [locale]);

  useEffect(() => {
    if (!token && !overview && process.env.NODE_ENV !== "development") return;

    setIsLoading(true);
    setError(null);

    // In dev, if backend is unreachable, fallback to mock data
    const fetchPromise = (token && overview) 
      ? fetch(new URL("/api/v1/guest/checkout", apiBaseUrl).toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        })
      : Promise.reject("no_token");

    fetchPromise
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
        if (process.env.NODE_ENV === "development") {
          // Use mock data in development if fetch fails
          setData(mockCheckoutData);
        } else {
          const message = err instanceof Error ? err.message : "checkout_failed";
          setError(message);
        }
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
        return { 
          tipCents: Math.round((balanceCents * parsed) / 100), 
          label: `${Math.round(parsed)} % = ${formatMoney(locale, Math.round((balanceCents * parsed) / 100), currency)}` 
        };
      }
      const cents = parseMoneyToCents(customValue);
      if (cents === null) return { tipCents: 0, label: null };
      return { tipCents: cents, label: formatMoney(locale, cents, currency) };
    }

    if (customTipCents !== null) {
      return { tipCents: customTipCents, label: formatMoney(locale, customTipCents, currency) };
    }

    if (!presetTipPercent) return { tipCents: 0, label: null };
    const amount = Math.round((balanceCents * presetTipPercent) / 100);
    return { 
      tipCents: amount, 
      label: `${presetTipPercent} % = ${formatMoney(locale, amount, currency)}` 
    };
  }, [balanceCents, customMode, customUnit, customValue, currency, locale, presetTipPercent, customTipCents]);

  const totalCents = balanceCents + tipSelection.tipCents;
  const hasTip = tipSelection.tipCents > 0;

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
    } else if (customTipCents !== null) {
      payload.tipAmountCents = customTipCents;
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
            <p className="mt-4 text-base font-semibold text-foreground">{strings.thanks} <span className="font-bold">{formatMoney(locale, confirmed.totals.tipCents, confirmed.totals.currency)}</span>.</p>
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
        <h1 className="text-2xl font-semibold">{strings.yourCheckout}</h1>
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
                {strings.room}{" "}
                <span className="font-semibold text-foreground">{data.stay.roomNumber ?? "—"}</span>
              </p>
              <h2 className="text-xl font-semibold">{data.stay.roomName || "Suite"}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">{strings.checkIn}</p>
                  <p className="text-base font-medium text-foreground">{new Date(data.stay.checkIn).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p>9:00</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{strings.checkOut}</p>
                  <p className="text-base font-medium text-foreground">{new Date(data.stay.checkOut).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p>16:00</p>
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
                  <p className="text-sm text-muted-foreground">{strings.noExtras}</p>
                )}

                <div className="mt-2 border-t pt-2" />
                
                {hasTip ? (
                   <>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{strings.totalExtras}</span>
                      <span>{formatMoney(locale, balanceCents, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Pourboire</span>
                      <span>
                        {presetTipPercent && !customMode ? `${presetTipPercent} % = ` : ""}
                        {formatMoney(locale, tipSelection.tipCents, currency)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-lg font-semibold text-foreground">
                      <span>{strings.total}</span>
                      <span>{formatMoney(locale, totalCents, currency)}</span>
                    </div>
                   </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">{strings.total}</span>
                    <span className="text-lg font-semibold text-foreground">{formatMoney(locale, balanceCents, currency)}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              {hasTip && !customMode ? (
                 <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Heart className="mb-3 h-8 w-8 text-rose-600" />
                    <p className="font-medium text-foreground">
                      {strings.thanks} <span className="font-bold">{presetTipPercent ? `${presetTipPercent} %` : formatMoney(locale, tipSelection.tipCents, currency)}</span>.
                    </p>
                    <button 
                      onClick={() => {
                        setPresetTipPercent(null);
                        setCustomTipCents(null);
                        setCustomValue("");
                      }}
                      className="mt-3 text-sm text-muted-foreground underline decoration-muted-foreground/50 transition hover:text-foreground"
                    >
                      {strings.removeTip}
                    </button>
                 </div>
              ) : (
                <>
                  {!customMode && (
                    <div className="flex items-center justify-center mb-4">
                      <Smile className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {!customMode && (
                    <p className="text-center text-sm font-medium text-foreground mb-4">{strings.tipTitle}</p>
                  )}

                  {!customMode ? (
                    <div className="grid grid-cols-2 gap-3">
                      <TipButton
                        label={strings.percent5}
                        selected={presetTipPercent === 5}
                        onClick={() => {
                          setPresetTipPercent((current) => (current === 5 ? null : 5));
                          setCustomTipCents(null);
                        }}
                      />
                      <TipButton
                        label={strings.percent10}
                        selected={presetTipPercent === 10}
                        onClick={() => {
                          setPresetTipPercent((current) => (current === 10 ? null : 10));
                          setCustomTipCents(null);
                        }}
                      />
                      <TipButton
                        label={strings.percent15}
                        selected={presetTipPercent === 15}
                        onClick={() => {
                          setPresetTipPercent((current) => (current === 15 ? null : 15));
                          setCustomTipCents(null);
                        }}
                      />
                      <TipButton
                        label={strings.customize}
                        selected={customTipCents !== null || (presetTipPercent !== null && ![5, 10, 15].includes(presetTipPercent))}
                        onClick={() => {
                          setCustomMode(true);
                          setPresetTipPercent(null);
                          setCustomTipCents(null);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-md bg-muted/20 px-3 py-3">
                        <input
                          value={customValue}
                          onChange={(event) => setCustomValue(event.target.value)}
                          placeholder={strings.enterAmount}
                          className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                          autoFocus
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCustomUnit("percent")}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                              customUnit === "percent" ? "bg-black text-white" : "bg-muted text-foreground hover:bg-muted/80"
                            )}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomUnit("amount")}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                              customUnit === "amount" ? "bg-black text-white" : "bg-muted text-foreground hover:bg-muted/80"
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
                          className="w-full rounded-md border border-input bg-background py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {strings.back}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (customValue.trim()) {
                                if (customUnit === "percent") {
                                    const parsed = Number.parseFloat(customValue.replace(",", "."));
                                    if (Number.isFinite(parsed) && parsed >= 0) {
                                        setPresetTipPercent(parsed);
                                        setCustomTipCents(null);
                                    }
                                } else {
                                    const cents = parseMoneyToCents(customValue);
                                    if (cents !== null) {
                                        setCustomTipCents(cents);
                                        setPresetTipPercent(null);
                                    }
                                }
                                setCustomMode(false);
                            }
                          }}
                          className="w-full rounded-md bg-black py-2 text-sm font-medium text-white shadow hover:bg-black/90"
                        >
                          {strings.validate}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <button
              type="button"
              onClick={confirmCheckout}
              disabled={isConfirming}
              className="mt-6 w-full rounded-md bg-black py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {isConfirming
                ? "..."
                : `${strings.confirmPay}`}
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
        "flex h-12 w-full items-center justify-center rounded-md bg-muted/20 text-sm font-medium transition-colors hover:bg-muted/30",
        selected && "bg-muted text-foreground ring-1 ring-border"
      )}
    >
      {label}
    </button>
  );
}
