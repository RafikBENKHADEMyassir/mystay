"use client";

import { AppLink } from "@/components/ui/app-link";
import { ChevronRight, Mail, KeyRound } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { useLocale } from "@/components/providers/locale-provider";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

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
    <AppLink
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
    </AppLink>
  );
}

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const { content } = useGuestContent(locale);
  const strings = content?.pages.auth.forgotPassword;
  if (!strings) return <div className="min-h-screen bg-background" />;

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
