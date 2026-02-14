"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Handshake } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { setDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type SignupStep = "profile" | "password" | "created" | "link" | "welcome";

type SignupFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  confirmationNumber: string;
};

type LinkedStay = {
  id: string;
  hotelId: string;
  hotelName: string;
  confirmationNumber: string;
  roomNumber: string | null;
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children: number };
};

function getSignupStrings(locale: string) {
  if (locale === "fr") {
    return {
      topbarTitle: "Inscription",
      profileTitle: "Inscription",
      profileCardTitle: "Vos informations",
      firstName: "Prénom",
      lastName: "Nom de famille",
      email: "Adresse e-mail",
      phone: "Téléphone",
      validate: "Valider",
      passwordTitle: "Choisissez votre mot de passe",
      password: "Mot de passe",
      confirmPassword: "Répétez votre mot de passe",
      passwordRuleTitle: "Votre mot de passe doit contenir au moins :",
      ruleLength: "8 caractères minimum",
      ruleUpper: "Une majuscule",
      ruleSpecial: "Un caractère spécial",
      createdTitle: "Votre compte a bien été créé.",
      nextStep: "Passer à l’étape suivante",
      linkTitle: "Rattachez votre compte à votre hôtel",
      linkSubtitle: "Ensuite, nous nous occupons du reste.",
      confirmationLabel: "Votre numéro de confirmation de réservation",
      confirmationPlaceholder: "01234 56789",
      linkHint:
        "Vous avez reçu votre numéro de réservation par mail lors de votre réservation avec votre hôtel.\nVous ne l’avez pas reçu ?",
      contactSupport: "Contacter l’assistance",
      confirm: "Confirmer",
      welcomeTitle: "Votre hôtel vous souhaite la bienvenue.",
      welcomeSubtitle: "Vous pouvez maintenant réaliser votre check‑in.",
      doCheckIn: "Je réalise mon check‑in",
      alreadyAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      required: "Ce champ est requis.",
      invalidEmail: "Adresse e‑mail invalide.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      passwordTooWeak: "Mot de passe trop faible.",
      emailExists: "Un compte avec cet e‑mail existe déjà.",
      reservationNotFound: "Aucune réservation trouvée avec ce numéro.",
      reservationLinked: "Cette réservation est déjà liée à un compte.",
      unexpectedError: "Une erreur inattendue s'est produite."
    };
  }

  return {
    topbarTitle: "Sign Up",
    profileTitle: "Sign up",
    profileCardTitle: "Your information",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone",
    validate: "Continue",
    passwordTitle: "Choose your password",
    password: "Password",
    confirmPassword: "Repeat your password",
    passwordRuleTitle: "Your password must include at least:",
    ruleLength: "8 characters",
    ruleUpper: "One uppercase letter",
    ruleSpecial: "One special character",
    createdTitle: "Your account has been created.",
    nextStep: "Next step",
    linkTitle: "Attach your account to your hotel",
    linkSubtitle: "Then we’ll take care of the rest.",
    confirmationLabel: "Your reservation confirmation number",
    confirmationPlaceholder: "01234 56789",
    linkHint:
      "You received your reservation number by email when booking.\nDidn’t receive it?",
    contactSupport: "Contact support",
    confirm: "Confirm",
    welcomeTitle: "Your hotel welcomes you.",
    welcomeSubtitle: "You can now complete your check‑in.",
    doCheckIn: "Complete my check‑in",
    alreadyAccount: "Already have an account?",
    signIn: "Sign in",
    required: "This field is required.",
    invalidEmail: "Invalid email address.",
    passwordMismatch: "Passwords do not match.",
    passwordTooWeak: "Password is too weak.",
    emailExists: "An account with this email already exists.",
    reservationNotFound: "No reservation found with this number.",
    reservationLinked: "This reservation is already linked.",
    unexpectedError: "An unexpected error occurred."
  };
}

function requiredMessage(locale: string) {
  return locale === "fr" ? "Ce champ est requis." : "This field is required.";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function passwordRules(password: string) {
  const trimmed = password ?? "";
  return {
    length: trimmed.length >= 8,
    upper: /[A-Z]/.test(trimmed),
    special: /[^A-Za-z0-9]/.test(trimmed)
  };
}

export default function SignupPage() {
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<SignupStep>("profile");
  const [form, setForm] = useState<SignupFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "+33",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    confirmationNumber: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedStay, setLinkedStay] = useState<LinkedStay | null>(null);

  const strings = useMemo(() => getSignupStrings(locale), [locale]);

  const emailError =
    submitted && !form.email.trim()
      ? requiredMessage(locale)
      : submitted && !isValidEmail(form.email.trim())
        ? strings.invalidEmail
        : null;

  const firstNameError = submitted && !form.firstName.trim() ? requiredMessage(locale) : null;
  const lastNameError = submitted && !form.lastName.trim() ? requiredMessage(locale) : null;

  const rules = useMemo(() => passwordRules(form.password), [form.password]);
  const passwordTooWeak = submitted && step === "password" && (!rules.length || !rules.upper || !rules.special);
  const passwordError = passwordTooWeak ? strings.passwordTooWeak : null;

  const confirmPasswordError =
    submitted && step === "password" && form.password !== form.confirmPassword ? strings.passwordMismatch : null;

  const confirmationError = submitted && step === "link" && !form.confirmationNumber.trim() ? requiredMessage(locale) : null;

  function goToPasswordStep() {
    setSubmitted(true);
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    if (!isValidEmail(form.email.trim())) return;

    setSubmitted(false);
    setStep("password");
  }

  async function createAccount() {
    setSubmitted(true);
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    if (!isValidEmail(form.email.trim())) return;
    if (!form.password) return;
    if (form.password !== form.confirmPassword) return;
    if (!rules.length || !rules.upper || !rules.special) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phoneNumber ? `${form.phoneCountryCode}${form.phoneNumber}` : null,
          password: form.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStep("created");
      } else {
        if (data.error === "email_already_exists") setError(strings.emailExists);
        else setError(data.error || strings.unexpectedError);
      }
    } catch {
      setError(strings.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  }

  async function linkReservation() {
    setSubmitted(true);
    setError(null);

    if (!form.confirmationNumber.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/link-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationNumber: form.confirmationNumber })
      });
      const data = (await res.json()) as { error?: string; stay?: LinkedStay };

      if (!res.ok) {
        if (data.error === "reservation_not_found") setError(strings.reservationNotFound);
        else if (data.error === "reservation_already_linked") setError(strings.reservationLinked);
        else setError(data.error || strings.unexpectedError);
        return;
      }

      const stay = data.stay ?? null;
      if (!stay) {
        setError(strings.unexpectedError);
        return;
      }

      setLinkedStay(stay);

      const sessionRes = await fetch("/api/auth/session", { method: "GET" });
      const sessionData = (await sessionRes.json()) as { backendToken?: string | null };
      const token = typeof sessionData.backendToken === "string" ? sessionData.backendToken : "";

      if (token) {
        setDemoSession({
          hotelId: stay.hotelId,
          hotelName: stay.hotelName,
          stayId: stay.id,
          confirmationNumber: stay.confirmationNumber,
          guestToken: token,
          roomNumber: stay.roomNumber,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          guests: stay.guests,
          guestFirstName: form.firstName,
          guestLastName: form.lastName,
          guestEmail: form.email,
          guestPhone: form.phoneNumber ? `${form.phoneCountryCode}${form.phoneNumber}` : null
        });
      }

      setStep("welcome");
    } catch {
      setError(strings.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  }

  function startLinking() {
    setSubmitted(false);
    setError(null);
    setStep("link");
  }

  function goToCheckIn() {
    router.push(withLocale(locale, "/reception/check-in"));
  }

  return (
    <div>
      <Topbar title={strings.topbarTitle} backHref={withLocale(locale, "/")} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-6">
        {error ? (
          <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {step === "profile" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.profileTitle}</h1>
            <section className="space-y-3 rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              <p className="text-sm font-semibold text-foreground">{strings.profileCardTitle}</p>
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
                placeholder="exemple@email.com"
                type="email"
                error={emailError}
              />
              <div className="grid grid-cols-[88px,1fr] gap-3">
                <div className="rounded-xl bg-muted/30 px-4 py-3 ring-1 ring-border">
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
                  placeholder="Téléphone"
                />
              </div>
            </section>

            <button
              type="button"
              onClick={goToPasswordStep}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.validate}
            </button>
          </>
        ) : null}

        {step === "password" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.passwordTitle}</h1>

            <section className="space-y-3 rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              <LabeledField
                label={strings.password}
                value={form.password}
                onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                type="password"
                placeholder="••••••••"
                error={passwordError}
              />
              <LabeledField
                label={strings.confirmPassword}
                value={form.confirmPassword}
                onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
                type="password"
                placeholder="••••••••"
                error={confirmPasswordError}
              />

              <div className="pt-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">{strings.passwordRuleTitle}</p>
                <ul className="mt-2 space-y-1">
                  <RuleItem ok={rules.length} label={strings.ruleLength} />
                  <RuleItem ok={rules.upper} label={strings.ruleUpper} />
                  <RuleItem ok={rules.special} label={strings.ruleSpecial} />
                </ul>
              </div>
            </section>

            <button
              type="button"
              onClick={createAccount}
              disabled={isLoading}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
            >
              {isLoading ? "..." : strings.validate}
            </button>
          </>
        ) : null}

        {step === "created" ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            <p className="text-xl font-semibold text-foreground">{strings.createdTitle}</p>
            <button
              type="button"
              onClick={startLinking}
              className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.nextStep}
            </button>
          </div>
        ) : null}

        {step === "link" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.linkTitle}</h1>
            <p className="text-sm text-muted-foreground">{strings.linkSubtitle}</p>

            <section className="space-y-3 rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
              <p className="text-sm font-semibold text-foreground">{strings.confirmationLabel}</p>
              <LabeledField
                label={strings.confirmationLabel}
                value={form.confirmationNumber}
                onChange={(value) => setForm((current) => ({ ...current, confirmationNumber: value }))}
                placeholder={strings.confirmationPlaceholder}
                error={confirmationError}
              />
            </section>

            <p className="whitespace-pre-line text-xs text-muted-foreground">
              {strings.linkHint}{" "}
              <a href="mailto:support@mystay.com" className="font-semibold text-foreground underline">
                {strings.contactSupport}
              </a>
            </p>

            <button
              type="button"
              onClick={linkReservation}
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
            >
              {isLoading ? "..." : strings.confirm}
            </button>
          </>
        ) : null}

        {step === "welcome" ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <Handshake className="h-12 w-12 text-foreground" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">{strings.welcomeTitle}</p>
              <p className="text-sm text-muted-foreground">{strings.welcomeSubtitle}</p>
              {linkedStay ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{linkedStay.hotelName}</span> ·{" "}
                  <span className="font-mono">{linkedStay.confirmationNumber}</span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={goToCheckIn}
              className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
            >
              {strings.doCheckIn}
            </button>
          </div>
        ) : null}

        <p className="pt-6 text-center text-sm text-muted-foreground">
          {strings.alreadyAccount}{" "}
          <Link href={withLocale(locale, "/login")} className="font-semibold text-foreground underline">
            {strings.signIn}
          </Link>
        </p>
      </main>
    </div>
  );
}

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]",
          ok ? "border-emerald-500 text-emerald-600" : "border-muted-foreground/40 text-muted-foreground/60"
        )}
        aria-hidden="true"
      >
        {ok ? "✓" : "○"}
      </span>
      <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
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
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value && value.length > 0);

  return (
    <div className="space-y-1">
      <div className={cn("relative rounded-xl bg-muted/30 px-4 ring-1 ring-border transition-all h-[60px] flex flex-col justify-end pb-2.5", error && "ring-destructive")}>
        <p className={cn(
             "absolute left-4 text-muted-foreground transition-all duration-200 pointer-events-none",
             isActive ? "top-3 text-xs" : "top-1/2 -translate-y-1/2 text-sm"
        )}>
            {label}
        </p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isActive ? placeholder : ""}
          type={type}
          className={cn(
            "w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70",
            error && "pr-10"
          )}
        />
        {error ? <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" /> : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
