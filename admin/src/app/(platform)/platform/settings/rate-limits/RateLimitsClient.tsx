"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Save, Check, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

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

const rateLimitsCopy = {
  en: {
    loading: "Loading...",
    title: "Global Rate Limits",
    description: "These limits apply across the entire platform. Individual hotels inherit these defaults.",
    fields: {
      apiRequestsPerMinute: { label: "API Requests / Minute", description: "Maximum API requests per client per minute", unit: "req/min" },
      apiRequestsPerHour: { label: "API Requests / Hour", description: "Maximum API requests per client per hour", unit: "req/hr" },
      loginAttemptsPerMinute: { label: "Login Attempts / Minute", description: "Maximum failed login attempts before temporary lockout", unit: "attempts/min" },
      fileUploadMaxMb: { label: "File Upload Max Size", description: "Maximum file upload size per request", unit: "MB" },
      webhooksPerHour: { label: "Webhooks / Hour", description: "Maximum outbound webhook calls per hour per hotel", unit: "hooks/hr" },
    },
    saving: "Saving...",
    saveChanges: "Save Changes",
    saved: "Saved",
    saveFailed: "Save failed",
    networkError: "Network error",
  },
  fr: {
    loading: "Chargement...",
    title: "Limites globales",
    description: "Ces limites s'appliquent a toute la plateforme. Les hotels heritent de ces valeurs par defaut.",
    fields: {
      apiRequestsPerMinute: { label: "Requetes API / minute", description: "Nombre max de requetes API par client et par minute", unit: "req/min" },
      apiRequestsPerHour: { label: "Requetes API / heure", description: "Nombre max de requetes API par client et par heure", unit: "req/h" },
      loginAttemptsPerMinute: { label: "Tentatives login / minute", description: "Nombre max d'echecs login avant verrouillage temporaire", unit: "tentatives/min" },
      fileUploadMaxMb: { label: "Taille max upload", description: "Taille maximale d'upload par requete", unit: "Mo" },
      webhooksPerHour: { label: "Webhooks / heure", description: "Nombre max d'appels webhook sortants par hotel et par heure", unit: "hooks/h" },
    },
    saving: "Enregistrement...",
    saveChanges: "Enregistrer modifications",
    saved: "Enregistre",
    saveFailed: "Echec d'enregistrement",
    networkError: "Erreur reseau",
  },
  es: {
    loading: "Cargando...",
    title: "Limites globales",
    description: "Estos limites aplican a toda la plataforma. Los hoteles heredan estos valores por defecto.",
    fields: {
      apiRequestsPerMinute: { label: "Solicitudes API / minuto", description: "Maximo de solicitudes API por cliente por minuto", unit: "req/min" },
      apiRequestsPerHour: { label: "Solicitudes API / hora", description: "Maximo de solicitudes API por cliente por hora", unit: "req/h" },
      loginAttemptsPerMinute: { label: "Intentos login / minuto", description: "Maximo de intentos fallidos antes de bloqueo temporal", unit: "intentos/min" },
      fileUploadMaxMb: { label: "Tamano maximo de carga", description: "Tamano maximo de archivo por solicitud", unit: "MB" },
      webhooksPerHour: { label: "Webhooks / hora", description: "Maximo de llamadas webhook salientes por hotel por hora", unit: "hooks/h" },
    },
    saving: "Guardando...",
    saveChanges: "Guardar cambios",
    saved: "Guardado",
    saveFailed: "Error al guardar",
    networkError: "Error de red",
  },
} as const;

const FIELD_KEYS: (keyof RateLimits)[] = [
  "apiRequestsPerMinute",
  "apiRequestsPerHour",
  "loginAttemptsPerMinute",
  "fileUploadMaxMb",
  "webhooksPerHour",
];

export function RateLimitsClient() {
  const pathname = usePathname() ?? "/platform/settings/rate-limits";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = rateLimitsCopy[locale];
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
          <CardTitle className="text-base">{t.title}</CardTitle>
          <CardDescription>
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {FIELD_KEYS.map((fieldKey) => (
            <div key={fieldKey} className="grid gap-2 sm:grid-cols-2 sm:items-center">
              <div>
                <label className="text-sm font-medium">{t.fields[fieldKey].label}</label>
                <p className="text-xs text-muted-foreground">{t.fields[fieldKey].description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={limits[fieldKey]}
                  onChange={(e) => handleChange(fieldKey, e.target.value)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">{t.fields[fieldKey].unit}</span>
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
          {saving ? t.saving : t.saveChanges}
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
