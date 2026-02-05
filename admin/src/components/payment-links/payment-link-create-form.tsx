"use client";

import { useEffect, useMemo, useState } from "react";

import { ReservationPicker, type ReservationOption } from "@/components/payment-links/reservation-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";

type PaymentLinkCreateFormProps = {
  action: (formData: FormData) => void;
  initialReservation?: ReservationOption | null;
};

const reasonOptions = [
  { value: "deposit", label: "Deposit" },
  { value: "food_beverage", label: "Food & Beverages" },
  { value: "spa", label: "SPA" },
  { value: "minibar", label: "Minibar" },
  { value: "other", label: "Other" }
] as const;

type ReasonCategory = (typeof reasonOptions)[number]["value"];

export function PaymentLinkCreateForm({ action, initialReservation }: PaymentLinkCreateFormProps) {
  const [payerType, setPayerType] = useState<"guest" | "visitor">("guest");
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>(reasonOptions[0].value);

  useEffect(() => {
    if (initialReservation) setPayerType("guest");
  }, [initialReservation]);

  const reasonPlaceholder = useMemo(() => {
    const match = reasonOptions.find((opt) => opt.value === reasonCategory);
    return match?.label ?? "Reason";
  }, [reasonCategory]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pl-type">Type</Label>
          <select
            id="pl-type"
            name="payerType"
            className={nativeSelectClassName}
            value={payerType}
            onChange={(event) => setPayerType(event.target.value === "visitor" ? "visitor" : "guest")}
          >
            <option value="guest">Guest</option>
            <option value="visitor">Visitor</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pl-currency">Currency</Label>
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
            <Label htmlFor="pl-visitor-name">Name</Label>
            <Input id="pl-visitor-name" name="payerName" placeholder="Visitor name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-visitor-email">Email</Label>
            <Input id="pl-visitor-email" name="payerEmail" placeholder="Visitor email" type="email" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pl-visitor-phone">Phone</Label>
            <Input id="pl-visitor-phone" name="payerPhone" placeholder="Optional phone" />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pl-amount">Amount</Label>
          <Input id="pl-amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pl-reason-category">Reason</Label>
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
        <Label htmlFor="pl-reason-text">Reason text</Label>
        <Input id="pl-reason-text" name="reasonText" placeholder={reasonPlaceholder} />
      </div>

      <Button type="submit" className="w-full">
        Create payment link
      </Button>
    </form>
  );
}
