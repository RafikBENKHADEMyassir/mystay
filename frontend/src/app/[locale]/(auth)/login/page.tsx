"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";
import { AlertCircle } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession, setDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const { content } = useGuestContent(locale);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to home page
  useEffect(() => {
    const session = getDemoSession();
    if (session?.guestToken) {
      router.replace(withLocale(locale, "/"));
    }
  }, [router, locale]);

  const strings = content?.pages.auth.login;
  if (!strings) return <div className="min-h-screen bg-background" />;
  const pageStrings = strings;

  const emailError = submitted && !email.trim() ? strings.required : null;
  const passwordError = submitted && !password ? strings.required : null;

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
        // Set demo session with guest and stay data for check-in page
        if (data.stay) {
          setDemoSession({
            hotelId: data.stay.hotelId,
            hotelName: data.stay.hotelName ?? pageStrings.fallbackHotelName,
            stayId: data.stay.id,
            confirmationNumber: data.stay.confirmationNumber,
            guestToken: data.token, // Backend JWT token for API calls
            roomNumber: data.stay.roomNumber,
            checkIn: data.stay.checkIn,
            checkOut: data.stay.checkOut,
            guests: data.stay.guests,
            // Include guest info for check-in form
            guestFirstName: data.guest.firstName,
            guestLastName: data.guest.lastName,
            guestEmail: data.guest.email,
            guestPhone: data.guest.phone
          });
          // Set authentication cookie for middleware
          document.cookie = `guest_session=${data.token}; path=/; max-age=86400; SameSite=Lax`;
          router.push(withLocale(locale, "/"));
        } else {
          router.push(withLocale(locale, "/link-reservation"));
        }
      } else {
        if (data.error === "invalid_credentials") {
          setError(pageStrings.invalidCredentials);
        } else {
          setError(pageStrings.unexpectedError);
        }
      }
    } catch {
      setError(pageStrings.unexpectedError);
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

      <main className="mx-auto max-w-md space-y-5 px-5 pb-10 pt-8">
        <h1 className="text-[26px] font-semibold leading-tight text-foreground">{strings.title}</h1>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="space-y-4 rounded-xl bg-muted/10 p-5 ring-1 ring-border">
            <p className="text-sm font-semibold text-foreground">{strings.subtitle}</p>

            <LabeledField
              label={strings.emailLabel}
              value={email}
              onChange={setEmail}
              placeholder={strings.emailPlaceholder}
              type="email"
              error={emailError}
            />
            <LabeledField
              label={strings.passwordLabel}
              value={password}
              onChange={setPassword}
              type="password"
              placeholder={strings.passwordPlaceholder}
              error={passwordError}
            />
          </section>

          <div className="mt-8 space-y-4">
            <AppLink 
              href={withLocale(locale, "/forgot-password")} 
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {strings.help}
              <span className="text-muted-foreground/60">›</span>
            </AppLink>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
            >
              {isLoading ? strings.loadingLabel : strings.signIn}
            </button>
          </div>
        </form>

        <p className="pt-4 text-center text-sm text-muted-foreground">
          {strings.noAccount}{" "}
          <AppLink href={withLocale(locale, "/signup")} className="font-semibold text-foreground underline">
            {strings.signUp}
          </AppLink>
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
    <div className="space-y-1.5">
      <div
        className={cn(
          "relative rounded-lg bg-muted/30 px-4 py-3 ring-1 ring-border transition-colors focus-within:ring-foreground/40",
          error && "ring-destructive"
        )}
      >
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          className={cn(
            "mt-0.5 w-full bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/50",
            error && "pr-10"
          )}
        />
        {error ? <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" /> : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
