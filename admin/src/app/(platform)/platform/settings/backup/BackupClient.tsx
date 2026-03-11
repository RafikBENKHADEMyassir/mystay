"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Save, Check, X, HardDrive, Database, Users, MessageSquare, BedDouble, Hotel } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { defaultAdminLocale, getAdminLocaleFromPathname, type AdminLocale } from "@/lib/admin-locale";

type BackupConfig = {
  enabled: boolean;
  frequency: string;
  retentionDays: number;
  storageProvider: string;
  lastBackupAt: string | null;
};

type TableCounts = {
  hotelCount: number;
  stayCount: number;
  threadCount: number;
  messageCount: number;
  staffCount: number;
  guestCount: number;
};

type BackupStatus = {
  database: { size: string; sizeBytes: number };
  tables: TableCounts;
  backupConfig: BackupConfig;
};

const STORAGE_PROVIDER_VALUES = ["none", "s3", "gcs", "azure_blob", "local"] as const;
const FREQUENCY_VALUES = ["hourly", "daily", "weekly", "monthly"] as const;

const backupCopy = {
  en: {
    loading: "Loading...",
    databaseOverview: "Database Overview",
    databaseOverviewDescription: "Current database size and record counts",
    totalSize: "total size",
    labels: {
      hotels: "Hotels",
      stays: "Stays",
      threads: "Threads",
      messages: "Messages",
      staffUsers: "Staff Users",
      guests: "Guests",
    },
    backupConfiguration: "Backup Configuration",
    backupConfigurationDescription: "Configure automated database backups and retention policies.",
    enableBackups: "Enable Backups",
    enableBackupsDescription: "Turn on automated database backups",
    frequency: "Frequency",
    retentionDays: "Retention (days)",
    storageProvider: "Storage Provider",
    lastBackup: "Last Backup",
    noBackupsYet: "No backups performed yet",
    completed: "Completed",
    never: "Never",
    disasterRecovery: "Disaster Recovery",
    disasterRecoveryDescription: "Recovery procedures and compliance settings",
    rpo: "Recovery Point Objective (RPO)",
    rpoDescription: "Maximum data loss window based on backup frequency",
    rto: "Recovery Time Objective (RTO)",
    rtoDescription: "Estimated recovery time based on database size",
    saving: "Saving...",
    saveConfiguration: "Save Configuration",
    saved: "Saved",
    saveFailed: "Save failed",
    networkError: "Network error",
    storageProviders: {
      none: "None (disabled)",
      s3: "Amazon S3",
      gcs: "Google Cloud Storage",
      azure_blob: "Azure Blob Storage",
      local: "Local filesystem",
    },
    frequencies: {
      hourly: "Hourly",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    durations: {
      hour: "1 hour",
      hours24: "24 hours",
      days7: "7 days",
      days30: "30 days",
      less30min: "< 30 min",
      less2hours: "< 2 hours",
    },
  },
  fr: {
    loading: "Chargement...",
    databaseOverview: "Vue d'ensemble base de donnees",
    databaseOverviewDescription: "Taille actuelle de la base et nombre d'enregistrements",
    totalSize: "taille totale",
    labels: {
      hotels: "Hotels",
      stays: "Sejours",
      threads: "Conversations",
      messages: "Messages",
      staffUsers: "Utilisateurs staff",
      guests: "Clients",
    },
    backupConfiguration: "Configuration des sauvegardes",
    backupConfigurationDescription: "Configurez les sauvegardes automatiques et la retention.",
    enableBackups: "Activer les sauvegardes",
    enableBackupsDescription: "Active les sauvegardes automatiques de la base",
    frequency: "Frequence",
    retentionDays: "Retention (jours)",
    storageProvider: "Fournisseur de stockage",
    lastBackup: "Derniere sauvegarde",
    noBackupsYet: "Aucune sauvegarde effectuee pour le moment",
    completed: "Terminee",
    never: "Jamais",
    disasterRecovery: "Reprise apres sinistre",
    disasterRecoveryDescription: "Procedures de reprise et parametres de conformite",
    rpo: "Objectif de point de reprise (RPO)",
    rpoDescription: "Perte maximale de donnees selon la frequence des sauvegardes",
    rto: "Objectif de temps de reprise (RTO)",
    rtoDescription: "Temps de reprise estime selon la taille de la base",
    saving: "Enregistrement...",
    saveConfiguration: "Enregistrer la configuration",
    saved: "Enregistre",
    saveFailed: "Echec d'enregistrement",
    networkError: "Erreur reseau",
    storageProviders: {
      none: "Aucun (desactive)",
      s3: "Amazon S3",
      gcs: "Google Cloud Storage",
      azure_blob: "Azure Blob Storage",
      local: "Fichiers locaux",
    },
    frequencies: {
      hourly: "Toutes les heures",
      daily: "Quotidienne",
      weekly: "Hebdomadaire",
      monthly: "Mensuelle",
    },
    durations: {
      hour: "1 heure",
      hours24: "24 heures",
      days7: "7 jours",
      days30: "30 jours",
      less30min: "< 30 min",
      less2hours: "< 2 heures",
    },
  },
  es: {
    loading: "Cargando...",
    databaseOverview: "Resumen de base de datos",
    databaseOverviewDescription: "Tamano actual de la base y conteo de registros",
    totalSize: "tamano total",
    labels: {
      hotels: "Hoteles",
      stays: "Estancias",
      threads: "Conversaciones",
      messages: "Mensajes",
      staffUsers: "Usuarios staff",
      guests: "Huespedes",
    },
    backupConfiguration: "Configuracion de backups",
    backupConfigurationDescription: "Configura backups automaticos y politicas de retencion.",
    enableBackups: "Habilitar backups",
    enableBackupsDescription: "Activa backups automaticos de la base de datos",
    frequency: "Frecuencia",
    retentionDays: "Retencion (dias)",
    storageProvider: "Proveedor de almacenamiento",
    lastBackup: "Ultimo backup",
    noBackupsYet: "Aun no se realizaron backups",
    completed: "Completado",
    never: "Nunca",
    disasterRecovery: "Recuperacion ante desastres",
    disasterRecoveryDescription: "Procedimientos de recuperacion y configuraciones de cumplimiento",
    rpo: "Objetivo de punto de recuperacion (RPO)",
    rpoDescription: "Ventana maxima de perdida de datos segun la frecuencia de backup",
    rto: "Objetivo de tiempo de recuperacion (RTO)",
    rtoDescription: "Tiempo estimado de recuperacion segun el tamano de la base",
    saving: "Guardando...",
    saveConfiguration: "Guardar configuracion",
    saved: "Guardado",
    saveFailed: "Error al guardar",
    networkError: "Error de red",
    storageProviders: {
      none: "Ninguno (deshabilitado)",
      s3: "Amazon S3",
      gcs: "Google Cloud Storage",
      azure_blob: "Azure Blob Storage",
      local: "Sistema de archivos local",
    },
    frequencies: {
      hourly: "Cada hora",
      daily: "Diaria",
      weekly: "Semanal",
      monthly: "Mensual",
    },
    durations: {
      hour: "1 hora",
      hours24: "24 horas",
      days7: "7 dias",
      days30: "30 dias",
      less30min: "< 30 min",
      less2hours: "< 2 horas",
    },
  },
} as const;

function StatCard({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function BackupClient() {
  const pathname = usePathname() ?? "/platform/settings/backup";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = backupCopy[locale];
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BackupConfig>({
    enabled: false,
    frequency: "daily",
    retentionDays: 30,
    storageProvider: "none",
    lastBackupAt: null
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/platform/backup-status");
        if (res.ok) {
          const data: BackupStatus = await res.json();
          setStatus(data);
          if (data.backupConfig) {
            setConfig(data.backupConfig);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/settings/backup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: config })
      });
      if (res.ok) {
        setMessage(t.saved);
      } else {
        setMessage(t.saveFailed);
      }
    } catch {
      setMessage(t.networkError);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-5 w-5" />
            {t.databaseOverview}
          </CardTitle>
          <CardDescription>{t.databaseOverviewDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{status?.database.size ?? "—"}</span>
            <span className="text-sm text-muted-foreground">{t.totalSize}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Hotel} label={t.labels.hotels} value={status?.tables.hotelCount ?? 0} />
            <StatCard icon={BedDouble} label={t.labels.stays} value={status?.tables.stayCount ?? 0} />
            <StatCard icon={MessageSquare} label={t.labels.threads} value={status?.tables.threadCount ?? 0} />
            <StatCard icon={MessageSquare} label={t.labels.messages} value={status?.tables.messageCount ?? 0} />
            <StatCard icon={Users} label={t.labels.staffUsers} value={status?.tables.staffCount ?? 0} />
            <StatCard icon={Users} label={t.labels.guests} value={status?.tables.guestCount ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.backupConfiguration}</CardTitle>
          <CardDescription>
            {t.backupConfigurationDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t.enableBackups}</label>
              <p className="text-xs text-muted-foreground">{t.enableBackupsDescription}</p>
            </div>
            <button
              className={`relative h-6 w-11 rounded-full transition-colors ${config.enabled ? "bg-primary" : "bg-muted"}`}
              onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.enabled ? "translate-x-5" : ""}`}
              />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t.frequency}</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={config.frequency}
                onChange={(e) => setConfig((c) => ({ ...c, frequency: e.target.value }))}
              >
                {FREQUENCY_VALUES.map((frequency) => (
                  <option key={frequency} value={frequency}>{t.frequencies[frequency]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t.retentionDays}</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={config.retentionDays}
                onChange={(e) => setConfig((c) => ({ ...c, retentionDays: parseInt(e.target.value, 10) || 30 }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t.storageProvider}</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={config.storageProvider}
              onChange={(e) => setConfig((c) => ({ ...c, storageProvider: e.target.value }))}
            >
              {STORAGE_PROVIDER_VALUES.map((provider) => (
                <option key={provider} value={provider}>{t.storageProviders[provider]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <span className="text-sm font-medium">{t.lastBackup}</span>
              <p className="text-xs text-muted-foreground">
                {config.lastBackupAt
                  ? new Date(config.lastBackupAt).toLocaleString(locale)
                  : t.noBackupsYet}
              </p>
            </div>
            <Badge variant={config.lastBackupAt ? "default" : "outline"}>
              {config.lastBackupAt ? t.completed : t.never}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.disasterRecovery}</CardTitle>
          <CardDescription>{t.disasterRecoveryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">{t.rpo}</h4>
              <p className="mt-1 text-2xl font-bold">
                {config.frequency === "hourly"
                  ? t.durations.hour
                  : config.frequency === "daily"
                    ? t.durations.hours24
                    : config.frequency === "weekly"
                      ? t.durations.days7
                      : t.durations.days30}
              </p>
              <p className="text-xs text-muted-foreground">{t.rpoDescription}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">{t.rto}</h4>
              <p className="mt-1 text-2xl font-bold">
                {status?.database.sizeBytes && status.database.sizeBytes < 1_000_000_000
                  ? t.durations.less30min
                  : t.durations.less2hours}
              </p>
              <p className="text-xs text-muted-foreground">{t.rtoDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? t.saving : t.saveConfiguration}
        </button>
        {message && (
          <span className={`flex items-center gap-1 text-sm ${message === t.saved ? "text-green-600" : "text-destructive"}`}>
            {message === t.saved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
