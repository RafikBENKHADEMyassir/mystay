import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const menuSetupCopy = {
  en: {
    title: "Menu setup",
    description: "Configure guest-facing menus and ordering modules.",
    body: "This section will host menu builders for room service, restaurants, and minibar.",
  },
  fr: {
    title: "Configuration menu",
    description: "Configurez les menus visibles client et modules de commande.",
    body: "Cette section accueillera les builders de menus room service, restaurants et minibar.",
  },
  es: {
    title: "Configuracion de menu",
    description: "Configura menus para huespedes y modulos de pedido.",
    body: "Esta seccion alojara constructores de menu para room service, restaurantes y minibar.",
  },
} as const;

export default function MenuSetupPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = menuSetupCopy[locale];
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
