import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const roomServiceSetupCopy = {
  en: {
    title: "Room service",
    description: "Configure ordering hours, categories, and operational rules.",
    body: "Coming next: open hours, menu sources, and fulfillment SLAs.",
  },
  fr: {
    title: "Room service",
    description: "Configurez les horaires, categories et regles operationnelles de commande.",
    body: "A venir: heures d'ouverture, sources de menu et SLA de traitement.",
  },
  es: {
    title: "Room service",
    description: "Configura horarios de pedido, categorias y reglas operativas.",
    body: "Proximamente: horarios de apertura, fuentes de menu y SLA de cumplimiento.",
  },
} as const;

export default function RoomServiceSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = roomServiceSetupCopy[locale];
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
