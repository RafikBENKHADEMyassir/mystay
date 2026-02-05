"use client";

import Link from "next/link";
import { ChevronRight, Mail, KeyRound } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

function helpStrings(locale: string) {
  if (locale === "fr") {
    return {
      title: "Besoin d’aide ?",
      forgotPassword: "J’ai oublié mon mot de passe",
      forgotEmail: "J’ai oublié mon adresse e‑mail",
      contact: "Contacter l’assistance"
    };
  }

  return {
    title: "Need help?",
    forgotPassword: "I forgot my password",
    forgotEmail: "I forgot my email address",
    contact: "Contact support"
  };
}

function HelpRow({
  href,
  icon,
  label
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-4 shadow-sm ring-1 ring-border",
        "active:scale-[0.99] transition"
      )}
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted/40 text-foreground">
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const strings = helpStrings(locale);

  return (
    <div>
      <Topbar title={strings.title} backHref={withLocale(locale, "/login")} />

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-4">
        <HelpRow
          href={withLocale(locale, "/login")}
          icon={<KeyRound className="h-4 w-4" />}
          label={strings.forgotPassword}
        />
        <HelpRow
          href={withLocale(locale, "/login")}
          icon={<Mail className="h-4 w-4" />}
          label={strings.forgotEmail}
        />

        <div className="pt-6 text-center text-sm text-muted-foreground">
          <a href="mailto:support@mystay.com" className="font-semibold text-foreground underline">
            {strings.contact}
          </a>
        </div>
      </main>
    </div>
  );
}

