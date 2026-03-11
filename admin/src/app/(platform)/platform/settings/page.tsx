import Link from "next/link";
import { cookies } from "next/headers";
import { Settings, Database, Shield, Bell, Mail, MessageSquare, Gauge, FileCheck, HardDrive } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminLocaleCookieName, resolveAdminLocale, type AdminLocale } from "@/lib/admin-locale";

const platformSettingsCopy = {
  en: {
    title: "Platform Settings",
    subtitle: "Configure global platform settings and integrations.",
    systemStatus: "System Status",
    systemStatusDescription: "Current system health and configuration",
    database: "Database",
    connected: "Connected",
    backendApi: "Backend API",
    running: "Running",
    environment: "Environment",
    production: "Production",
    development: "Development",
    security: "Security",
    securityDescription: "Authentication and access control",
    jwtTokens: "JWT Tokens",
    enabled: "Enabled",
    passwordHashing: "Password Hashing",
    cors: "CORS",
    configured: "Configured",
    apiConfiguration: "API Configuration",
    apiConfigurationDescription: "Backend API settings",
    backendUrl: "Backend URL",
    apiVersion: "API Version",
    configuration: "Configuration",
    cards: {
      emailProviderTitle: "Email Provider",
      emailProviderDescription: "Configure SendGrid, Mailgun, SES for transactional emails.",
      smsProviderTitle: "SMS Provider",
      smsProviderDescription: "Configure Twilio, MessageBird for SMS notifications.",
      pushNotificationsTitle: "Push Notifications",
      pushNotificationsDescription: "Set up Firebase Cloud Messaging or OneSignal.",
      rateLimitingTitle: "Rate Limiting & Quotas",
      rateLimitingDescription: "API rate limits, login throttling, and upload quotas.",
      auditLogsTitle: "Audit Logs & Compliance",
      auditLogsDescription: "View admin actions, track changes, and ensure compliance.",
      backupTitle: "Backup & Disaster Recovery",
      backupDescription: "Database backups, retention policies, and recovery options.",
    },
  },
  fr: {
    title: "Parametres plateforme",
    subtitle: "Configurez les parametres globaux et integrations de la plateforme.",
    systemStatus: "Etat du systeme",
    systemStatusDescription: "Sante actuelle du systeme et configuration",
    database: "Base de donnees",
    connected: "Connectee",
    backendApi: "API backend",
    running: "En execution",
    environment: "Environnement",
    production: "Production",
    development: "Developpement",
    security: "Securite",
    securityDescription: "Authentification et controle d'acces",
    jwtTokens: "Tokens JWT",
    enabled: "Active",
    passwordHashing: "Hash mot de passe",
    cors: "CORS",
    configured: "Configure",
    apiConfiguration: "Configuration API",
    apiConfigurationDescription: "Parametres API backend",
    backendUrl: "URL backend",
    apiVersion: "Version API",
    configuration: "Configuration",
    cards: {
      emailProviderTitle: "Fournisseur Email",
      emailProviderDescription: "Configurez SendGrid, Mailgun, SES pour les emails transactionnels.",
      smsProviderTitle: "Fournisseur SMS",
      smsProviderDescription: "Configurez Twilio, MessageBird pour les notifications SMS.",
      pushNotificationsTitle: "Notifications push",
      pushNotificationsDescription: "Configurez Firebase Cloud Messaging ou OneSignal.",
      rateLimitingTitle: "Limites & quotas",
      rateLimitingDescription: "Limites API, throttling login et quotas d'upload.",
      auditLogsTitle: "Logs d'audit & conformite",
      auditLogsDescription: "Consultez les actions admin, suivez les changements et la conformite.",
      backupTitle: "Sauvegarde & reprise",
      backupDescription: "Sauvegardes base de donnees, retention et options de reprise.",
    },
  },
  es: {
    title: "Configuracion de plataforma",
    subtitle: "Configura ajustes globales e integraciones de la plataforma.",
    systemStatus: "Estado del sistema",
    systemStatusDescription: "Salud actual del sistema y configuracion",
    database: "Base de datos",
    connected: "Conectada",
    backendApi: "API backend",
    running: "En ejecucion",
    environment: "Entorno",
    production: "Produccion",
    development: "Desarrollo",
    security: "Seguridad",
    securityDescription: "Autenticacion y control de acceso",
    jwtTokens: "Tokens JWT",
    enabled: "Habilitado",
    passwordHashing: "Hash de contrasena",
    cors: "CORS",
    configured: "Configurado",
    apiConfiguration: "Configuracion API",
    apiConfigurationDescription: "Ajustes de API backend",
    backendUrl: "URL backend",
    apiVersion: "Version API",
    configuration: "Configuracion",
    cards: {
      emailProviderTitle: "Proveedor de email",
      emailProviderDescription: "Configura SendGrid, Mailgun, SES para emails transaccionales.",
      smsProviderTitle: "Proveedor SMS",
      smsProviderDescription: "Configura Twilio, MessageBird para notificaciones SMS.",
      pushNotificationsTitle: "Notificaciones push",
      pushNotificationsDescription: "Configura Firebase Cloud Messaging u OneSignal.",
      rateLimitingTitle: "Limites y cuotas",
      rateLimitingDescription: "Limites API, throttling de login y cuotas de carga.",
      auditLogsTitle: "Auditoria y cumplimiento",
      auditLogsDescription: "Ve acciones admin, rastrea cambios y asegura cumplimiento.",
      backupTitle: "Backup y recuperacion",
      backupDescription: "Backups de base de datos, politicas de retencion y recuperacion.",
    },
  },
} as const;

function settingsPages(locale: AdminLocale) {
  const t = platformSettingsCopy[locale].cards;
  return [
    {
      title: t.emailProviderTitle,
      description: t.emailProviderDescription,
      href: "/platform/settings/notifications?tab=email",
      icon: Mail
    },
    {
      title: t.smsProviderTitle,
      description: t.smsProviderDescription,
      href: "/platform/settings/notifications?tab=sms",
      icon: MessageSquare
    },
    {
      title: t.pushNotificationsTitle,
      description: t.pushNotificationsDescription,
      href: "/platform/settings/notifications?tab=push",
      icon: Bell
    },
    {
      title: t.rateLimitingTitle,
      description: t.rateLimitingDescription,
      href: "/platform/settings/rate-limits",
      icon: Gauge
    },
    {
      title: t.auditLogsTitle,
      description: t.auditLogsDescription,
      href: "/platform/settings/audit-logs",
      icon: FileCheck
    },
    {
      title: t.backupTitle,
      description: t.backupDescription,
      href: "/platform/settings/backup",
      icon: HardDrive
    }
  ];
}

export default function PlatformSettingsPage() {
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = platformSettingsCopy[locale];
  const cards = settingsPages(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t.systemStatus}
            </CardTitle>
            <CardDescription>{t.systemStatusDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.database}</span>
              <Badge variant="default">{t.connected}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.backendApi}</span>
              <Badge variant="default">{t.running}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.environment}</span>
              <Badge variant="secondary">
                {process.env.NODE_ENV === "production" ? t.production : t.development}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.security}
            </CardTitle>
            <CardDescription>{t.securityDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.jwtTokens}</span>
              <Badge variant="default">{t.enabled}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.passwordHashing}</span>
              <Badge variant="default">bcrypt</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.cors}</span>
              <Badge variant="secondary">{t.configured}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t.apiConfiguration}
            </CardTitle>
            <CardDescription>{t.apiConfigurationDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.backendUrl}</span>
              <code className="text-xs text-muted-foreground">
                {process.env.BACKEND_URL ?? "localhost:4000"}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.apiVersion}</span>
              <Badge variant="secondary">v1</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t.configuration}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <page.icon className="h-5 w-5" />
                    {page.title}
                  </CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
