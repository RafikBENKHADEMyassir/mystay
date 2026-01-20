"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CloudUpload,
  CreditCard,
  Smile,
  X
} from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

type SignupStep = "personal" | "identity" | "payment" | "complete";
type StayReason = "personal" | "business";

type SignupFormState = {
  reason: StayReason;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

function getSignupStrings(locale: string) {
  if (locale === "fr") {
    return {
      topbarTitle: "Inscription",
      personalTitle: "Informations personnelles",
      interfaceLanguage: "Langue de l'interface",
      stayReason: "Raison de votre séjour",
      reasonPersonal: "Personnel",
      reasonBusiness: "Travail",
      yourInfo: "Vos informations",
      firstName: "Prénom",
      lastName: "Nom de famille",
      email: "Adresse e-mail",
      phone: "Téléphone",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      validate: "Continuer",
      identityTitle: "Dépôt de pièce d'identité",
      idLabel: "Téléchargez votre pièce d'identité",
      uploadHint: "Cliquez pour télécharger ou glissez-déposez",
      accepted: "Formats acceptés : PNG, JPG, PDF",
      maxFiles: "Maximum 2 fichiers",
      maxSize: "Taille maximale : 10 Mo par fichier",
      readable: "Le document doit être lisible",
      skip: "Passer cette étape",
      paymentTitle: "Enregistrer une carte bancaire",
      paymentDesc: "Enregistrez une carte pour des paiements rapides pendant votre séjour",
      cardPlaceholder: "Vos informations de carte sont sécurisées",
      completeTitle: "Compte créé !",
      completeDesc: "Votre compte a été créé avec succès. Vous pouvez maintenant lier une réservation ou explorer nos hôtels partenaires.",
      linkReservation: "Lier une réservation",
      exploreHotels: "Explorer les hôtels",
      alreadyAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      required: "Ce champ est requis",
      invalidEmail: "Adresse e-mail invalide",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      passwordTooShort: "Le mot de passe doit contenir au moins 6 caractères",
      emailExists: "Un compte avec cet e-mail existe déjà",
      unexpectedError: "Une erreur inattendue s'est produite"
    };
  }

  return {
    topbarTitle: "Sign Up",
    personalTitle: "Personal Information",
    interfaceLanguage: "Interface language",
    stayReason: "Reason for your stay",
    reasonPersonal: "Personal",
    reasonBusiness: "Business",
    yourInfo: "Your information",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone",
    password: "Password",
    confirmPassword: "Confirm password",
    validate: "Continue",
    identityTitle: "Identity Document",
    idLabel: "Upload your ID document",
    uploadHint: "Click to upload or drag and drop",
    accepted: "Accepted formats: PNG, JPG, PDF",
    maxFiles: "Maximum 2 files",
    maxSize: "Maximum size: 10 MB per file",
    readable: "Document must be readable",
    skip: "Skip this step",
    paymentTitle: "Add Payment Method",
    paymentDesc: "Save a card for quick payments during your stay",
    cardPlaceholder: "Your card details are securely encrypted",
    completeTitle: "Account Created!",
    completeDesc: "Your account has been created successfully. You can now link a reservation or explore our partner hotels.",
    linkReservation: "Link a Reservation",
    exploreHotels: "Explore Hotels",
    alreadyAccount: "Already have an account?",
    signIn: "Sign in",
    required: "This field is required",
    invalidEmail: "Invalid email address",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    emailExists: "An account with this email already exists",
    unexpectedError: "An unexpected error occurred"
  };
}

function requiredMessage(locale: string) {
  return locale === "fr" ? "Ce champ est requis" : "This field is required";
}

export default function SignupPage() {
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<SignupStep>("personal");
  const [form, setForm] = useState<SignupFormState>({
    reason: "personal",
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "+33",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [identityFiles, setIdentityFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strings = useMemo(() => getSignupStrings(locale), [locale]);

  // Validation errors
  const firstNameError = submitted && !form.firstName.trim() ? requiredMessage(locale) : null;
  const lastNameError = submitted && !form.lastName.trim() ? requiredMessage(locale) : null;
  const emailError = submitted && !form.email.trim() 
    ? requiredMessage(locale) 
    : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) 
    ? strings.invalidEmail 
    : null;
  const passwordError = submitted && !form.password 
    ? requiredMessage(locale) 
    : submitted && form.password.length < 6 
    ? strings.passwordTooShort 
    : null;
  const confirmPasswordError = submitted && form.password !== form.confirmPassword 
    ? strings.passwordMismatch 
    : null;

  async function handleCreateAccount() {
    setSubmitted(true);
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return;
    }
    if (form.password.length < 6) {
      return;
    }
    if (form.password !== form.confirmPassword) {
      return;
    }

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
        setStep("identity");
      } else {
        if (data.error === "email_already_exists") {
          setError(strings.emailExists);
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

  function handleSkipIdentity() {
    setStep("payment");
  }

  function handleUploadIdentity() {
    // TODO: Implement actual upload
    setStep("payment");
  }

  function handleSkipPayment() {
    setStep("complete");
  }

  function handleAddPayment() {
    // TODO: Implement Stripe integration
    setStep("complete");
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
      <Topbar 
        title={strings.topbarTitle} 
        backHref={withLocale(locale, "/")} 
      />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        {step === "personal" && (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.personalTitle}</h1>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

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
              <p className="text-sm font-semibold text-foreground">{strings.password}</p>

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
            </section>

            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
            >
              {isLoading ? "..." : strings.validate}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {strings.alreadyAccount}{" "}
              <Link href={withLocale(locale, "/login")} className="font-semibold text-foreground underline">
                {strings.signIn}
              </Link>
            </p>
          </>
        )}

        {step === "identity" && (
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
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background px-4 py-6 text-sm text-muted-foreground"
              >
                <CloudUpload className="h-6 w-6" />
                <span>{strings.uploadHint}</span>
              </button>

              {identityFiles.length > 0 && (
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
              )}

              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                <li>{strings.accepted}</li>
                <li>{strings.maxFiles}</li>
                <li>{strings.maxSize}</li>
                <li>{strings.readable}</li>
              </ul>
            </section>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkipIdentity}
                className="flex-1 rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-foreground shadow-sm"
              >
                {strings.skip}
              </button>
              <button
                type="button"
                onClick={handleUploadIdentity}
                disabled={identityFiles.length === 0}
                className="flex-1 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
              >
                {strings.validate}
              </button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{strings.paymentTitle}</h1>

            <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">{strings.paymentDesc}</p>

              <div className="flex flex-col items-center justify-center rounded-xl border bg-background px-4 py-8">
                <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">{strings.cardPlaceholder}</p>
              </div>
            </section>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkipPayment}
                className="flex-1 rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-foreground shadow-sm"
              >
                {strings.skip}
              </button>
              <button
                type="button"
                onClick={handleAddPayment}
                className="flex-1 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
              >
                {strings.validate}
              </button>
            </div>
          </>
        )}

        {step === "complete" && (
          <>
            <div className="flex flex-col items-center pt-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-foreground">{strings.completeTitle}</h1>
              <p className="mb-8 text-sm text-muted-foreground">{strings.completeDesc}</p>

              <div className="flex w-full flex-col gap-3">
                <Link
                  href={withLocale(locale, "/link-reservation")}
                  className="w-full rounded-2xl bg-foreground py-3 text-center text-sm font-semibold text-background shadow-sm"
                >
                  {strings.linkReservation}
                </Link>
                <Link
                  href={withLocale(locale, "/hotels")}
                  className="w-full rounded-2xl border border-border bg-background py-3 text-center text-sm font-semibold text-foreground shadow-sm"
                >
                  {strings.exploreHotels}
                </Link>
              </div>
            </div>
          </>
        )}
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
