import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";

const notificationCenterCopy = {
  en: {
    title: "Notification center",
    description: "Configure email/SMS/push notifications and delivery providers.",
    body: "Coming next: provider keys (Sendgrid/Twilio/FCM) and per-message toggles.",
  },
  fr: {
    title: "Centre de notifications",
    description: "Configurez les notifications email/SMS/push et fournisseurs d'envoi.",
    body: "A venir: cles fournisseurs (Sendgrid/Twilio/FCM) et toggles par message.",
  },
  es: {
    title: "Centro de notificaciones",
    description: "Configura notificaciones email/SMS/push y proveedores de entrega.",
    body: "Proximamente: claves de proveedores (Sendgrid/Twilio/FCM) y toggles por mensaje.",
  },
} as const;

export default function NotificationCenterPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = notificationCenterCopy[locale];
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
