"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={isSubmitting || (typeof value === "number" && value <= (field.min ?? 1))}
                onClick={() => updateField(field.name, Math.max((field.min ?? 1), (value as number) - 1))}
              >
                −
              </Button>
              <Input
                id={field.name}
                type="number"
                value={value as number}
                min={field.min ?? 1}
                max={field.max ?? 99}
                className="h-10 w-20 text-center"
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  if (!isNaN(num)) {
                    updateField(field.name, Math.min(field.max ?? 99, Math.max(field.min ?? 1, num)));
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={isSubmitting || (typeof value === "number" && value >= (field.max ?? 99))}
                onClick={() => updateField(field.name, Math.min((field.max ?? 99), (value as number) + 1))}
              >
                +
              </Button>
            </div>
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={value === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateField(field.name, option.value)}
                  disabled={isSubmitting}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "multiselect":
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => {
                const selected = Array.isArray(value) && value.includes(option.value);
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
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
                  </Button>
                );
              })}
            </div>
          </div>
        );

      case "time":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="time"
              value={value as string}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        );

      case "date":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="date"
              value={value as string}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        );

      case "datetime":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="datetime-local"
              value={value as string}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Textarea
              id={field.name}
              value={value as string}
              placeholder={field.placeholder}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="flex items-center gap-2">
            <input
              id={field.name}
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => updateField(field.name, e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        );

      case "text":
      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="text"
              value={value as string}
              placeholder={field.placeholder}
              onChange={(e) => updateField(field.name, e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serviceItem.formFields.length > 0 ? (
        serviceItem.formFields.map(renderField)
      ) : (
        <p className="text-sm text-muted-foreground">
          No additional options required. Click submit to send your request.
        </p>
      )}

      {serviceItem.estimatedTimeMinutes && (
        <p className="text-sm text-muted-foreground">
          ⏱ Estimated time: ~{serviceItem.estimatedTimeMinutes} minutes
        </p>
      )}

      {serviceItem.priceCents !== null && serviceItem.priceCents > 0 && (
        <p className="text-sm font-medium">
          💰 Price: {(serviceItem.priceCents / 100).toFixed(2)} {serviceItem.currency}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending request…" : "Submit Request"}
      </Button>
    </form>
  );
}
