import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const hotelRulesCopy = {
  en: {
    title: "Hotel rules",
    description: "Configure policies shown to guests during the journey.",
    body: "Coming next: quiet hours, smoking policies, and multi-language copy.",
  },
  fr: {
    title: "Regles hotel",
    description: "Configurez les politiques affichees aux clients pendant le parcours.",
    body: "A venir: heures calmes, politiques fumeur et contenus multilingues.",
  },
  es: {
    title: "Reglas del hotel",
    description: "Configura politicas mostradas a los huespedes durante el recorrido.",
    body: "Proximamente: horario de silencio, politicas de fumar y copias multilingues.",
  },
} as const;

export default function HotelRulesSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = hotelRulesCopy[locale];
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
