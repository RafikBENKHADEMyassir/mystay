"use client";

import { useState, useCallback } from "react";
import { Minus, Plus, Clock } from "lucide-react";

export type FormFieldType = 
  | "quantity"
  | "select"
  | "multiselect"
  | "text"
  | "textarea"
  | "time"
  | "date"
  | "datetime"
  | "checkbox";

export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormField = {
  name: string;
  type: FormFieldType;
  label: string;
  default?: string | number | boolean | string[];
  min?: number;
  max?: number;
  options?: FormFieldOption[];
  required?: boolean;
  placeholder?: string;
};

export type ServiceItem = {
  id: string;
  categoryId: string;
  hotelId: string;
  department: string;
  nameKey: string;
  nameDefault: string;
  descriptionKey: string;
  descriptionDefault: string;
  icon: string;
  formFields: FormField[];
  estimatedTimeMinutes: number | null;
  priceCents: number | null;
  currency: string;
  sortOrder: number;
  requiresConfirmation: boolean;
};

type ServiceRequestFormProps = {
  serviceItem: ServiceItem;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
};

export function ServiceRequestForm({
  serviceItem,
  onSubmit,
  isSubmitting = false
}: ServiceRequestFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    serviceItem.formFields.forEach((field) => {
      if (field.default !== undefined) {
        initial[field.name] = field.default;
      } else if (field.type === "quantity") {
        initial[field.name] = field.min ?? 1;
      } else if (field.type === "multiselect") {
        initial[field.name] = [];
      } else if (field.type === "checkbox") {
        initial[field.name] = false;
      } else {
        initial[field.name] = "";
      }
    });
    return initial;
  });

  const updateField = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];

    switch (field.type) {
      case "quantity":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting || (typeof value === "number" && value <= (field.min ?? 1))}
                onClick={() => updateField(field.name, Math.max((field.min ?? 1), (value as number) - 1))}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-3xl font-semibold text-gray-900 w-16 text-center">
                {value as number}
              </span>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting || (typeof value === "number" && value >= (field.max ?? 99))}
                onClick={() => updateField(field.name, Math.min((field.max ?? 99), (value as number) + 1))}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    value === option.value
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => updateField(field.name, option.value)}
                  disabled={isSubmitting}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "multiselect":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => {
                const selected = Array.isArray(value) && value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (selected) {
                        updateField(field.name, currentValues.filter((v: string) => v !== option.value));
                      } else {
                        updateField(field.name, [...currentValues, option.value]);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "time":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type="time"
              value={value as string}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        );

      case "date":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type="date"
              value={value as string}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        );

      case "datetime":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type="datetime-local"
              value={value as string}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <textarea
              value={value as string}
              placeholder={field.placeholder}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0 resize-none"
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="flex items-center gap-3">
            <input
              id={field.name}
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => updateField(field.name, e.target.checked)}
              disabled={isSubmitting}
              className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <label htmlFor={field.name} className="text-sm text-gray-700">{field.label}</label>
          </div>
        );

      case "text":
      default:
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type="text"
              value={value as string}
              placeholder={field.placeholder}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serviceItem.formFields.length > 0 ? (
        serviceItem.formFields.map(renderField)
      ) : (
        <p className="text-center text-sm text-gray-500 py-4">
          Aucune option supplémentaire requise. Cliquez sur Valider pour envoyer votre demande.
        </p>
      )}

      {/* Info section */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
        {serviceItem.estimatedTimeMinutes && (
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5">
            <Clock className="h-4 w-4" />
            <span>~{serviceItem.estimatedTimeMinutes} min</span>
          </div>
        )}
        {serviceItem.priceCents !== null && serviceItem.priceCents > 0 && (
          <div className="bg-gray-50 rounded-full px-3 py-1.5 font-medium text-gray-700">
            {(serviceItem.priceCents / 100).toFixed(0)},00 €
          </div>
        )}
      </div>

      {/* Submit button */}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full rounded-full bg-gray-900 py-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? "Envoi en cours…" : "Valider"}
      </button>
    </form>
  );
}
