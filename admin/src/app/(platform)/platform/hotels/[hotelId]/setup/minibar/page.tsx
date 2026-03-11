import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const minibarCopy = {
  en: {
    title: "Minibar",
    description: "Configure minibar catalog and posting rules.",
    body: "Coming next: item catalog, room presets, and PMS posting mapping.",
  },
  fr: {
    title: "Minibar",
    description: "Configurez le catalogue minibar et les regles de publication.",
    body: "A venir: catalogue d'articles, presets de chambre et mapping de publication PMS.",
  },
  es: {
    title: "Minibar",
    description: "Configura catalogo de minibar y reglas de registro.",
    body: "Proximamente: catalogo de articulos, preajustes de habitacion y mapeo de registro PMS.",
  },
} as const;

export default function MinibarSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = minibarCopy[locale];
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
