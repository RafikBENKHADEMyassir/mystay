"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { setDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";

import { ProfileStep } from "./_components/profile-step";
import { PasswordStep } from "./_components/password-step";
import { CreatedStep } from "./_components/created-step";
import { LinkStep } from "./_components/link-step";
import { WelcomeStep } from "./_components/welcome-step";

import type { LinkedStay, SignupFormState, SignupStep } from "./_lib/types";
import { INITIAL_FORM } from "./_lib/types";
import { getSignupErrors, isPhoneValid, isValidEmail, passwordRules } from "./_lib/validation";
import { getDialCode } from "@/lib/phone-countries";

export default function SignupPage() {
  const locale = useLocale();
  const router = useRouter();
  const { content } = useGuestContent(locale);

  const [step, setStep] = useState<SignupStep>("profile");
  const [form, setForm] = useState<SignupFormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedStay, setLinkedStay] = useState<LinkedStay | null>(null);

  // Hooks MUST be called before any early return
  const rules = useMemo(() => passwordRules(form.password), [form.password]);

  const strings = content?.pages.auth.signup;
  if (!strings) return <div className="min-h-screen bg-background" />;

  const errors = getSignupErrors(form, step, submitted, rules, strings);
  const phoneDialCode = getDialCode(form.phoneCountry);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateForm = (patch: Partial<SignupFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const goToPasswordStep = () => {
    setSubmitted(true);
    setError(null);
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !isValidEmail(form.email.trim()) ||
      !isPhoneValid(form.phoneNumber, form.phoneCountry)
    )
      return;
    setSubmitted(false);
    setStep("password");
  };

  const createAccount = async () => {
    setSubmitted(true);
    setError(null);
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !isValidEmail(form.email.trim()) ||
      !isPhoneValid(form.phoneNumber, form.phoneCountry) ||
      !form.password ||
      form.password !== form.confirmPassword ||
      !rules.length ||
      !rules.upper ||
      !rules.special
    )
      return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phoneNumber ? `${phoneDialCode}${form.phoneNumber}` : null,
          password: form.password
        })
      });
      const data = await res.json();

      if (res.ok) {
        setStep("created");
      } else {
        setError(data.error === "email_already_exists" ? strings.emailExists : strings.unexpectedError);
      }
    } catch {
      setError(strings.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const linkReservation = async () => {
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
        else setError(strings.unexpectedError);
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
          guestPhone: form.phoneNumber ? `${phoneDialCode}${form.phoneNumber}` : null
        });
      }

      setStep("welcome");
    } catch {
      setError(strings.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const startLinking = () => {
    setSubmitted(false);
    setError(null);
    setStep("link");
  };

  const goToCheckIn = () => {
    router.push(withLocale(locale, "/reception/check-in"));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mt-6">
      <Topbar backHref={withLocale(locale, "/")} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-6">
        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "profile" && (
          <ProfileStep
            form={form}
            updateForm={updateForm}
            errors={errors}
            strings={strings}
            onContinue={goToPasswordStep}
          />
        )}

        {step === "password" && (
          <PasswordStep
            form={form}
            updateForm={updateForm}
            rules={rules}
            errors={errors}
            strings={strings}
            isLoading={isLoading}
            onCreateAccount={createAccount}
          />
        )}

        {step === "created" && <CreatedStep strings={strings} onNext={startLinking} />}

        {step === "link" && (
          <LinkStep
            form={form}
            updateForm={updateForm}
            errors={errors}
            strings={strings}
            isLoading={isLoading}
            onLink={linkReservation}
          />
        )}

        {step === "welcome" && (
          <WelcomeStep strings={strings} linkedStay={linkedStay} onCheckIn={goToCheckIn} />
        )}

        <p className="pt-6 text-center text-sm text-muted-foreground">
          {strings.alreadyAccount}{" "}
          <AppLink href={withLocale(locale, "/login")} className="font-semibold text-foreground underline">
            {strings.signIn}
          </AppLink>
        </p>
      </main>
    </div>
  );
}
