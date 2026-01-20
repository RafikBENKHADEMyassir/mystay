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
import { formatMoney, getCheckInStrings, localeLabel, requiredMessage } from "@/lib/i18n/check-in";
import type { Locale } from "@/lib/i18n/locales";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type CheckInStep = "personal" | "identity" | "finalize";
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

export default function CheckInPage() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<CheckInStep>("personal");
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [form, setForm] = useState<CheckInFormState>({
    reason: "personal",
    firstName: "Ethel",
    lastName: "Bracka",
    email: "",
    phoneCountryCode: "+33",
    phoneNumber: "",
    gender: null
  });

  const [submitted, setSubmitted] = useState(false);
  const [identityFiles, setIdentityFiles] = useState<File[]>([]);
  const [identitySubmitted, setIdentitySubmitted] = useState(false);

  const [extras, setExtras] = useState<Record<ExtraId, boolean>>({
    baby_bed: false,
    extra_bed: true,
    flowers: false
  });

  useEffect(() => {
    const existing = getDemoSession();
    if (existing) {
      setSession(existing);
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
        setSessionError(getCheckInStrings(locale).sessionError);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strings = useMemo(() => getCheckInStrings(locale), [locale]);
  const topbarHotelName = session?.hotelName ?? strings.hotelNameFallback;

  const emailError = submitted && !form.email.trim() ? requiredMessage(locale) : null;
  const firstNameError = submitted && !form.firstName.trim() ? requiredMessage(locale) : null;
  const lastNameError = submitted && !form.lastName.trim() ? requiredMessage(locale) : null;

  const identityError = identitySubmitted && identityFiles.length === 0 ? requiredMessage(locale) : null;

  const baseLineItems = useMemo(
    () => [
      { label: "Sea View Suite", amountCents: 120000 },
      { label: locale === "fr" ? "Petits déjeuners x2" : "Breakfast x2", amountCents: 20000 }
    ],
    [locale]
  );

  const extraCatalog = useMemo(
    () =>
      [
        { id: "baby_bed" as const, label: locale === "fr" ? "Lit bébé" : "Baby bed", priceCents: 0 },
        { id: "extra_bed" as const, label: locale === "fr" ? "Lit supplémentaire" : "Extra bed", priceCents: 20000 },
        { id: "flowers" as const, label: locale === "fr" ? "Fleurs" : "Flowers", priceCents: 20000 }
      ] satisfies Array<{ id: ExtraId; label: string; priceCents: number }>,
    [locale]
  );

  const extrasTotal = useMemo(() => {
    return extraCatalog.reduce((sum, extra) => sum + (extras[extra.id] ? extra.priceCents : 0), 0);
  }, [extraCatalog, extras]);

  const totalCents = useMemo(() => {
    const baseTotal = baseLineItems.reduce((sum, item) => sum + item.amountCents, 0);
    return baseTotal + extrasTotal;
  }, [baseLineItems, extrasTotal]);

  function switchLocale(nextLocale: Locale) {
    const basePath = stripLocaleFromPathname(pathname);
    const nextPath = withLocale(nextLocale, basePath);
    const query = searchParams?.toString() ?? "";
    router.push(query ? `${nextPath}?${query}` : nextPath);
  }

  function goNextFromPersonal() {
    setSubmitted(true);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    setStep("identity");
  }

  function goNextFromIdentity() {
    setIdentitySubmitted(true);
    if (!identityFiles.length) return;
    setStep("finalize");
  }

  function handleConfirm() {
    router.push(withLocale(locale, "/"));
  }

  function onIdentityFilesPicked(files: FileList | null) {
    if (!files?.length) return;
    const next = [...identityFiles, ...Array.from(files)].slice(0, 2);
    setIdentityFiles(next);
  }

  function removeIdentityFile(index: number) {
    setIdentityFiles((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Topbar title={strings.topbarTitle} subtitle={topbarHotelName} backHref={withLocale(locale, "/")} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        {sessionError ? <p className="text-xs text-muted-foreground">{sessionError}</p> : null}

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
                  <option value="fr">{localeLabel("fr")}</option>
                  <option value="en">{localeLabel("en")}</option>
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

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{strings.yourInfo}</p>

              <LabeledField
                label={strings.firstName}
                value={form.firstName}
                onChange={(value) => setForm((current) => ({ ...current, firstName: value }))}
                error={firstNameError}
              />

              <LabeledField
                label={strings.lastName}
                value={form.lastName}
                onChange={(value) => setForm((current) => ({ ...current, lastName: value }))}
                error={lastNameError}
              />

              <LabeledField
                label={strings.email}
                value={form.email}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                placeholder="email@email.com"
                type="email"
                error={emailError}
              />

              <div className="grid grid-cols-[88px,1fr] gap-3">
                <div className="rounded-xl bg-background px-4 py-3 shadow-sm ring-1 ring-border">
                  <select
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                    value={form.phoneCountryCode}
                    onChange={(event) => setForm((current) => ({ ...current, phoneCountryCode: event.target.value }))}
                  >
                    <option value="+33">+33</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                </div>
                <LabeledField
                  label={strings.phone}
                  value={form.phoneNumber}
                  onChange={(value) => setForm((current) => ({ ...current, phoneNumber: value }))}
                  placeholder="1 23 45 67 89"
                />
              </div>
            </section>

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
                  identityError && "border-destructive text-destructive"
                )}
              >
                <CloudUpload className="h-6 w-6" />
                <span>{strings.uploadHint}</span>
              </button>

              {identityError ? <p className="text-xs text-destructive">{identityError}</p> : null}

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
                        aria-label="Remove file"
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
                <p className="mt-1 text-sm text-muted-foreground">{form.email || "email@email.com"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.phoneCountryCode} {form.phoneNumber || "1 23 45 67 89"}
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
              onClick={handleConfirm}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.confirmPay}
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
