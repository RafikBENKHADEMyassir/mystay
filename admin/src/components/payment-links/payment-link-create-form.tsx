"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { ReservationPicker, type ReservationOption } from "@/components/payment-links/reservation-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";

type PaymentLinkCreateFormProps = {
  action: (formData: FormData) => void;
  initialReservation?: ReservationOption | null;
};

const reasonCategories = ["deposit", "food_beverage", "spa", "minibar", "other"] as const;

type ReasonCategory = (typeof reasonCategories)[number];

const paymentLinkCreateFormCopy = {
  en: {
    type: "Type",
    guest: "Guest",
    visitor: "Visitor",
    currency: "Currency",
    name: "Name",
    visitorNamePlaceholder: "Visitor name",
    email: "Email",
    visitorEmailPlaceholder: "Visitor email",
    phone: "Phone",
    optionalPhonePlaceholder: "Optional phone",
    amount: "Amount",
    reason: "Reason",
    reasonText: "Reason text",
    reasonPlaceholderFallback: "Reason",
    submit: "Create payment link",
    reasonOptions: {
      deposit: "Deposit",
      food_beverage: "Food & Beverages",
      spa: "SPA",
      minibar: "Minibar",
      other: "Other",
    },
  },
  fr: {
    type: "Type",
    guest: "Client",
    visitor: "Visiteur",
    currency: "Devise",
    name: "Nom",
    visitorNamePlaceholder: "Nom du visiteur",
    email: "Email",
    visitorEmailPlaceholder: "Email du visiteur",
    phone: "Telephone",
    optionalPhonePlaceholder: "Telephone optionnel",
    amount: "Montant",
    reason: "Motif",
    reasonText: "Texte du motif",
    reasonPlaceholderFallback: "Motif",
    submit: "Creer lien de paiement",
    reasonOptions: {
      deposit: "Acompte",
      food_beverage: "Restauration",
      spa: "SPA",
      minibar: "Minibar",
      other: "Autre",
    },
  },
  es: {
    type: "Tipo",
    guest: "Huesped",
    visitor: "Visitante",
    currency: "Moneda",
    name: "Nombre",
    visitorNamePlaceholder: "Nombre del visitante",
    email: "Correo",
    visitorEmailPlaceholder: "Correo del visitante",
    phone: "Telefono",
    optionalPhonePlaceholder: "Telefono opcional",
    amount: "Importe",
    reason: "Motivo",
    reasonText: "Texto del motivo",
    reasonPlaceholderFallback: "Motivo",
    submit: "Crear enlace de pago",
    reasonOptions: {
      deposit: "Deposito",
      food_beverage: "Comida y bebidas",
      spa: "SPA",
      minibar: "Minibar",
      other: "Otro",
    },
  },
} as const;

export function PaymentLinkCreateForm({ action, initialReservation }: PaymentLinkCreateFormProps) {
  const pathname = usePathname() ?? "/payment-links";
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = paymentLinkCreateFormCopy[locale];

  const [payerType, setPayerType] = useState<"guest" | "visitor">("guest");
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>(reasonCategories[0]);

  const reasonOptions = useMemo(
    () => reasonCategories.map((value) => ({ value, label: t.reasonOptions[value] })),
    [t.reasonOptions]
  );

  useEffect(() => {
    if (initialReservation) setPayerType("guest");
  }, [initialReservation]);

  const reasonPlaceholder = useMemo(() => {
    const match = reasonOptions.find((opt) => opt.value === reasonCategory);
    return match?.label ?? t.reasonPlaceholderFallback;
  }, [reasonCategory, reasonOptions, t.reasonPlaceholderFallback]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pl-type">{t.type}</Label>
          <select
            id="pl-type"
            name="payerType"
            className={nativeSelectClassName}
            value={payerType}
            onChange={(event) => setPayerType(event.target.value === "visitor" ? "visitor" : "guest")}
          >
            <option value="guest">{t.guest}</option>
            <option value="visitor">{t.visitor}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pl-currency">{t.currency}</Label>
          <select id="pl-currency" name="currency" className={nativeSelectClassName} defaultValue="EUR">
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
            <option value="MAD">MAD</option>
          </select>
        </div>
      </div>

      {payerType === "guest" ? (
        <ReservationPicker initialReservation={initialReservation} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pl-visitor-name">{t.name}</Label>
            <Input id="pl-visitor-name" name="payerName" placeholder={t.visitorNamePlaceholder} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-visitor-email">{t.email}</Label>
            <Input id="pl-visitor-email" name="payerEmail" placeholder={t.visitorEmailPlaceholder} type="email" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pl-visitor-phone">{t.phone}</Label>
            <Input id="pl-visitor-phone" name="payerPhone" placeholder={t.optionalPhonePlaceholder} />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pl-amount">{t.amount}</Label>
          <Input id="pl-amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pl-reason-category">{t.reason}</Label>
          <select
            id="pl-reason-category"
            name="reasonCategory"
            className={nativeSelectClassName}
            value={reasonCategory}
            onChange={(event) => setReasonCategory(event.target.value as ReasonCategory)}
          >
            {reasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pl-reason-text">{t.reasonText}</Label>
        <Input id="pl-reason-text" name="reasonText" placeholder={reasonPlaceholder} />
      </div>

      <Button type="submit" className="w-full">
        {t.submit}
      </Button>
    </form>
  );
}
