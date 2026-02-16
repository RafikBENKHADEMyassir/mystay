"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { LabeledField } from "@/components/auth";
import { AppButton } from "@/components/ui/app-link";
import { ALL_COUNTRIES, getCountryByIso, type PhoneCountry } from "@/lib/phone-countries";
import { cn } from "@/lib/utils";
import type { SignupFormState, SignupStrings } from "../_lib/types";
import type { SignupErrors } from "../_lib/validation";

type ProfileStepProps = {
  form: SignupFormState;
  updateForm: (patch: Partial<SignupFormState>) => void;
  errors: SignupErrors;
  strings: SignupStrings;
  onContinue: () => void;
};

export function ProfileStep({ form, updateForm, errors, strings, onContinue }: ProfileStepProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(
    () => getCountryByIso(form.phoneCountry) ?? ALL_COUNTRIES.find((c) => c.iso === "FR"),
    [form.phoneCountry]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES;
    const q = search.toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        `+${c.callingCode}`.includes(q)
    );
  }, [search]);

  const selectCountry = useCallback(
    (country: PhoneCountry) => {
      updateForm({ phoneCountry: country.iso });
      setOpen(false);
      setSearch("");
    },
    [updateForm]
  );

  const toggleDropdown = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        // Focus search input after dropdown opens
        setTimeout(() => searchRef.current?.focus(), 0);
      } else {
        setSearch("");
      }
      return next;
    });
  }, []);

  // Close dropdown when clicking outside
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // If the new focus target is still inside the dropdown, do nothing
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
    setSearch("");
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold text-foreground">{strings.profileTitle}</h1>

      <section className="space-y-3 rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
        <p className="text-sm font-semibold text-foreground">{strings.profileCardTitle}</p>

        <LabeledField
          label={strings.firstNameLabel}
          value={form.firstName}
          onChange={(v) => updateForm({ firstName: v })}
          error={errors.firstName}
        />
        <LabeledField
          label={strings.lastNameLabel}
          value={form.lastName}
          onChange={(v) => updateForm({ lastName: v })}
          error={errors.lastName}
        />
        <LabeledField
          label={strings.emailLabel}
          value={form.email}
          onChange={(v) => updateForm({ email: v })}
          placeholder={strings.emailPlaceholder}
          type="email"
          error={errors.email}
        />

        {/* Phone number with country picker */}
        <div className="space-y-1">
          <div className="grid grid-cols-[120px,1fr] gap-3">
            {/* Country selector */}
            <div className="relative" ref={dropdownRef} onBlur={handleBlur}>
              <button
                type="button"
                onClick={toggleDropdown}
                className={cn(
                  "flex h-[60px] w-full items-center gap-1.5 rounded-xl bg-muted/30 px-3 ring-1 ring-border transition-all",
                  "text-sm font-medium text-foreground",
                  open && "ring-2 ring-primary"
                )}
              >
                <span className="text-lg leading-none">{selectedCountry?.flag}</span>
                <span className="truncate">+{selectedCountry?.callingCode}</span>
                <ChevronDown
                  className={cn(
                    "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>

              {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[300px] overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  {/* Search */}
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search country..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* Country list */}
                  <div className="max-h-[240px] overflow-y-auto overscroll-contain">
                    {filtered.length === 0 && (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No countries found
                      </p>
                    )}
                    {filtered.map((country) => (
                      <button
                        key={country.iso}
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent blur from firing before click
                          e.preventDefault();
                          selectCountry(country);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40",
                          country.iso === form.phoneCountry && "bg-muted/30 font-medium"
                        )}
                      >
                        <span className="text-lg leading-none">{country.flag}</span>
                        <span className="flex-1 truncate">{country.name}</span>
                        <span className="shrink-0 text-muted-foreground">+{country.callingCode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phone number input */}
            <LabeledField
              label={strings.phoneLabel}
              value={form.phoneNumber}
              onChange={(v) => updateForm({ phoneNumber: v })}
              placeholder={strings.phonePlaceholder}
              type="tel"
              error={errors.phone}
            />
          </div>
        </div>
      </section>

      <AppButton variant="primary" onClick={onContinue} className="mt-4">
        {strings.continueAction}
      </AppButton>
    </>
  );
}
