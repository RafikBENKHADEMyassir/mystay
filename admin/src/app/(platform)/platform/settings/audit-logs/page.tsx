import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { AuditLogsClient } from "./AuditLogsClient";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const auditLogsPageCopy = {
  en: {
    back: "Back to Settings",
    title: "Audit Logs & Compliance",
    subtitle: "Track admin actions, configuration changes, and ensure regulatory compliance.",
  },
  fr: {
    back: "Retour aux parametres",
    title: "Logs d'audit & conformite",
    subtitle: "Suivez les actions admin, changements de config et conformite reglementaire.",
  },
  es: {
    back: "Volver a configuracion",
    title: "Auditoria y cumplimiento",
    subtitle: "Rastrea acciones admin, cambios de configuracion y cumplimiento normativo.",
  },
} as const;

export default function AuditLogsPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = auditLogsPageCopy[locale];
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

      <AuditLogsClient />
    </div>
  );
}
