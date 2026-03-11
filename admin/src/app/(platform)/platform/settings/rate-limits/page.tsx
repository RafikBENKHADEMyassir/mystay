import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { RateLimitsClient } from "./RateLimitsClient";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const rateLimitsPageCopy = {
  en: {
    back: "Back to Settings",
    title: "Rate Limiting & Quotas",
    subtitle: "Configure API rate limits, login throttling, and upload quotas.",
  },
  fr: {
    back: "Retour aux parametres",
    title: "Limitation & quotas",
    subtitle: "Configurez les limites API, le throttling login et les quotas d'upload.",
  },
  es: {
    back: "Volver a configuracion",
    title: "Limites y cuotas",
    subtitle: "Configura limites API, throttling de login y cuotas de carga.",
  },
} as const;

export default function RateLimitsPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = rateLimitsPageCopy[locale];
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platform/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <RateLimitsClient />
    </div>
  );
}
