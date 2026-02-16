"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LabeledFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
};

export function LabeledField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error
}: LabeledFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value && value.length > 0);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "relative flex h-[60px] flex-col justify-end rounded-xl bg-muted/30 px-4 pb-2.5 ring-1 ring-border transition-all",
          error && "ring-destructive"
        )}
      >
        <p
          className={cn(
            "pointer-events-none absolute left-4 text-muted-foreground transition-all duration-200",
            isActive ? "top-3 text-xs" : "top-1/2 -translate-y-1/2 text-sm"
          )}
        >
          {label}
        </p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isActive ? placeholder : ""}
          type={type}
          className={cn(
            "w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70",
            error && "pr-10"
          )}
        />
        {error ? (
          <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" />
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
