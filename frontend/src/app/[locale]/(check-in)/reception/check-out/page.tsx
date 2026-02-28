"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLink } from "@/components/ui/app-link";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Leaf,
  Loader2,
  Smile,
} from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { SignaturePad } from "@/components/signature/signature-pad";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import type { Locale } from "@/lib/i18n/locales";
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
  totals: {
    balanceCents: number;
    tipCents: number;
    totalCents: number;
    currency: string;
  };
  invoice: { id: string; downloadUrl: string | null };
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function formatMoney(
  locale: string,
  amountCents: number,
  currency: string
) {
  const languageTag = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
  try {
    return new Intl.NumberFormat(languageTag, {
      style: "currency",
      currency,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function formatStayDate(locale: string, dateStr: string) {
  const languageTag = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(languageTag, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
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
  const {
    token,
    overview,
    isLoading: isSessionLoading,
  } = useGuestOverview();
  const { content } = useGuestContent(locale, overview?.hotel?.id);
  const strings = content?.pages.checkOut;

  const [data, setData] = useState<CheckoutPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [presetTipPercent, setPresetTipPercent] = useState<number | null>(
    null
  );
  const [customTipCents, setCustomTipCents] = useState<number | null>(
    null
  );
  const [customMode, setCustomMode] = useState(false);
  const [customUnit, setCustomUnit] = useState<"percent" | "amount">(
    "percent"
  );
  const [customValue, setCustomValue] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] =
    useState<CheckoutConfirmResult | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureDone, setSignatureDone] = useState(false);

  useEffect(() => {
    if (!strings || !token || !overview) return;

    setIsLoading(true);
    setError(null);

    fetch(
      new URL("/api/v1/guest/checkout", apiBaseUrl).toString(),
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("checkout_failed");
        return (await res.json()) as CheckoutPreview;
      })
      .then((payload) => setData(payload))
      .catch(() => setError(strings.errors.couldNotLoad))
      .finally(() => setIsLoading(false));
  }, [overview, strings, token]);

  const currency =
    data?.folio.currency ?? overview?.hotel.currency ?? "EUR";
  const balanceCents = data?.folio.balanceCents ?? 0;

  const displayCharges = useMemo(() => {
    const charges = data?.folio.charges ?? [];
    return charges.filter(
      (c) => (c.category ?? "").toLowerCase() !== "room"
    );
  }, [data?.folio.charges]);

  const tipSelection = useMemo(() => {
    if (customMode) {
      if (!customValue.trim()) return { tipCents: 0, label: null };
      if (customUnit === "percent") {
        const parsed = Number.parseFloat(
          customValue.replace(",", ".")
        );
        if (!Number.isFinite(parsed) || parsed < 0)
          return { tipCents: 0, label: null };
        const cents = Math.round((balanceCents * parsed) / 100);
        return {
          tipCents: cents,
          label: `${Math.round(parsed)} % = ${formatMoney(locale, cents, currency)}`,
        };
      }
      const cents = parseMoneyToCents(customValue);
      if (cents === null) return { tipCents: 0, label: null };
      return {
        tipCents: cents,
        label: formatMoney(locale, cents, currency),
      };
    }

    if (customTipCents !== null) {
      return {
        tipCents: customTipCents,
        label: formatMoney(locale, customTipCents, currency),
      };
    }

    if (!presetTipPercent) return { tipCents: 0, label: null };
    const amount = Math.round(
      (balanceCents * presetTipPercent) / 100
    );
    return {
      tipCents: amount,
      label: `${presetTipPercent} % = ${formatMoney(locale, amount, currency)}`,
    };
  }, [
    balanceCents,
    customMode,
    customUnit,
    customValue,
    currency,
    locale,
    presetTipPercent,
    customTipCents,
  ]);

  const totalCents = balanceCents + tipSelection.tipCents;
  const hasTip = tipSelection.tipCents > 0;

  function removeTip() {
    setPresetTipPercent(null);
    setCustomTipCents(null);
    setCustomValue("");
    setCustomMode(false);
  }

  async function confirmCheckout() {
    if (!token || !strings) return;
    setIsConfirming(true);
    setError(null);

    const payload: Record<string, unknown> = {};
    if (customMode) {
      if (customUnit === "percent") {
        const parsed = Number.parseFloat(
          customValue.replace(",", ".")
        );
        if (Number.isFinite(parsed) && parsed >= 0)
          payload.tipPercent = parsed;
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
      const res = await fetch(
        new URL(
          "/api/v1/guest/checkout/confirm",
          apiBaseUrl
        ).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = (await res
        .json()
        .catch(() => null)) as CheckoutConfirmResult | null;
      if (!res.ok) throw new Error("checkout_confirm_failed");
      setConfirmed(result);
      setShowSignature(true);
    } catch {
      setError(strings.errors.couldNotConfirm);
    } finally {
      setIsConfirming(false);
    }
  }

  if (isSessionLoading || !overview || !strings) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black/30" />
      </div>
    );
  }

  const hotelName = overview.hotel.name;

  /* ---- Signature step ---- */
  if (confirmed?.ok && showSignature && !signatureDone) {
    return (
      <div className="min-h-screen bg-white">
        <CheckoutTopbar
          title={strings.title}
          subtitle={hotelName}
          locale={locale}
        />

        <main className="mx-auto max-w-md px-4 pb-10 pt-4">
          <SignaturePad
            title={strings.signature.title}
            subtitle={strings.signature.subtitle}
            clearLabel={strings.signature.clear}
            continueLabel={strings.signature.continue}
            requiredError={strings.signature.required}
            icon={
              <svg className="h-14 w-14" fill="none" viewBox="0 0 56 56" stroke="currentColor" strokeWidth="1.2">
                <rect x="8" y="6" width="30" height="38" rx="2" />
                <path d="M14 14h18M14 20h12M14 26h16" strokeLinecap="round" />
                <path d="M32 30c4 -8 12 -6 10 2s-10 12-18 14" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            }
            onConfirm={() => setSignatureDone(true)}
          />
        </main>
      </div>
    );
  }

  /* ---- Confirmed state ---- */
  if (confirmed?.ok) {
    const tipPercent = presetTipPercent ?? null;
    const tipLabel = tipPercent
      ? `${tipPercent} %`
      : formatMoney(
          locale,
          confirmed.totals.tipCents,
          confirmed.totals.currency
        );

    return (
      <div className="min-h-screen bg-white">
        <CheckoutTopbar
          title={strings.title}
          subtitle={hotelName}
          locale={locale}
        />

        <main className="px-4 pb-10 pt-4">
          <div className="rounded-[6px] border border-black/[0.06] bg-white p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            <Heart className="mx-auto h-12 w-12 text-rose-500" />
            <p className="mt-4 text-[15px] leading-[1.25] text-black">
              {strings.thanks}{" "}
              <span className="font-semibold">{tipLabel}</span>.
            </p>
          </div>

          <AppLink
            href={withLocale(locale, "/profile/history")}
            className="mt-4 flex items-center justify-between rounded-[6px] border border-black/[0.06] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
          >
            <span className="text-[15px] font-medium text-black">
              {strings.viewInvoices}
            </span>
            <ChevronRight className="h-4 w-4 text-black/40" />
          </AppLink>
        </main>
      </div>
    );
  }

  /* ---- Main checkout screen ---- */
  return (
    <div className="min-h-screen bg-white">
      <CheckoutTopbar
        title={strings.title}
        subtitle={hotelName}
        locale={locale}
      />

      <main className="px-4 pb-10 pt-4">
        {/* Progress bar */}
        <div className="h-px w-full bg-black" />

        {/* Title */}
        <h1 className="mt-4 text-[24px] font-light leading-[1.15] tracking-[-0.24px] text-black/75">
          {strings.yourCheckout}
        </h1>

        {error && (
          <p className="mt-3 text-sm text-[#b70926]">{error}</p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-black/30" />
          </div>
        )}

        {data && (
          <>
            {/* Room Info */}
            <section className="mt-8 space-y-4 pb-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              <div className="space-y-1">
                <p className="text-[15px] leading-[1.15] text-black/50">
                  {strings.roomLabel}° {data.stay.roomNumber ?? "—"}
                </p>
                <p className="text-[18px] leading-[1.25] text-black">
                  {data.stay.roomName || strings.roomNameFallback}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[15px] leading-[1.15] text-black/50">
                    {strings.checkInLabel}
                  </p>
                  <p
                    className="text-[18px] leading-[1.25] text-black"
                    style={{ fontFeatureSettings: "'ordn'" }}
                  >
                    {formatStayDate(locale, data.stay.checkIn)}
                  </p>
                  <p className="text-[18px] leading-[1.25] text-black">
                    {strings.checkInTime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[15px] leading-[1.15] text-black/50">
                    {strings.checkOutLabel}
                  </p>
                  <p
                    className="text-[18px] leading-[1.25] text-black"
                    style={{ fontFeatureSettings: "'ordn'" }}
                  >
                    {formatStayDate(locale, data.stay.checkOut)}
                  </p>
                  <p className="text-[18px] leading-[1.25] text-black">
                    {strings.checkOutTime}
                  </p>
                </div>
              </div>
            </section>

            {/* Details Card */}
            <section className="mt-4 rounded-[6px] border border-black/[0.06] bg-white px-3 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              <p className="text-[15px] font-medium leading-[1.25] text-black">
                {strings.detailsTitle}
              </p>

              <div className="mt-4 space-y-3">
                {displayCharges.length ? (
                  displayCharges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-baseline justify-between gap-2 text-[15px] leading-[1.15] text-black/50"
                    >
                      <span className="flex-1">
                        {charge.description}
                      </span>
                      <span className="shrink-0">
                        {formatMoney(
                          locale,
                          charge.amountCents,
                          currency
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[15px] text-black/50">
                    {strings.noExtras}
                  </p>
                )}

                {/* Separator */}
                <div className="py-2">
                  <div className="h-[2px] rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
                </div>

                {hasTip ? (
                  <>
                    <div className="flex items-baseline justify-between text-[15px] leading-[1.15] text-black/50">
                      <span>{strings.totalExtras}</span>
                      <span>
                        {formatMoney(
                          locale,
                          balanceCents,
                          currency
                        )}
                      </span>
                    </div>

                    <div className="py-2">
                      <div className="h-[2px] rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
                    </div>

                    <div className="flex items-baseline justify-between text-[15px] leading-[1.15] text-black/50">
                      <span>{strings.tipLabel}</span>
                      <span>{tipSelection.label}</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-[15px] leading-[1.15] text-black/50">
                        {strings.totalLabel}
                      </span>
                      <span
                        className="text-[20px] leading-[1.15] text-black"
                        style={{
                          fontFeatureSettings: "'lnum', 'pnum'",
                        }}
                      >
                        {formatMoney(locale, totalCents, currency)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15px] leading-[1.15] text-black/50">
                      {strings.totalLabel}
                    </span>
                    <span
                      className="text-[20px] leading-[1.15] text-black"
                      style={{
                        fontFeatureSettings: "'lnum', 'pnum'",
                      }}
                    >
                      {formatMoney(locale, balanceCents, currency)}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Tip Card */}
            <section className="mt-4 rounded-[6px] border border-black/[0.06] bg-white px-3 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              {hasTip && !customMode ? (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                  <Heart className="h-12 w-12 text-rose-500" />
                  <p className="text-[15px] leading-[1.25] text-black">
                    {strings.thanks}{" "}
                    <span className="font-semibold">
                      {presetTipPercent
                        ? `${presetTipPercent} %`
                        : formatMoney(
                            locale,
                            tipSelection.tipCents,
                            currency
                          )}
                    </span>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={removeTip}
                    className="mt-2 text-[14px] font-medium text-black/50 underline"
                  >
                    {strings.removeTip}
                  </button>
                </div>
              ) : (
                <>
                  {!customMode && (
                    <>
                      <div className="flex justify-center">
                        <Smile className="h-12 w-12 text-black/30" />
                      </div>
                      <p className="mt-2 text-center text-[15px] leading-[1.25] text-black">
                        {strings.tipTitle}
                      </p>
                    </>
                  )}

                  {!customMode ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <TipButton
                        label={strings.percent5}
                        selected={presetTipPercent === 5}
                        onClick={() => {
                          setPresetTipPercent((c) =>
                            c === 5 ? null : 5
                          );
                          setCustomTipCents(null);
                        }}
                      />
                      <TipButton
                        label={strings.percent10}
                        selected={presetTipPercent === 10}
                        onClick={() => {
                          setPresetTipPercent((c) =>
                            c === 10 ? null : 10
                          );
                          setCustomTipCents(null);
                        }}
                      />
                      <TipButton
                        label={strings.percent15}
                        selected={presetTipPercent === 15}
                        onClick={() => {
                          setPresetTipPercent((c) =>
                            c === 15 ? null : 15
                          );
                          setCustomTipCents(null);
                        }}
                      />
                      <TipButton
                        label={strings.customize}
                        selected={false}
                        onClick={() => {
                          setCustomMode(true);
                          setPresetTipPercent(null);
                          setCustomTipCents(null);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-3 py-3">
                        <input
                          value={customValue}
                          onChange={(e) =>
                            setCustomValue(e.target.value)
                          }
                          placeholder={strings.enterAmount}
                          className="flex-1 bg-transparent text-[15px] font-medium text-black outline-none placeholder:text-black/40"
                          autoFocus
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomUnit("percent")
                            }
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold",
                              customUnit === "percent"
                                ? "bg-black text-white"
                                : "bg-[#e5e5e5] text-black"
                            )}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomUnit("amount")
                            }
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold",
                              customUnit === "amount"
                                ? "bg-black text-white"
                                : "bg-[#e5e5e5] text-black"
                            )}
                          >
                            €
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMode(false);
                            setCustomValue("");
                          }}
                          className="rounded-[6px] bg-[#f5f5f5] py-3 text-[16px] font-medium text-black"
                        >
                          {strings.back}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (customValue.trim()) {
                              if (customUnit === "percent") {
                                const parsed =
                                  Number.parseFloat(
                                    customValue.replace(
                                      ",",
                                      "."
                                    )
                                  );
                                if (
                                  Number.isFinite(parsed) &&
                                  parsed >= 0
                                ) {
                                  setPresetTipPercent(parsed);
                                  setCustomTipCents(null);
                                }
                              } else {
                                const cents =
                                  parseMoneyToCents(customValue);
                                if (cents !== null) {
                                  setCustomTipCents(cents);
                                  setPresetTipPercent(null);
                                }
                              }
                              setCustomMode(false);
                            }
                          }}
                          className="rounded-[6px] bg-black py-3 text-[16px] font-medium text-white"
                        >
                          {strings.validate}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Confirm Button */}
            <div className="mt-8 px-0">
              <button
                type="button"
                onClick={confirmCheckout}
                disabled={isConfirming}
                className="w-full rounded-[6px] bg-black py-3 text-[15px] font-medium text-white disabled:opacity-50"
              >
                {isConfirming
                  ? strings.confirmingLabel
                  : strings.confirmPay}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CheckoutTopbar({
  title,
  subtitle,
  locale,
}: {
  title: string;
  subtitle: string;
  locale: Locale;
}) {
  return (
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
          <div>
            <p className="text-[20px] leading-[1.15] tracking-[-0.2px] text-black">
              {title}
            </p>
            <p className="text-[13px] leading-[1.15] text-black/50">
              {subtitle}
            </p>
          </div>
        </AppLink>
        <Leaf className="h-8 w-8 text-black/70" />
      </div>
    </div>
  );
}

function TipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg bg-[#f5f5f5] px-2 py-3 text-[16px] font-medium text-black transition-colors",
        selected && "ring-1 ring-black/20"
      )}
    >
      {label}
    </button>
  );
}
