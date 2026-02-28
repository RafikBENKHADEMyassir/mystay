"use client";

import { useEffect, useState } from "react";
import { Save, Check, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RateLimits = {
  apiRequestsPerMinute: number;
  apiRequestsPerHour: number;
  loginAttemptsPerMinute: number;
  fileUploadMaxMb: number;
  webhooksPerHour: number;
};

const DEFAULTS: RateLimits = {
  apiRequestsPerMinute: 60,
  apiRequestsPerHour: 1000,
  loginAttemptsPerMinute: 5,
  fileUploadMaxMb: 10,
  webhooksPerHour: 500
};

const FIELDS: { key: keyof RateLimits; label: string; description: string; unit: string }[] = [
  { key: "apiRequestsPerMinute", label: "API Requests / Minute", description: "Maximum API requests per client per minute", unit: "req/min" },
  { key: "apiRequestsPerHour", label: "API Requests / Hour", description: "Maximum API requests per client per hour", unit: "req/hr" },
  { key: "loginAttemptsPerMinute", label: "Login Attempts / Minute", description: "Maximum failed login attempts before temporary lockout", unit: "attempts/min" },
  { key: "fileUploadMaxMb", label: "File Upload Max Size", description: "Maximum file upload size per request", unit: "MB" },
  { key: "webhooksPerHour", label: "Webhooks / Hour", description: "Maximum outbound webhook calls per hour per hotel", unit: "hooks/hr" }
];

export function RateLimitsClient() {
  const [limits, setLimits] = useState<RateLimits>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/platform/settings");
        if (res.ok) {
          const data = await res.json();
          const stored = data.settings?.rate_limits?.value;
          if (stored && typeof stored === "object") {
            setLimits({ ...DEFAULTS, ...stored });
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (key: keyof RateLimits, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setLimits((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/settings/rate_limits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: limits })
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
          <CardTitle className="text-base">Global Rate Limits</CardTitle>
          <CardDescription>
            These limits apply across the entire platform. Individual hotels inherit these defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {FIELDS.map((field) => (
            <div key={field.key} className="grid gap-2 sm:grid-cols-2 sm:items-center">
              <div>
                <label className="text-sm font-medium">{field.label}</label>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={limits[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">{field.unit}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
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
