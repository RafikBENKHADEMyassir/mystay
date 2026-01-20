"use client";

import { useState } from "react";
import { DollarSign, Heart } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { getTipStrings } from "@/lib/i18n/tips";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TipDialogProps = {
  staffName: string;
  staffUserId: string;
  department: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

const presetAmounts = [5, 10, 15, 20, 25];

export function TipDialog({ staffName, staffUserId, department, trigger, onSuccess }: TipDialogProps) {
  const locale = useLocale();
  const t = getTipStrings(locale);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAmount = amount !== null ? amount : customAmount ? parseFloat(customAmount) : null;

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setAmount(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedAmount || selectedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("guestToken")}`
        },
        body: JSON.stringify({
          amount: selectedAmount,
          staffUserId,
          department,
          currency: "usd"
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to process tip");
      }

      // Success
      setOpen(false);
      setAmount(null);
      setCustomAmount("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Heart className="mr-2 h-4 w-4" />
            {t.leaveATip}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.dialogTitle}</DialogTitle>
          <DialogDescription>
            {t.dialogDescription(staffName, department)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preset amounts */}
          <div>
            <Label>{t.selectAmount}</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handlePresetClick(preset)}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <Label htmlFor="custom-amount">{t.customAmount}</Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                className="pl-9"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                min="1"
                step="1"
              />
            </div>
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Selected amount display */}
          {selectedAmount && selectedAmount > 0 && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">{t.tipAmount}</p>
              <p className="text-2xl font-bold">${selectedAmount.toFixed(2)}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAmount || selectedAmount <= 0 || isSubmitting}
          >
            {isSubmitting ? t.processing : t.sendTip}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
