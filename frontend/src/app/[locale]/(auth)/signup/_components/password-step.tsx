"use client";

import { LabeledField, RuleItem } from "@/components/auth";
import { AppButton } from "@/components/ui/app-link";
import type { SignupFormState, SignupStrings } from "../_lib/types";
import type { PasswordRules, SignupErrors } from "../_lib/validation";

type PasswordStepProps = {
  form: SignupFormState;
  updateForm: (patch: Partial<SignupFormState>) => void;
  rules: PasswordRules;
  errors: SignupErrors;
  strings: SignupStrings;
  isLoading: boolean;
  onCreateAccount: () => void;
};

export function PasswordStep({
  form,
  updateForm,
  rules,
  errors,
  strings,
  isLoading,
  onCreateAccount
}: PasswordStepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-foreground">{strings.passwordTitle}</h1>

      <section className="space-y-3 rounded-2xl bg-muted/10 p-4 ring-1 ring-border">
        <LabeledField
          label={strings.passwordLabel}
          value={form.password}
          onChange={(v) => updateForm({ password: v })}
          type="password"
          placeholder={strings.passwordPlaceholder}
          error={errors.password}
        />
        <LabeledField
          label={strings.confirmPasswordLabel}
          value={form.confirmPassword}
          onChange={(v) => updateForm({ confirmPassword: v })}
          type="password"
          placeholder={strings.passwordPlaceholder}
          error={errors.confirmPassword}
        />

        <div className="pt-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{strings.passwordRuleTitle}</p>
          <ul className="mt-2 space-y-1">
            <RuleItem ok={rules.length} label={strings.passwordRules.length} />
            <RuleItem ok={rules.upper} label={strings.passwordRules.upper} />
            <RuleItem ok={rules.special} label={strings.passwordRules.special} />
          </ul>
        </div>
      </section>

      <AppButton variant="primary" onClick={onCreateAccount} disabled={isLoading} className="mt-4">
        {isLoading ? strings.loadingLabel : strings.continueAction}
      </AppButton>
    </>
  );
}
