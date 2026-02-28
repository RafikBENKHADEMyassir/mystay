"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, MessageSquare, Bell, Check, X, ChevronDown, ChevronUp, Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const EMAIL_PROVIDERS = [
  { value: "none", label: "None" },
  { value: "mock", label: "Mock (testing)" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "mailgun", label: "Mailgun" },
  { value: "ses", label: "Amazon SES" }
];
const SMS_PROVIDERS = [
  { value: "none", label: "None" },
  { value: "mock", label: "Mock (testing)" },
  { value: "twilio", label: "Twilio" },
  { value: "messagebird", label: "MessageBird" }
];
const PUSH_PROVIDERS = [
  { value: "none", label: "None" },
  { value: "mock", label: "Mock (testing)" },
  { value: "firebase", label: "Firebase (FCM)" },
  { value: "onesignal", label: "OneSignal" }
];

const CONFIG_TEMPLATES: Record<string, Record<string, string>> = {
  sendgrid: { apiKey: "", fromEmail: "" },
  mailgun: { apiKey: "", domain: "", fromEmail: "" },
  ses: { accessKeyId: "", secretAccessKey: "", region: "eu-west-1" },
  twilio: { accountSid: "", authToken: "", fromNumber: "" },
  messagebird: { apiKey: "", originator: "" },
  firebase: { serviceAccountJson: "", projectId: "" },
  onesignal: { appId: "", apiKey: "" }
};

const CONFIG_LABELS: Record<string, string> = {
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
  originator: "Originator"
};

type Tab = "email" | "sms" | "push";

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "none") return <Badge variant="outline">Not configured</Badge>;
  if (provider === "mock") return <Badge variant="secondary">Mock</Badge>;
  return <Badge variant="default">{provider}</Badge>;
}

function HotelConfigRow({
  hotel,
  channel,
  providers,
  onSaved
}: {
  hotel: HotelNotification;
  channel: Tab;
  providers: { value: string; label: string }[];
  onSaved: () => void;
}) {
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
        setMessage("Saved");
        onSaved();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.error ?? "Save failed");
      }
    } catch {
      setMessage("Network error");
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
          {!hotel.isActive && <Badge variant="outline">Inactive</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <ProviderBadge provider={currentProvider} />
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {expanded && (
        <div className="space-y-4 border-t p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
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
                    {CONFIG_LABELS[key] ?? key}
                  </label>
                  {key === "serviceAccountJson" ? (
                    <textarea
                      className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                      rows={4}
                      value={config[key] ?? ""}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={`Enter ${CONFIG_LABELS[key] ?? key}...`}
                    />
                  ) : (
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      type={key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token") ? "password" : "text"}
                      value={config[key] ?? ""}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={`Enter ${CONFIG_LABELS[key] ?? key}...`}
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
              {saving ? "Saving..." : "Save"}
            </button>
            {message && (
              <span className={`flex items-center gap-1 text-sm ${message === "Saved" ? "text-green-600" : "text-destructive"}`}>
                {message === "Saved" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationsClient({ initialTab }: { initialTab?: string }) {
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

  const providers = tab === "email" ? EMAIL_PROVIDERS : tab === "sms" ? SMS_PROVIDERS : PUSH_PROVIDERS;
  const providerKey = tab === "email" ? "emailProvider" : tab === "sms" ? "smsProvider" : "pushProvider";

  const configured = hotels.filter((h) => h[providerKey] !== "none").length;
  const total = hotels.length;

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: "email", label: "Email", icon: Mail },
    { key: "sms", label: "SMS", icon: MessageSquare },
    { key: "push", label: "Push", icon: Bell }
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>
            {configured} of {total} hotels have {tab} configured
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
        <div className="py-12 text-center text-muted-foreground">Loading hotels...</div>
      ) : hotels.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No hotels found.</div>
      ) : (
        <div className="space-y-2">
          {hotels.map((hotel) => (
            <HotelConfigRow
              key={hotel.hotelId}
              hotel={hotel}
              channel={tab}
              providers={providers}
              onSaved={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
