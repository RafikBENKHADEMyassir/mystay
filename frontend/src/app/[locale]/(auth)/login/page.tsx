"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

function getLoginStrings(locale: string) {
  if (locale === "fr") {
    return {
      topbarTitle: "Connexion",
      title: "Connectez-vous",
      subtitle: "Accédez à votre séjour et aux services de l'hôtel",
      email: "Adresse e-mail",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      signIn: "Se connecter",
      noAccount: "Vous n'avez pas de compte ?",
      signUp: "Créer un compte",
      required: "Ce champ est requis",
      invalidCredentials: "E-mail ou mot de passe incorrect",
      unexpectedError: "Une erreur inattendue s'est produite"
    };
  }

  return {
    topbarTitle: "Sign In",
    title: "Sign in",
    subtitle: "Access your stay and hotel services",
    email: "Email address",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    signUp: "Create account",
    required: "This field is required",
    invalidCredentials: "Invalid email or password",
    unexpectedError: "An unexpected error occurred"
  };
}

function requiredMessage(locale: string) {
  return locale === "fr" ? "Ce champ est requis" : "This field is required";
}

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strings = useMemo(() => getLoginStrings(locale), [locale]);

  const emailError = submitted && !email.trim() ? requiredMessage(locale) : null;
  const passwordError = submitted && !password ? requiredMessage(locale) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);

    if (!email.trim() || !password) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Check if user has an active stay
        if (data.stay) {
          router.push(withLocale(locale, "/"));
        } else {
          router.push(withLocale(locale, "/link-reservation"));
        }
      } else {
        if (data.error === "invalid_credentials") {
          setError(strings.invalidCredentials);
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
        <div className="pt-4">
          <h1 className="text-2xl font-semibold text-foreground">{strings.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{strings.subtitle}</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="space-y-3 rounded-2xl bg-muted/20 p-4">
            <LabeledField
              label={strings.email}
              value={email}
              onChange={setEmail}
              placeholder="email@email.com"
              type="email"
              error={emailError}
            />

            <LabeledField
              label={strings.password}
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              error={passwordError}
            />

            <div className="text-right">
              <Link
                href={withLocale(locale, "/forgot-password")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {strings.forgotPassword}
              </Link>
            </div>
          </section>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
          >
            {isLoading ? "..." : strings.signIn}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {strings.noAccount}{" "}
          <Link href={withLocale(locale, "/signup")} className="font-semibold text-foreground underline">
            {strings.signUp}
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
