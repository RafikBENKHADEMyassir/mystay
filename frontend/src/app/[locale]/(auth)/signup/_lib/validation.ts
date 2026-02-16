import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import type { SignupFormState, SignupStep, SignupStrings } from "./types";

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate a phone number against its ISO country code using libphonenumber-js.
 * Returns false if the phone is empty (phone is required) or the number is invalid.
 */
export function isPhoneValid(phone: string, countryIso: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false; // phone is required
  try {
    return isValidPhoneNumber(trimmed, countryIso as CountryCode);
  } catch {
    return false;
  }
}

export function passwordRules(password: string) {
  const trimmed = password ?? "";
  return {
    length: trimmed.length >= 8,
    upper: /[A-Z]/.test(trimmed),
    special: /[^A-Za-z0-9]/.test(trimmed)
  };
}

export type PasswordRules = ReturnType<typeof passwordRules>;

export type SignupErrors = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  password: string | null;
  confirmPassword: string | null;
  confirmation: string | null;
};

export function getSignupErrors(
  form: SignupFormState,
  step: SignupStep,
  submitted: boolean,
  rules: PasswordRules,
  strings: SignupStrings
): SignupErrors {
  const emailError =
    submitted && !form.email.trim()
      ? strings.required
      : submitted && !isValidEmail(form.email.trim())
        ? strings.invalidEmail
        : null;

  const phoneError =
    submitted && !form.phoneNumber.trim()
      ? strings.required
      : submitted && !isPhoneValid(form.phoneNumber, form.phoneCountry)
        ? strings.invalidPhone ?? "Invalid phone number"
        : null;

  return {
    firstName: submitted && !form.firstName.trim() ? strings.required : null,
    lastName: submitted && !form.lastName.trim() ? strings.required : null,
    email: emailError,
    phone: phoneError,
    password:
      submitted && step === "password" && (!rules.length || !rules.upper || !rules.special)
        ? strings.passwordTooWeak
        : null,
    confirmPassword:
      submitted && step === "password" && form.password !== form.confirmPassword
        ? strings.passwordMismatch
        : null,
    confirmation:
      submitted && step === "link" && !form.confirmationNumber.trim() ? strings.required : null
  };
}
