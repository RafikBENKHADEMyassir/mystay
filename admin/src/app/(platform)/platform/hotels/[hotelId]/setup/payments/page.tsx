import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const paymentsSetupCopy = {
  en: {
    title: "Payments",
    description: "Configure payment providers and settlement rules.",
    body: "Coming next: PSP configuration, payout settings, and payment link defaults.",
  },
  fr: {
    title: "Paiements",
    description: "Configurez les fournisseurs de paiement et regles de reglement.",
    body: "A venir: configuration PSP, parametres de versement et valeurs par defaut des liens de paiement.",
  },
  es: {
    title: "Pagos",
    description: "Configura proveedores de pago y reglas de liquidacion.",
    body: "Proximamente: configuracion PSP, ajustes de cobro y valores por defecto de enlaces de pago.",
  },
} as const;

export default function PaymentsSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = paymentsSetupCopy[locale];
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
