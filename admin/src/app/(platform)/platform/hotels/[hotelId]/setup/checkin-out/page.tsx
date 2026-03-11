import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const checkinOutCopy = {
  en: {
    title: "Check-in/out config",
    description: "Configure digital check-in/out requirements and flows.",
    body: "Coming next: ID verification requirements, payment holds, and e-signature settings.",
  },
  fr: {
    title: "Config check-in/out",
    description: "Configurez les exigences et parcours de check-in/out digital.",
    body: "A venir: verification d'identite, blocages de paiement et parametres de signature electronique.",
  },
  es: {
    title: "Config check-in/out",
    description: "Configura requisitos y flujos de check-in/out digital.",
    body: "Proximamente: verificacion de identidad, retenciones de pago y ajustes de firma electronica.",
  },
} as const;

export default function CheckinOutSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = checkinOutCopy[locale];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t.body}
      </CardContent>
    </Card>
  );
}
