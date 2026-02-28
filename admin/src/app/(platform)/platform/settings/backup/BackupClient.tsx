"use client";

import { useEffect, useState } from "react";
import { Save, Check, X, HardDrive, Database, Users, MessageSquare, BedDouble, Hotel } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const STORAGE_PROVIDERS = [
  { value: "none", label: "None (disabled)" },
  { value: "s3", label: "Amazon S3" },
  { value: "gcs", label: "Google Cloud Storage" },
  { value: "azure_blob", label: "Azure Blob Storage" },
  { value: "local", label: "Local filesystem" }
];

const FREQUENCIES = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" }
];

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
        setMessage("Saved");
      } else {
        setMessage("Save failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-5 w-5" />
            Database Overview
          </CardTitle>
          <CardDescription>Current database size and record counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{status?.database.size ?? "—"}</span>
            <span className="text-sm text-muted-foreground">total size</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Hotel} label="Hotels" value={status?.tables.hotelCount ?? 0} />
            <StatCard icon={BedDouble} label="Stays" value={status?.tables.stayCount ?? 0} />
            <StatCard icon={MessageSquare} label="Threads" value={status?.tables.threadCount ?? 0} />
            <StatCard icon={MessageSquare} label="Messages" value={status?.tables.messageCount ?? 0} />
            <StatCard icon={Users} label="Staff Users" value={status?.tables.staffCount ?? 0} />
            <StatCard icon={Users} label="Guests" value={status?.tables.guestCount ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup Configuration</CardTitle>
          <CardDescription>
            Configure automated database backups and retention policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Backups</label>
              <p className="text-xs text-muted-foreground">Turn on automated database backups</p>
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
              <label className="mb-1 block text-sm font-medium">Frequency</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={config.frequency}
                onChange={(e) => setConfig((c) => ({ ...c, frequency: e.target.value }))}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Retention (days)</label>
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
            <label className="mb-1 block text-sm font-medium">Storage Provider</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={config.storageProvider}
              onChange={(e) => setConfig((c) => ({ ...c, storageProvider: e.target.value }))}
            >
              {STORAGE_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <span className="text-sm font-medium">Last Backup</span>
              <p className="text-xs text-muted-foreground">
                {config.lastBackupAt
                  ? new Date(config.lastBackupAt).toLocaleString()
                  : "No backups performed yet"}
              </p>
            </div>
            <Badge variant={config.lastBackupAt ? "default" : "outline"}>
              {config.lastBackupAt ? "Completed" : "Never"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disaster Recovery</CardTitle>
          <CardDescription>Recovery procedures and compliance settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">Recovery Point Objective (RPO)</h4>
              <p className="mt-1 text-2xl font-bold">
                {config.frequency === "hourly" ? "1 hour" : config.frequency === "daily" ? "24 hours" : config.frequency === "weekly" ? "7 days" : "30 days"}
              </p>
              <p className="text-xs text-muted-foreground">Maximum data loss window based on backup frequency</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">Recovery Time Objective (RTO)</h4>
              <p className="mt-1 text-2xl font-bold">
                {status?.database.sizeBytes && status.database.sizeBytes < 1_000_000_000 ? "< 30 min" : "< 2 hours"}
              </p>
              <p className="text-xs text-muted-foreground">Estimated recovery time based on database size</p>
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
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {message && (
          <span className={`flex items-center gap-1 text-sm ${message === "Saved" ? "text-green-600" : "text-destructive"}`}>
            {message === "Saved" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
