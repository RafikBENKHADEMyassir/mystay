"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BriefcaseBusiness,
  CircleUserRound,
  CloudUpload,
  Smile,
  UserRound,
  UsersRound,
  X
} from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession, setDemoSession } from "@/lib/demo-session";
import type { GuestContent } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type CheckInStep = "personal" | "identity" | "finalize" | "payment";
type StayReason = "personal" | "business";
type GenderIdentity = "male" | "female" | "non_binary";
type ExtraId = "baby_bed" | "extra_bed" | "flowers";

type CheckInFormState = {
  reason: StayReason;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  gender: GenderIdentity | null;
};

type StayLookupResponse = {
  token: string;
  hotel: { id: string; name: string };
  stay: {
    id: string;
    confirmationNumber: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    guests: { adults: number; children: number };
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const devDefaultConfirmation = "0123456789";

function formatMoney(locale: Locale, amountCents: number) {
  const languageTag = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(languageTag, { style: "currency", currency: "EUR" }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} EUR`;
  }
}

function luhnCheck(digits: string) {
  const value = digits.replace(/[^\d]/g, "");

  // Allow test card number
  if (value === "9999999999999999") return true;

  let sum = 0;
  let shouldDouble = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    const digit = Number(value[i]);
    if (!Number.isFinite(digit)) return false;
    let add = digit;
    if (shouldDouble) {
      add = digit * 2;
      if (add > 9) add -= 9;
    }
    sum += add;
    shouldDouble = !shouldDouble;
  }
  return value.length >= 13 && value.length <= 19 && sum % 10 === 0;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function parseCardExpiry(value: string) {
  const raw = value.trim().replace(/\s/g, "");
  const match = raw.match(/^(0?[1-9]|1[0-2])\/(\d{2}|\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  let year = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (year < 100) year += 2000;
  return { month, year };
}

function isExpiryValid(expiry: { month: number; year: number }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (expiry.year < currentYear) return false;
  if (expiry.year === currentYear && expiry.month < currentMonth) return false;
  return expiry.month >= 1 && expiry.month <= 12;
}

type CheckInValidationKey =
  | "invalid_email"
  | "invalid_phone"
  | "select_gender"
  | "invalid_card_number"
  | "invalid_card_expiry"
  | "invalid_card_cvc"
  | "invalid_file_type"
  | "file_too_large"
  | "fix_fields";

function validationMessage(content: GuestContent["pages"]["checkIn"], key: CheckInValidationKey) {
  const messages: Record<CheckInValidationKey, string> = {
    invalid_email: content.validation.invalidEmail,
    invalid_phone: content.validation.invalidPhone,
    select_gender: content.validation.selectGender,
    invalid_card_number: content.validation.invalidCardNumber,
    invalid_card_expiry: content.validation.invalidCardExpiry,
    invalid_card_cvc: content.validation.invalidCardCvc,
    invalid_file_type: content.validation.invalidFileType,
    file_too_large: content.validation.fileTooLarge,
    fix_fields: content.validation.fixFields
  };
  return messages[key] ?? content.validation.invalidField;
}

export default function CheckInPage() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<CheckInStep>("personal");
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Initialize form with empty values - will be populated from session
  const [form, setForm] = useState<CheckInFormState>({
    reason: "personal",
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "",
    phoneNumber: "",
    gender: null
  });

  const [submitted, setSubmitted] = useState(false);
  const [identityFiles, setIdentityFiles] = useState<File[]>([]);
  const [identitySubmitted, setIdentitySubmitted] = useState(false);
  const [identityPickError, setIdentityPickError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [extras, setExtras] = useState<Record<ExtraId, boolean>>({
    baby_bed: false,
    extra_bed: true,
    flowers: false
  });
  const { content } = useGuestContent(locale, session?.hotelId);
  const strings = content?.pages.checkIn;
  const defaultPhoneCountryCode = strings?.defaultPhoneCountryCode ?? "";

  // Populate form with guest data from session when available
  useEffect(() => {
    const existing = getDemoSession();
    if (existing) {
      setSession(existing);
      // Update form with guest data if available
      if (existing.guestFirstName || existing.guestLastName || existing.guestEmail || existing.guestPhone) {
        setForm((prev) => ({
          ...prev,
          firstName: existing.guestFirstName ?? prev.firstName,
          lastName: existing.guestLastName ?? prev.lastName,
          email: existing.guestEmail ?? prev.email,
          phoneNumber: existing.guestPhone ?? prev.phoneNumber
        }));
      }
      return;
    }

    const confirmation =
      searchParams?.get("confirmation") ??
      (process.env.NODE_ENV === "development" ? devDefaultConfirmation : null);

    if (!confirmation) return;

    const url = new URL("/api/v1/stays/lookup", apiBaseUrl);
    url.searchParams.set("confirmation", confirmation);

    fetch(url.toString(), { method: "GET" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as StayLookupResponse;
      })
      .then((data) => {
        if (!data) return;
        setDemoSession({
          hotelId: data.hotel.id,
          hotelName: data.hotel.name,
          stayId: data.stay.id,
          confirmationNumber: data.stay.confirmationNumber,
          guestToken: data.token,
          roomNumber: data.stay.roomNumber,
          checkIn: data.stay.checkIn,
          checkOut: data.stay.checkOut,
          guests: data.stay.guests
        });
        setSession(getDemoSession());
      })
      .catch(() => {
        setSessionError("backend_unreachable");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!defaultPhoneCountryCode) return;
    if (form.phoneCountryCode) return;
    setForm((current) => ({ ...current, phoneCountryCode: defaultPhoneCountryCode }));
  }, [defaultPhoneCountryCode, form.phoneCountryCode]);

  const topbarHotelName = session?.hotelName ?? strings?.hotelNameFallback ?? "";

  const genderError = submitted && !form.gender && strings ? validationMessage(strings, "select_gender") : null;

  const identityFilesError = useMemo(() => {
    if (!strings) return null;
    if (identityFiles.length === 0) return strings.required;
    const maxBytes = 4 * 1024 * 1024;
    const allowed = new Set(["image/png", "image/jpeg", "application/pdf"]);
    for (const file of identityFiles) {
      if (!allowed.has(file.type)) return validationMessage(strings, "invalid_file_type");
      if (file.size > maxBytes) return validationMessage(strings, "file_too_large");
    }
    return null;
  }, [identityFiles, strings]);

  const identityError = identitySubmitted ? identityFilesError : null;
  const identityDisplayError = identityPickError ?? identityError;

  const baseLineItems = useMemo(
    () => (strings ? strings.baseLineItems.map((item) => ({ label: item.label, amountCents: item.amountCents })) : []),
    [strings]
  );

  const extraCatalog = useMemo(
    () =>
      strings
        ? (strings.extrasCatalog.map((extra) => ({
            id: extra.id as ExtraId,
            label: extra.label,
            priceCents: extra.priceCents
          })) satisfies Array<{ id: ExtraId; label: string; priceCents: number }>)
        : [],
    [strings]
  );

  const extrasTotal = useMemo(() => {
    return extraCatalog.reduce((sum, extra) => sum + (extras[extra.id] ? extra.priceCents : 0), 0);
  }, [extraCatalog, extras]);

  const totalCents = useMemo(() => {
    const baseTotal = baseLineItems.reduce((sum, item) => sum + item.amountCents, 0);
    return baseTotal + extrasTotal;
  }, [baseLineItems, extrasTotal]);

  if (!strings) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <CloudUpload className="h-6 w-6 animate-pulse text-muted-foreground" />
      </div>
    );
  }
  const pageStrings = strings;

  function switchLocale(nextLocale: Locale) {
    const basePath = stripLocaleFromPathname(pathname);
    const nextPath = withLocale(nextLocale, basePath);
    const query = searchParams?.toString() ?? "";
    router.push(query ? `${nextPath}?${query}` : nextPath);
  }

  function goNextFromPersonal() {
    setSubmitted(true);
    if (!form.gender) return;
    setStep("identity");
  }

  function goNextFromIdentity() {
    setIdentitySubmitted(true);
    if (identityFilesError) return;
    setStep("finalize");
  }

  async function handleConfirm() {
    setPaymentSubmitted(true);

    if (!session?.guestToken) {
      setSubmitError(pageStrings.sessionError);
      return;
    }

    const numberDigits = cardNumber.replace(/[^\d]/g, "");
    const expiry = parseCardExpiry(cardExpiry);
    const cvcDigits = cardCvc.replace(/[^\d]/g, "");

    const missingOrInvalid =
      !cardName.trim() ||
      !numberDigits ||
      !luhnCheck(numberDigits) ||
      !expiry ||
      !isExpiryValid(expiry) ||
      !(cvcDigits.length === 3 || cvcDigits.length === 4);

    if (missingOrInvalid) {
      setSubmitError(validationMessage(pageStrings, "fix_fields"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(new URL("/api/v1/guest/check-in", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          idDocumentUploaded: identityFiles.length > 0,
          paymentMethodProvided: true
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        const code = typeof payload?.error === "string" ? payload.error : `checkin_failed_${response.status}`;
        if (code === "unauthorized" || code === "invalid_token") {
          setSubmitError(pageStrings.submitErrors.unauthorized);
        } else if (code === "pms_unavailable") {
          setSubmitError(pageStrings.submitErrors.pmsUnavailable);
        } else {
          setSubmitError(pageStrings.submitErrors.couldNotComplete);
        }
        return;
      }

      router.push(withLocale(locale, "/"));
    } catch {
      setSubmitError(pageStrings.submitErrors.serviceUnavailable);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onIdentityFilesPicked(files: FileList | null) {
    if (!files?.length) return;

    const allowed = new Set(["image/png", "image/jpeg", "application/pdf"]);
    const maxBytes = 4 * 1024 * 1024;
    const incoming = Array.from(files);

    let firstError: string | null = null;
    const accepted = incoming.filter((file) => {
      if (!allowed.has(file.type)) {
        if (!firstError) firstError = validationMessage(pageStrings, "invalid_file_type");
        return false;
      }
      if (file.size > maxBytes) {
        if (!firstError) firstError = validationMessage(pageStrings, "file_too_large");
        return false;
      }
      return true;
    });

    setIdentityPickError(firstError);
    if (accepted.length === 0) return;

    const next = [...identityFiles, ...accepted].slice(0, 2);
    setIdentityFiles(next);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeIdentityFile(index: number) {
    setIdentityFiles((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Topbar title={strings.topbarTitle} subtitle={topbarHotelName} backHref={withLocale(locale, "/")} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        {sessionError ? <p className="text-xs text-muted-foreground">{strings.sessionError}</p> : null}

        {step === "personal" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.personalTitle}</h1>

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.interfaceLanguage}</p>
              <div className="rounded-xl bg-background px-4 py-3 shadow-sm ring-1 ring-border">
                <select
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                  value={locale}
                  onChange={(event) => switchLocale(event.target.value as Locale)}
                >
                  <option value="fr">{strings.localeNames.fr}</option>
                  <option value="en">{strings.localeNames.en}</option>
                  <option value="es">{strings.localeNames.es}</option>
                </select>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.stayReason}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, reason: "personal" }))}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-border transition",
                    form.reason === "personal" ? "bg-foreground text-background" : "bg-background text-foreground"
                  )}
                >
                  <Smile className="h-4 w-4" />
                  {strings.reasonPersonal}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, reason: "business" }))}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-border transition",
                    form.reason === "business" ? "bg-foreground text-background" : "bg-background text-foreground"
                  )}
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  {strings.reasonBusiness}
                </button>
              </div>
            </section>

            {/* Personal info fields removed as requested */}

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.gender}</p>
              <div className="grid grid-cols-3 gap-3">
                <IconOption
                  icon={<UserRound className="h-5 w-5" />}
                  label={strings.genderMale}
                  selected={form.gender === "male"}
                  onSelect={() => setForm((current) => ({ ...current, gender: "male" }))}
                />
                <IconOption
                  icon={<CircleUserRound className="h-5 w-5" />}
                  label={strings.genderFemale}
                  selected={form.gender === "female"}
                  onSelect={() => setForm((current) => ({ ...current, gender: "female" }))}
                />
                <IconOption
                  icon={<UsersRound className="h-5 w-5" />}
                  label={strings.genderNonBinary}
                  selected={form.gender === "non_binary"}
                  onSelect={() => setForm((current) => ({ ...current, gender: "non_binary" }))}
                />
              </div>
              {genderError ? <p className="text-xs text-destructive">{genderError}</p> : null}
            </section>

            <button
              type="button"
              onClick={goNextFromPersonal}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.validate}
            </button>
          </>
        ) : null}

        {step === "identity" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.identityTitle}</h1>

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.idLabel}</p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(event) => onIdentityFilesPicked(event.target.files)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background px-4 py-6 text-sm text-muted-foreground",
                  identityDisplayError && "border-destructive text-destructive"
                )}
              >
                <CloudUpload className="h-6 w-6" />
                <span>{strings.uploadHint}</span>
              </button>

              {identityDisplayError ? <p className="text-xs text-destructive">{identityDisplayError}</p> : null}

              {identityFiles.length ? (
                <div className="space-y-2">
                  {identityFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3 text-sm"
                    >
                      <p className="truncate text-foreground">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeIdentityFile(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        aria-label={strings.removeFileAria}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                <li>{strings.accepted}</li>
                <li>{strings.maxFiles}</li>
                <li>{strings.maxSize}</li>
                <li>{strings.readable}</li>
              </ul>
            </section>

            <button
              type="button"
              onClick={goNextFromIdentity}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.validate}
            </button>
          </>
        ) : null}

        {step === "finalize" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.finalizeTitle}</h1>

            <section className="rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.summaryTitle}</p>
              <div className="mt-2 rounded-xl bg-background px-4 py-3 shadow-sm ring-1 ring-border">
                <p className="text-sm font-semibold text-foreground">
                  {form.firstName} {form.lastName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{form.email || strings.emailFallback}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.phoneCountryCode} {form.phoneNumber || strings.phoneFallback}
                </p>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.addSomething}</p>

              <div className="space-y-2">
                {extraCatalog.map((extra) => {
                  const checked = extras[extra.id];
                  const priceLabel = extra.priceCents === 0 ? strings.free : formatMoney(locale, extra.priceCents);

                  return (
                    <label
                      key={extra.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-3 shadow-sm ring-1 ring-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted/40" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{extra.label}</p>
                          <p className="text-xs text-muted-foreground">{priceLabel}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-foreground"
                        checked={checked}
                        onChange={() => setExtras((current) => ({ ...current, [extra.id]: !current[extra.id] }))}
                      />
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.details}</p>
              <div className="space-y-2 rounded-xl bg-background px-4 py-3 shadow-sm ring-1 ring-border">
                {baseLineItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">{formatMoney(locale, item.amountCents)}</span>
                  </div>
                ))}

                {extraCatalog
                  .filter((extra) => extras[extra.id])
                  .map((extra) => (
                    <div key={extra.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{extra.label}</span>
                      <span className="font-semibold text-foreground">{formatMoney(locale, extra.priceCents)}</span>
                    </div>
                  ))}

                <div className="mt-2 border-t pt-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">{strings.total}</span>
                  <span className="text-lg font-semibold text-foreground">{formatMoney(locale, totalCents)}</span>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => setStep("payment")}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.confirmPay}
            </button>
          </>
        ) : null}

        {step === "payment" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.paymentTitle}</h1>
            <p className="text-sm text-muted-foreground">{strings.paymentSubtitle}</p>

            {submitError ? <p className="text-xs text-destructive">{submitError}</p> : null}

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.confirmPaymentMethod}</p>

              {(() => {
                const cardNameError = paymentSubmitted && !cardName.trim() ? strings.required : null;
                const cardNumberDigits = cardNumber.replace(/[^\d]/g, "");
                const cardNumberError =
                  !paymentSubmitted
                    ? null
                    : !cardNumberDigits
                      ? strings.required
                      : !luhnCheck(cardNumberDigits)
                        ? validationMessage(strings, "invalid_card_number")
                        : null;

                const expiry = parseCardExpiry(cardExpiry);
                const cardExpiryError =
                  !paymentSubmitted
                    ? null
                    : !cardExpiry.trim()
                      ? strings.required
                      : !expiry || !isExpiryValid(expiry)
                        ? validationMessage(strings, "invalid_card_expiry")
                        : null;

                const cvcDigits = cardCvc.replace(/[^\d]/g, "");
                const cardCvcError =
                  !paymentSubmitted
                    ? null
                    : !cvcDigits
                      ? strings.required
                      : !(cvcDigits.length === 3 || cvcDigits.length === 4)
                        ? validationMessage(strings, "invalid_card_cvc")
                        : null;

                return (
                  <>
                    <LabeledField
                      label={strings.paymentFields.cardNameLabel}
                      value={cardName}
                      onChange={setCardName}
                      placeholder={strings.paymentFields.cardNamePlaceholder}
                      error={cardNameError}
                    />
                    <LabeledField
                      label={strings.paymentFields.cardNumberLabel}
                      value={cardNumber}
                      onChange={(val) => setCardNumber(formatCardNumber(val))}
                      placeholder={strings.paymentFields.cardNumberPlaceholder}
                      error={cardNumberError}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <LabeledField
                        label={strings.paymentFields.cardExpiryLabel}
                        value={cardExpiry}
                        onChange={(val) => setCardExpiry(formatCardExpiry(val))}
                        placeholder={strings.paymentFields.cardExpiryPlaceholder}
                        error={cardExpiryError}
                      />
                      <LabeledField
                        label={strings.paymentFields.cardCvcLabel}
                        value={cardCvc}
                        onChange={setCardCvc}
                        placeholder={strings.paymentFields.cardCvcPlaceholder}
                        type="password"
                        error={cardCvcError}
                      />
                    </div>
                  </>
                );
              })()}
            </section>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
            >
              {strings.paymentFields.submit}
            </button>
          </>
        ) : null}
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

type IconOptionProps = {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

function IconOption({ icon, label, selected, onSelect }: IconOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl bg-background px-2 py-3 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border transition",
        selected && "bg-foreground text-background"
      )}
    >
      <span className={cn("text-muted-foreground", selected && "text-background")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
