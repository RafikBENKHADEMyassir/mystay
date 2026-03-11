import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { BackupClient } from "./BackupClient";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const backupPageCopy = {
  en: {
    back: "Back to Settings",
    title: "Backup & Disaster Recovery",
    subtitle: "Database backups, retention policies, and recovery options.",
  },
  fr: {
    back: "Retour aux parametres",
    title: "Sauvegarde & reprise",
    subtitle: "Sauvegardes base de donnees, retention et options de reprise.",
  },
  es: {
    back: "Volver a configuracion",
    title: "Backup y recuperacion",
    subtitle: "Backups de base de datos, politicas de retencion y opciones de recuperacion.",
  },
} as const;

export default function BackupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = backupPageCopy[locale];
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

      <BackupClient />
    </div>
  );
}
