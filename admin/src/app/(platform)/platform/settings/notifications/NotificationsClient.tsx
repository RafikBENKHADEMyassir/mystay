"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Mail, MessageSquare, Bell, Check, X, ChevronDown, ChevronUp, Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { defaultAdminLocale, getAdminLocaleFromPathname, type AdminLocale } from "@/lib/admin-locale";

type HotelNotification = {
  hotelId: string;
  hotelName: string;
  city: string | null;
  isActive: boolean;
  emailProvider: string;
  emailConfig: Record<string, string>;
  smsProvider: string;
  smsConfig: Record<string, string>;
  pushProvider: string;
  pushConfig: Record<string, string>;
  updatedAt: string | null;
};

const EMAIL_PROVIDERS = ["none", "mock", "sendgrid", "mailgun", "ses"] as const;
const SMS_PROVIDERS = ["none", "mock", "twilio", "messagebird"] as const;
const PUSH_PROVIDERS = ["none", "mock", "firebase", "onesignal"] as const;

const notificationsCopy = {
  en: {
    providerLabels: {
      none: "None",
      mock: "Mock (testing)",
      sendgrid: "SendGrid",
      mailgun: "Mailgun",
      ses: "Amazon SES",
      twilio: "Twilio",
      messagebird: "MessageBird",
      firebase: "Firebase (FCM)",
      onesignal: "OneSignal",
    },
    configLabels: {
      apiKey: "API Key",
      fromEmail: "From Email",
      domain: "Domain",
      accessKeyId: "Access Key ID",
      secretAccessKey: "Secret Access Key",
      region: "AWS Region",
      accountSid: "Account SID",
      authToken: "Auth Token",
      fromNumber: "From Number",
      serviceAccountJson: "Service Account JSON",
      projectId: "Project ID",
      appId: "App ID",
      originator: "Originator",
    },
    notConfigured: "Not configured",
    mock: "Mock",
    inactive: "Inactive",
    provider: "Provider",
    enterPrefix: "Enter",
    save: "Save",
    saving: "Saving...",
    saved: "Saved",
    saveFailed: "Save failed",
    networkError: "Network error",
    platformDefaults: "Platform Defaults",
    platformDefaultsDescriptionPrefix: "Fallback",
    platformDefaultsDescriptionSuffix: "provider used when a hotel has no provider configured. Hotels can override this.",
    defaultProvider: "Default Provider",
    saveDefault: "Save Default",
    tabEmail: "Email",
    tabSms: "SMS",
    tabPush: "Push",
    perHotelConfiguration: "Per-Hotel Configuration",
    hotelsConfiguredSuffix: "hotels have",
    configured: "configured",
    loadingHotels: "Loading hotels...",
    noHotels: "No hotels found.",
  },
  fr: {
    providerLabels: {
      none: "Aucun",
      mock: "Mock (test)",
      sendgrid: "SendGrid",
      mailgun: "Mailgun",
      ses: "Amazon SES",
      twilio: "Twilio",
      messagebird: "MessageBird",
      firebase: "Firebase (FCM)",
      onesignal: "OneSignal",
    },
    configLabels: {
      apiKey: "Cle API",
      fromEmail: "Email expediteur",
      domain: "Domaine",
      accessKeyId: "Access Key ID",
      secretAccessKey: "Secret Access Key",
      region: "Region AWS",
      accountSid: "Account SID",
      authToken: "Auth Token",
      fromNumber: "Numero expediteur",
      serviceAccountJson: "JSON compte service",
      projectId: "Project ID",
      appId: "App ID",
      originator: "Originateur",
    },
    notConfigured: "Non configure",
    mock: "Mock",
    inactive: "Inactif",
    provider: "Fournisseur",
    enterPrefix: "Saisir",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Enregistre",
    saveFailed: "Echec d'enregistrement",
    networkError: "Erreur reseau",
    platformDefaults: "Valeurs plateforme par defaut",
    platformDefaultsDescriptionPrefix: "Fournisseur de secours",
    platformDefaultsDescriptionSuffix: "utilise quand un hotel n'a aucun fournisseur configure. Les hotels peuvent surcharger.",
    defaultProvider: "Fournisseur par defaut",
    saveDefault: "Enregistrer defaut",
    tabEmail: "Email",
    tabSms: "SMS",
    tabPush: "Push",
    perHotelConfiguration: "Configuration par hotel",
    hotelsConfiguredSuffix: "hotels ont",
    configured: "configure",
    loadingHotels: "Chargement des hotels...",
    noHotels: "Aucun hotel trouve.",
  },
  es: {
    providerLabels: {
      none: "Ninguno",
      mock: "Mock (pruebas)",
      sendgrid: "SendGrid",
      mailgun: "Mailgun",
      ses: "Amazon SES",
      twilio: "Twilio",
      messagebird: "MessageBird",
      firebase: "Firebase (FCM)",
      onesignal: "OneSignal",
    },
    configLabels: {
      apiKey: "Clave API",
      fromEmail: "Email remitente",
      domain: "Dominio",
      accessKeyId: "Access Key ID",
      secretAccessKey: "Secret Access Key",
      region: "Region AWS",
      accountSid: "Account SID",
      authToken: "Auth Token",
      fromNumber: "Numero remitente",
      serviceAccountJson: "JSON cuenta de servicio",
      projectId: "Project ID",
      appId: "App ID",
      originator: "Originador",
    },
    notConfigured: "Sin configurar",
    mock: "Mock",
    inactive: "Inactivo",
    provider: "Proveedor",
    enterPrefix: "Ingresa",
    save: "Guardar",
    saving: "Guardando...",
    saved: "Guardado",
    saveFailed: "Error al guardar",
    networkError: "Error de red",
    platformDefaults: "Valores por defecto de plataforma",
    platformDefaultsDescriptionPrefix: "Proveedor de respaldo",
    platformDefaultsDescriptionSuffix: "usado cuando un hotel no tiene proveedor configurado. Los hoteles pueden sobrescribirlo.",
    defaultProvider: "Proveedor por defecto",
    saveDefault: "Guardar por defecto",
    tabEmail: "Email",
    tabSms: "SMS",
    tabPush: "Push",
    perHotelConfiguration: "Configuracion por hotel",
    hotelsConfiguredSuffix: "hoteles tienen",
    configured: "configurado",
    loadingHotels: "Cargando hoteles...",
    noHotels: "No se encontraron hoteles.",
  },
} as const;

function providerLabel(provider: string, locale: AdminLocale) {
  return notificationsCopy[locale].providerLabels[provider as keyof (typeof notificationsCopy)[AdminLocale]["providerLabels"]] ?? provider;
}

const CONFIG_TEMPLATES: Record<string, Record<string, string>> = {
  sendgrid: { apiKey: "", fromEmail: "" },
  mailgun: { apiKey: "", domain: "", fromEmail: "" },
  ses: { accessKeyId: "", secretAccessKey: "", region: "eu-west-1" },
  twilio: { accountSid: "", authToken: "", fromNumber: "" },
  messagebird: { apiKey: "", originator: "" },
  firebase: { serviceAccountJson: "", projectId: "" },
  onesignal: { appId: "", apiKey: "" }
};

type Tab = "email" | "sms" | "push";

function ProviderBadge({ provider, locale }: { provider: string; locale: AdminLocale }) {
  if (provider === "none") return <Badge variant="outline">{notificationsCopy[locale].notConfigured}</Badge>;
  if (provider === "mock") return <Badge variant="secondary">{notificationsCopy[locale].mock}</Badge>;
  return <Badge variant="default">{providerLabel(provider, locale)}</Badge>;
}

function HotelConfigRow({
  hotel,
  channel,
  providers,
  onSaved,
  locale,
}: {
  hotel: HotelNotification;
  channel: Tab;
  providers: { value: string; label: string }[];
  onSaved: () => void;
  locale: AdminLocale;
}) {
  const t = notificationsCopy[locale];
  const currentProvider = channel === "email" ? hotel.emailProvider : channel === "sms" ? hotel.smsProvider : hotel.pushProvider;
  const currentConfig = channel === "email" ? hotel.emailConfig : channel === "sms" ? hotel.smsConfig : hotel.pushConfig;

  const [expanded, setExpanded] = useState(false);
  const [provider, setProvider] = useState(currentProvider);
  const [config, setConfig] = useState<Record<string, string>>(currentConfig ?? {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setProvider(currentProvider);
    setConfig(currentConfig ?? {});
  }, [currentProvider, currentConfig]);

  useEffect(() => {
    const template = CONFIG_TEMPLATES[provider];
    if (template) {
      setConfig((prev) => {
        const next = { ...template };
        for (const key of Object.keys(template)) {
          if (prev[key]) next[key] = prev[key];
        }
        return next;
      });
    } else {
      setConfig({});
    }
  }, [provider]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/platform/notifications/${hotel.hotelId}/${channel}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config })
      });
      if (res.ok) {
        setMessage(t.saved);
        onSaved();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.error ?? t.saveFailed);
      }
    } catch {
      setMessage(t.networkError);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const configFields = CONFIG_TEMPLATES[provider] ? Object.keys(CONFIG_TEMPLATES[provider]) : [];

  return (
    <div className="rounded-lg border">
      <button
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">{hotel.hotelName}</span>
          {hotel.city && <span className="text-sm text-muted-foreground">{hotel.city}</span>}
          {!hotel.isActive && <Badge variant="outline">{t.inactive}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <ProviderBadge provider={currentProvider} locale={locale} />
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {expanded && (
        <div className="space-y-4 border-t p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.provider}</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {configFields.length > 0 && (
            <div className="space-y-3">
              {configFields.map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">
                    {t.configLabels[key as keyof typeof t.configLabels] ?? key}
                  </label>
                  {key === "serviceAccountJson" ? (
                    <textarea
                      className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                      rows={4}
                      value={config[key] ?? ""}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={`${t.enterPrefix} ${t.configLabels[key as keyof typeof t.configLabels] ?? key}...`}
                    />
                  ) : (
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      type={key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token") ? "password" : "text"}
                      value={config[key] ?? ""}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={`${t.enterPrefix} ${t.configLabels[key as keyof typeof t.configLabels] ?? key}...`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t.saving : t.save}
            </button>
            {message && (
              <span className={`flex items-center gap-1 text-sm ${message === t.saved ? "text-green-600" : "text-destructive"}`}>
                {message === t.saved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type PlatformDefaults = {
  emailProvider: string;
  emailConfig: Record<string, string>;
  smsProvider: string;
  smsConfig: Record<string, string>;
  pushProvider: string;
  pushConfig: Record<string, string>;
};

function PlatformDefaultsCard({
  tab,
  providers,
  locale,
}: {
  tab: Tab;
  providers: { value: string; label: string }[];
  locale: AdminLocale;
}) {
  const t = notificationsCopy[locale];
  const [defaults, setDefaults] = useState<PlatformDefaults | null>(null);
  const [provider, setProvider] = useState("none");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/platform/settings");
        if (res.ok) {
          const data = await res.json();
          const d = data.settings?.default_notifications?.value;
          if (d) {
            setDefaults(d);
            const channelProvider = tab === "email" ? d.emailProvider : tab === "sms" ? d.smsProvider : d.pushProvider;
            const channelConfig = tab === "email" ? d.emailConfig : tab === "sms" ? d.smsConfig : d.pushConfig;
            setProvider(channelProvider ?? "none");
            setConfig(channelConfig ?? {});
          }
        }
      } catch {}
    })();
  }, [tab]);

  useEffect(() => {
    const template = CONFIG_TEMPLATES[provider];
    if (template) {
      setConfig((prev) => {
        const next = { ...template };
        for (const key of Object.keys(template)) {
          if (prev[key]) next[key] = prev[key];
        }
        return next;
      });
    } else {
      setConfig({});
    }
  }, [provider]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const updated: PlatformDefaults = {
      emailProvider: defaults?.emailProvider ?? "none",
      emailConfig: defaults?.emailConfig ?? {},
      smsProvider: defaults?.smsProvider ?? "none",
      smsConfig: defaults?.smsConfig ?? {},
      pushProvider: defaults?.pushProvider ?? "none",
      pushConfig: defaults?.pushConfig ?? {}
    };
    if (tab === "email") { updated.emailProvider = provider; updated.emailConfig = config; }
    if (tab === "sms") { updated.smsProvider = provider; updated.smsConfig = config; }
    if (tab === "push") { updated.pushProvider = provider; updated.pushConfig = config; }

    try {
      const res = await fetch("/api/platform/settings/default_notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
      setMessage(res.ok ? t.saved : t.saveFailed);
      if (res.ok) setDefaults(updated);
    } catch {
      setMessage(t.networkError);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const configFields = CONFIG_TEMPLATES[provider] ? Object.keys(CONFIG_TEMPLATES[provider]) : [];

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.platformDefaults}</CardTitle>
        <CardDescription>
          {t.platformDefaultsDescriptionPrefix} {tab} {t.platformDefaultsDescriptionSuffix}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t.defaultProvider}</label>
          <select
            className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {providers.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        {configFields.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {configFields.map((key) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{t.configLabels[key as keyof typeof t.configLabels] ?? key}</label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  type={key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token") ? "password" : "text"}
                  value={config[key] ?? ""}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                  placeholder={`${t.enterPrefix} ${t.configLabels[key as keyof typeof t.configLabels] ?? key}...`}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? t.saving : t.saveDefault}
          </button>
          {message && (
            <span className={`flex items-center gap-1 text-sm ${message === t.saved ? "text-green-600" : "text-destructive"}`}>
              {message === t.saved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsClient({ initialTab }: { initialTab?: string }) {
  const pathname = usePathname() ?? "/platform/settings/notifications";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = notificationsCopy[locale];
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? "email");
  const [hotels, setHotels] = useState<HotelNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/notifications-overview");
      if (res.ok) {
        const data = await res.json();
        setHotels(data.items ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const providerValues = tab === "email" ? EMAIL_PROVIDERS : tab === "sms" ? SMS_PROVIDERS : PUSH_PROVIDERS;
  const providers = providerValues.map((value) => ({ value, label: providerLabel(value, locale) }));
  const providerKey = tab === "email" ? "emailProvider" : tab === "sms" ? "smsProvider" : "pushProvider";

  const configured = hotels.filter((h) => h[providerKey] !== "none").length;
  const total = hotels.length;

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: "email", label: t.tabEmail, icon: Mail },
    { key: "sms", label: t.tabSms, icon: MessageSquare },
    { key: "push", label: t.tabPush, icon: Bell }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <PlatformDefaultsCard tab={tab} providers={providers} locale={locale} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.perHotelConfiguration}</CardTitle>
          <CardDescription>
            {configured} / {total} {t.hotelsConfiguredSuffix} {tab} {t.configured}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: total > 0 ? `${(configured / total) * 100}%` : "0%" }}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">{t.loadingHotels}</div>
      ) : hotels.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t.noHotels}</div>
      ) : (
        <div className="space-y-2">
          {hotels.map((hotel) => (
            <HotelConfigRow
              key={hotel.hotelId}
              hotel={hotel}
              channel={tab}
              providers={providers}
              onSaved={fetchData}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
