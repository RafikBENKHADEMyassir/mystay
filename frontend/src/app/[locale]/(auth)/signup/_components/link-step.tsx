"use client";

import { LabeledField } from "@/components/auth";
import type { SignupFormState, SignupStrings } from "../_lib/types";
import type { SignupErrors } from "../_lib/validation";

type LinkStepProps = {
  form: SignupFormState;
  updateForm: (patch: Partial<SignupFormState>) => void;
  errors: SignupErrors;
  strings: SignupStrings;
  isLoading: boolean;
  onLink: () => void;
};

export function LinkStep({ form, updateForm, errors, strings, isLoading, onLink }: LinkStepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-foreground">{strings.linkTitle}</h1>
      <p className="text-sm text-muted-foreground">{strings.linkSubtitle}</p>

      <section className="space-y-3 rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
        <p className="text-sm font-semibold text-foreground">{strings.confirmationLabel}</p>
        <LabeledField
          label={strings.confirmationLabel}
          value={form.confirmationNumber}
          onChange={(v) => updateForm({ confirmationNumber: v })}
          placeholder={strings.confirmationPlaceholder}
          error={errors.confirmation}
        />
      </section>

      <p className="whitespace-pre-line text-xs text-muted-foreground">
        {strings.linkHint}{" "}
        <a href="mailto:support@mystay.com" className="font-semibold text-foreground underline">
          {strings.contactSupport}
        </a>
      </p>

      <button
        type="button"
        onClick={onLink}
        disabled={isLoading}
        className="mt-2 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm disabled:opacity-50"
      >
        {isLoading ? strings.loadingLabel : strings.confirmAction}
      </button>
    </>
  );
}
