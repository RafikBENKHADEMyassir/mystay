import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { NotificationsClient } from "./NotificationsClient";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const notificationsPageCopy = {
  en: {
    back: "Back to Settings",
    title: "Notification Providers",
    subtitle: "Configure email, SMS, and push notification providers for each hotel.",
  },
  fr: {
    back: "Retour aux parametres",
    title: "Fournisseurs de notifications",
    subtitle: "Configurez les fournisseurs email, SMS et push pour chaque hotel.",
  },
  es: {
    back: "Volver a configuracion",
    title: "Proveedores de notificaciones",
    subtitle: "Configura proveedores de email, SMS y push para cada hotel.",
  },
} as const;

export default function NotificationsSettingsPage({
  searchParams
}: {
  searchParams: { tab?: string };
}) {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = notificationsPageCopy[locale];
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

      <NotificationsClient initialTab={searchParams.tab} />
    </div>
  );
}
