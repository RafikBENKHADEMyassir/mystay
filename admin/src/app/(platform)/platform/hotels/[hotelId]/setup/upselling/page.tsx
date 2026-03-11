import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const upsellingSetupCopy = {
  en: {
    title: "Upselling",
    description: "Configure upsells and touchpoints across the stay.",
    body: "Coming next: service catalog sync, weekday availability, and pricing rules.",
  },
  fr: {
    title: "Upselling",
    description: "Configurez les upsells et points de contact pendant le sejour.",
    body: "A venir: synchro catalogue services, disponibilites hebdo et regles tarifaires.",
  },
  es: {
    title: "Upselling",
    description: "Configura upsells y puntos de contacto durante la estancia.",
    body: "Proximamente: sincronizacion de catalogo de servicios, disponibilidad semanal y reglas de precio.",
  },
} as const;

export default function UpsellingSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = upsellingSetupCopy[locale];
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
