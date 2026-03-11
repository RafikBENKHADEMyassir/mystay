import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";

type Hotel = {
  id: string;
  name: string;
};

type IntegrationOptions = {
  pms: {
    providers: string[];
    configTemplates: Record<string, Record<string, unknown>>;
  };
  digitalKey: {
    providers: string[];
    configTemplates: Record<string, Record<string, unknown>>;
  };
  spa: {
    providers: string[];
    configTemplates: Record<string, Record<string, unknown>>;
  };
  notifications: {
    email: {
      providers: string[];
      configTemplates: Record<string, Record<string, unknown>>;
    };
    sms: {
      providers: string[];
      configTemplates: Record<string, Record<string, unknown>>;
    };
    push: {
      providers: string[];
      configTemplates: Record<string, Record<string, unknown>>;
    };
  };
};

type HotelIntegrations = {
  hotelId: string;
  pms: {
    provider: string;
    config: Record<string, unknown>;
  };
  digitalKey: {
    provider: string;
    config: Record<string, unknown>;
  };
  spa: {
    provider: string;
    config: Record<string, unknown>;
  };
  updatedAt: string;
};

type HotelNotifications = {
  hotelId: string;
  email: {
    provider: string;
    config: Record<string, unknown>;
  };
  sms: {
    provider: string;
    config: Record<string, unknown>;
  };
  push: {
    provider: string;
    config: Record<string, unknown>;
  };
  updatedAt: string;
};

type IntegrationsPageProps = {
  searchParams?: {
    hotel?: string;
    saved?: string;
    queued?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const integrationsCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Integrations",
    subtitle: "Configure PMS, spa, and digital key providers per hotel.",
    subtitleFallback: "Configure PMS, spa, and digital key providers per hotel (start the backend first).",
    fallbackDescriptionPrefix: "Backend unreachable, no hotels seeded, or insufficient permissions. Run",
    thenRun: "then",
    andRefresh: "and refresh.",
    saveFailed: "Save failed",
    updated: "Updated",
    hotel: "Hotel",
    hotels: "Hotels",
    selectHotel: "Select the hotel to configure.",
    provider: "Provider",
    configJson: "Config (JSON)",
    template: "Template",
    pmsTitle: "PMS",
    pmsDescription: "Drives reservations, folios, and room lifecycle.",
    savePms: "Save PMS settings",
    digitalKeyTitle: "Digital key",
    digitalKeyDescription: "Issues wallet keys after check-in validation.",
    saveDigitalKey: "Save digital key settings",
    spaTitle: "Spa",
    spaDescription: "Catalog, availability, and booking integration.",
    saveSpa: "Save spa settings",
    notificationsTitle: "Notifications",
    notificationsDescription: "Email, SMS, and push providers used for invites and updates.",
    email: "Email",
    sms: "SMS",
    push: "Push",
    saveEmail: "Save email",
    saveSms: "Save SMS",
    savePush: "Save push",
    testNotificationsTitle: "Test notifications",
    testNotificationsDescription: "Enqueues an outbox item for the selected hotel. Use real provider credentials via env vars when needed.",
    channel: "Channel",
    toAddress: "To address",
    subjectOptional: "Subject (optional)",
    body: "Body",
    queueTestNotification: "Queue test notification",
    toAddressPlaceholder: "email / phone / device token",
    subjectPlaceholder: "MyStay test notification",
    bodyDefault: "Hello from MyStay",
  },
  fr: {
    appName: "MyStay Admin",
    title: "Integrations",
    subtitle: "Configurer les fournisseurs PMS, spa et cle numerique par hotel.",
    subtitleFallback: "Configurer PMS, spa et cle numerique par hotel (demarrez d'abord le backend).",
    fallbackDescriptionPrefix: "Backend inaccessible, aucun hotel initialise ou permissions insuffisantes. Lancez",
    thenRun: "puis",
    andRefresh: "et actualisez.",
    saveFailed: "Echec de sauvegarde",
    updated: "Mis a jour",
    hotel: "Hotel",
    hotels: "Hotels",
    selectHotel: "Selectionnez l'hotel a configurer.",
    provider: "Fournisseur",
    configJson: "Config (JSON)",
    template: "Modele",
    pmsTitle: "PMS",
    pmsDescription: "Gere reservations, folios et cycle de vie des chambres.",
    savePms: "Enregistrer parametres PMS",
    digitalKeyTitle: "Cle numerique",
    digitalKeyDescription: "Emet des cles wallet apres validation du check-in.",
    saveDigitalKey: "Enregistrer parametres cle numerique",
    spaTitle: "Spa",
    spaDescription: "Catalogue, disponibilite et integration de reservation.",
    saveSpa: "Enregistrer parametres spa",
    notificationsTitle: "Notifications",
    notificationsDescription: "Fournisseurs Email, SMS et push utilises pour invitations et mises a jour.",
    email: "Email",
    sms: "SMS",
    push: "Push",
    saveEmail: "Enregistrer email",
    saveSms: "Enregistrer SMS",
    savePush: "Enregistrer push",
    testNotificationsTitle: "Tester les notifications",
    testNotificationsDescription: "Ajoute un element dans l'outbox pour l'hotel selectionne. Utilisez de vraies informations fournisseur via variables d'environnement si besoin.",
    channel: "Canal",
    toAddress: "Adresse destinataire",
    subjectOptional: "Objet (optionnel)",
    body: "Corps",
    queueTestNotification: "Mettre en file une notification test",
    toAddressPlaceholder: "email / telephone / token appareil",
    subjectPlaceholder: "Notification test MyStay",
    bodyDefault: "Bonjour de MyStay",
  },
  es: {
    appName: "MyStay Admin",
    title: "Integraciones",
    subtitle: "Configura proveedores PMS, spa y llave digital por hotel.",
    subtitleFallback: "Configura PMS, spa y llave digital por hotel (inicia primero el backend).",
    fallbackDescriptionPrefix: "Backend no disponible, sin hoteles cargados o permisos insuficientes. Ejecuta",
    thenRun: "luego",
    andRefresh: "y recarga.",
    saveFailed: "Error al guardar",
    updated: "Actualizado",
    hotel: "Hotel",
    hotels: "Hoteles",
    selectHotel: "Selecciona el hotel a configurar.",
    provider: "Proveedor",
    configJson: "Config (JSON)",
    template: "Plantilla",
    pmsTitle: "PMS",
    pmsDescription: "Gestiona reservas, folios y ciclo de vida de habitaciones.",
    savePms: "Guardar ajustes PMS",
    digitalKeyTitle: "Llave digital",
    digitalKeyDescription: "Emite llaves wallet despues de validar check-in.",
    saveDigitalKey: "Guardar ajustes de llave digital",
    spaTitle: "Spa",
    spaDescription: "Catalogo, disponibilidad e integracion de reservas.",
    saveSpa: "Guardar ajustes de spa",
    notificationsTitle: "Notificaciones",
    notificationsDescription: "Proveedores de email, SMS y push para invitaciones y actualizaciones.",
    email: "Correo",
    sms: "SMS",
    push: "Push",
    saveEmail: "Guardar correo",
    saveSms: "Guardar SMS",
    savePush: "Guardar push",
    testNotificationsTitle: "Probar notificaciones",
    testNotificationsDescription: "Encola un elemento de outbox para el hotel seleccionado. Usa credenciales reales del proveedor por variables de entorno si hace falta.",
    channel: "Canal",
    toAddress: "Direccion destino",
    subjectOptional: "Asunto (opcional)",
    body: "Cuerpo",
    queueTestNotification: "Encolar notificacion de prueba",
    toAddressPlaceholder: "correo / telefono / token de dispositivo",
    subjectPlaceholder: "Notificacion de prueba MyStay",
    bodyDefault: "Hola desde MyStay",
  },
} as const;

async function getHotels(token: string): Promise<Hotel[]> {
  const response = await fetch(`${backendUrl}/api/v1/hotels`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Hotel[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

async function getOptions(token: string): Promise<IntegrationOptions | null> {
  const response = await fetch(`${backendUrl}/api/v1/integrations/options`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as IntegrationOptions;
}

async function getHotelIntegrations(hotelId: string, token: string): Promise<HotelIntegrations | null> {
  const response = await fetch(`${backendUrl}/api/v1/hotels/${encodeURIComponent(hotelId)}/integrations`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as HotelIntegrations;
}

async function getHotelNotifications(hotelId: string, token: string): Promise<HotelNotifications | null> {
  const response = await fetch(`${backendUrl}/api/v1/hotels/${encodeURIComponent(hotelId)}/notifications`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as HotelNotifications;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

async function updateIntegration({
  hotelId,
  kind,
  provider,
  config,
  token
}: {
  hotelId: string;
  kind: "pms" | "digital-key" | "spa";
  provider: string;
  config: Record<string, unknown>;
  token: string;
}) {
  const response = await fetch(`${backendUrl}/api/v1/hotels/${encodeURIComponent(hotelId)}/integrations/${kind}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ provider, config })
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const errorCode = typeof errorPayload?.error === "string" ? errorPayload.error : "backend_error";
    throw new Error(errorCode);
  }
}

async function updateNotificationChannel({
  hotelId,
  channel,
  provider,
  config,
  token
}: {
  hotelId: string;
  channel: "email" | "sms" | "push";
  provider: string;
  config: Record<string, unknown>;
  token: string;
}) {
  const response = await fetch(`${backendUrl}/api/v1/hotels/${encodeURIComponent(hotelId)}/notifications/${channel}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ provider, config })
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const errorCode = typeof errorPayload?.error === "string" ? errorPayload.error : "backend_error";
    throw new Error(errorCode);
  }
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = integrationsCopy[locale];
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  if (role !== "admin" && role !== "manager") {
    redirect("/");
  }
  const token = requireStaffToken();
  const hotels = await getHotels(token);
  const options = await getOptions(token);

  const selectedHotelId = searchParams?.hotel?.trim() || hotels[0]?.id || "";
  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId) ?? null;
  const integrations = selectedHotelId ? await getHotelIntegrations(selectedHotelId, token) : null;
  const notifications = selectedHotelId ? await getHotelNotifications(selectedHotelId, token) : null;

  async function updatePms(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const rawConfig = String(formData.get("configJson") ?? "{}");

    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_json");
      config = parsed as Record<string, unknown>;
    } catch {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=invalid_pms_config_json`);
    }

    try {
      const token = requireStaffToken();
      await updateIntegration({ hotelId, kind: "pms", provider, config, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&saved=1`);
  }

  async function updateDigitalKey(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const rawConfig = String(formData.get("configJson") ?? "{}");

    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_json");
      config = parsed as Record<string, unknown>;
    } catch {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=invalid_digital_key_config_json`);
    }

    try {
      const token = requireStaffToken();
      await updateIntegration({ hotelId, kind: "digital-key", provider, config, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&saved=1`);
  }

  async function updateSpa(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const rawConfig = String(formData.get("configJson") ?? "{}");

    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_json");
      config = parsed as Record<string, unknown>;
    } catch {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=invalid_spa_config_json`);
    }

    try {
      const token = requireStaffToken();
      await updateIntegration({ hotelId, kind: "spa", provider, config, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&saved=1`);
  }

  async function updateEmail(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const rawConfig = String(formData.get("configJson") ?? "{}");

    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_json");
      config = parsed as Record<string, unknown>;
    } catch {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=invalid_email_config_json`);
    }

    try {
      const token = requireStaffToken();
      await updateNotificationChannel({ hotelId, channel: "email", provider, config, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&saved=1`);
  }

  async function updateSms(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const rawConfig = String(formData.get("configJson") ?? "{}");

    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_json");
      config = parsed as Record<string, unknown>;
    } catch {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=invalid_sms_config_json`);
    }

    try {
      const token = requireStaffToken();
      await updateNotificationChannel({ hotelId, channel: "sms", provider, config, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&saved=1`);
  }

  async function updatePush(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const rawConfig = String(formData.get("configJson") ?? "{}");

    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_json");
      config = parsed as Record<string, unknown>;
    } catch {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=invalid_push_config_json`);
    }

    try {
      const token = requireStaffToken();
      await updateNotificationChannel({ hotelId, channel: "push", provider, config, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&saved=1`);
  }

  async function sendTestNotification(formData: FormData) {
    "use server";

    const hotelId = String(formData.get("hotelId") ?? "").trim();
    const channel = String(formData.get("channel") ?? "").trim();
    const toAddress = String(formData.get("toAddress") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const bodyText = String(formData.get("bodyText") ?? "").trim();

    if (!hotelId || !channel || !toAddress || !bodyText) {
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=missing_notification_fields`);
    }

    try {
      const token = requireStaffToken();
      const response = await fetch(`${backendUrl}/api/v1/hotels/${encodeURIComponent(hotelId)}/notifications/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channel, toAddress, subject, bodyText }),
        cache: "no-store"
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const errorCode =
          typeof errorPayload?.error === "string" ? errorPayload.error : `backend_error_${response.status}`;
        redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(errorCode)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "backend_error";
      redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&error=${encodeURIComponent(message)}`);
    }

    redirect(`/integrations?hotel=${encodeURIComponent(hotelId)}&queued=1`);
  }

  if (!selectedHotel || !options || !integrations || !notifications) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t.appName}</p>
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t.subtitleFallback}
            </p>
          </div>
        </header>

        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t.fallbackDescriptionPrefix}{" "}
            <code className="font-mono">npm run db:reset</code> {t.thenRun}{" "}
            <code className="font-mono">npm run dev:backend</code> {t.andRefresh}
          </CardContent>
        </Card>
      </div>
    );
  }

  const error = searchParams?.error?.trim() || null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </header>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            {t.saveFailed}: <span className="font-mono">{error}</span>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t.pmsTitle}</CardTitle>
                <CardDescription>{t.pmsDescription}</CardDescription>
              </div>
              <Badge variant="outline">{t.updated} {new Date(integrations.updatedAt).toLocaleString()}</Badge>
            </CardHeader>

            <CardContent>
              <form action={updatePms} className="space-y-4">
                <input type="hidden" name="hotelId" value={selectedHotel.id} />
                <div className="space-y-2">
                  <Label htmlFor="pms-provider">{t.provider}</Label>
                  <select id="pms-provider" name="provider" defaultValue={integrations.pms.provider} className={nativeSelectClassName}>
                    {options.pms.providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pms-config">{t.configJson}</Label>
                  <Textarea
                    id="pms-config"
                    name="configJson"
                    defaultValue={safeJsonStringify(integrations.pms.config)}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>

                <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-semibold">{t.template}</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
                    {safeJsonStringify(options.pms.configTemplates[integrations.pms.provider] ?? {})}
                  </pre>
                </details>

                <Button type="submit">{t.savePms}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t.digitalKeyTitle}</CardTitle>
                <CardDescription>{t.digitalKeyDescription}</CardDescription>
              </div>
              <Badge variant="outline">{t.hotel} {selectedHotel.id}</Badge>
            </CardHeader>

            <CardContent>
              <form action={updateDigitalKey} className="space-y-4">
                <input type="hidden" name="hotelId" value={selectedHotel.id} />
                <div className="space-y-2">
                  <Label htmlFor="digital-key-provider">{t.provider}</Label>
                  <select
                    id="digital-key-provider"
                    name="provider"
                    defaultValue={integrations.digitalKey.provider}
                    className={nativeSelectClassName}
                  >
                    {options.digitalKey.providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="digital-key-config">{t.configJson}</Label>
                  <Textarea
                    id="digital-key-config"
                    name="configJson"
                    defaultValue={safeJsonStringify(integrations.digitalKey.config)}
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>

                <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-semibold">{t.template}</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
                    {safeJsonStringify(options.digitalKey.configTemplates[integrations.digitalKey.provider] ?? {})}
                  </pre>
                </details>

                <Button type="submit">{t.saveDigitalKey}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t.spaTitle}</CardTitle>
                <CardDescription>{t.spaDescription}</CardDescription>
              </div>
              <Badge variant="outline">{t.hotel} {selectedHotel.id}</Badge>
            </CardHeader>

            <CardContent>
              <form action={updateSpa} className="space-y-4">
                <input type="hidden" name="hotelId" value={selectedHotel.id} />
                <div className="space-y-2">
                  <Label htmlFor="spa-provider">{t.provider}</Label>
                  <select
                    id="spa-provider"
                    name="provider"
                    defaultValue={integrations.spa.provider}
                    className={nativeSelectClassName}
                  >
                    {options.spa.providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spa-config">{t.configJson}</Label>
                  <Textarea
                    id="spa-config"
                    name="configJson"
                    defaultValue={safeJsonStringify(integrations.spa.config)}
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>

                <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-semibold">{t.template}</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
                    {safeJsonStringify(options.spa.configTemplates[integrations.spa.provider] ?? {})}
                  </pre>
                </details>

                <Button type="submit">{t.saveSpa}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t.notificationsTitle}</CardTitle>
                <CardDescription>{t.notificationsDescription}</CardDescription>
              </div>
              <Badge variant="outline">{t.updated} {new Date(notifications.updatedAt).toLocaleString()}</Badge>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 lg:grid-cols-3">
                <form action={updateEmail} className="space-y-3 rounded-lg border bg-muted/10 p-4">
                  <input type="hidden" name="hotelId" value={selectedHotel.id} />
                  <p className="text-sm font-semibold">{t.email}</p>

                  <div className="space-y-2">
                    <Label htmlFor="email-provider">{t.provider}</Label>
                    <select
                      id="email-provider"
                      name="provider"
                      defaultValue={notifications.email.provider}
                      className={nativeSelectClassName}
                    >
                      {options.notifications.email.providers.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-config">{t.configJson}</Label>
                    <Textarea
                      id="email-config"
                      name="configJson"
                      defaultValue={safeJsonStringify(notifications.email.config)}
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>

                  <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-semibold">{t.template}</summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
                      {safeJsonStringify(options.notifications.email.configTemplates[notifications.email.provider] ?? {})}
                    </pre>
                  </details>
                  <Button type="submit" size="sm">
                    {t.saveEmail}
                  </Button>
                </form>

                <form action={updateSms} className="space-y-3 rounded-lg border bg-muted/10 p-4">
                  <input type="hidden" name="hotelId" value={selectedHotel.id} />
                  <p className="text-sm font-semibold">{t.sms}</p>

                  <div className="space-y-2">
                    <Label htmlFor="sms-provider">{t.provider}</Label>
                    <select
                      id="sms-provider"
                      name="provider"
                      defaultValue={notifications.sms.provider}
                      className={nativeSelectClassName}
                    >
                      {options.notifications.sms.providers.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sms-config">{t.configJson}</Label>
                    <Textarea
                      id="sms-config"
                      name="configJson"
                      defaultValue={safeJsonStringify(notifications.sms.config)}
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>

                  <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-semibold">{t.template}</summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
                      {safeJsonStringify(options.notifications.sms.configTemplates[notifications.sms.provider] ?? {})}
                    </pre>
                  </details>
                  <Button type="submit" size="sm">
                    {t.saveSms}
                  </Button>
                </form>

                <form action={updatePush} className="space-y-3 rounded-lg border bg-muted/10 p-4">
                  <input type="hidden" name="hotelId" value={selectedHotel.id} />
                  <p className="text-sm font-semibold">{t.push}</p>

                  <div className="space-y-2">
                    <Label htmlFor="push-provider">{t.provider}</Label>
                    <select
                      id="push-provider"
                      name="provider"
                      defaultValue={notifications.push.provider}
                      className={nativeSelectClassName}
                    >
                      {options.notifications.push.providers.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="push-config">{t.configJson}</Label>
                    <Textarea
                      id="push-config"
                      name="configJson"
                      defaultValue={safeJsonStringify(notifications.push.config)}
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>

                  <details className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-semibold">{t.template}</summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono">
                      {safeJsonStringify(options.notifications.push.configTemplates[notifications.push.provider] ?? {})}
                    </pre>
                  </details>
                  <Button type="submit" size="sm">
                    {t.savePush}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.testNotificationsTitle}</CardTitle>
              <CardDescription>
                {t.testNotificationsDescription}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form action={sendTestNotification} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="hotelId" value={selectedHotel.id} />
                <div className="space-y-2">
                  <Label htmlFor="test-channel">{t.channel}</Label>
                  <select id="test-channel" name="channel" className={nativeSelectClassName}>
                    <option value="email">{t.email}</option>
                    <option value="sms">{t.sms}</option>
                    <option value="push">{t.push}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-to">{t.toAddress}</Label>
                  <Input id="test-to" name="toAddress" placeholder={t.toAddressPlaceholder} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="test-subject">{t.subjectOptional}</Label>
                  <Input id="test-subject" name="subject" placeholder={t.subjectPlaceholder} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="test-body">{t.body}</Label>
                  <Textarea id="test-body" name="bodyText" rows={4} defaultValue={t.bodyDefault} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">{t.queueTestNotification}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
