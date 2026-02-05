import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentLinkPublic = {
  id: string;
  hotel: { id: string; name: string };
  amountCents: number;
  currency: string;
  reasonText: string | null;
  paymentStatus: string;
  expiresAt: string | null;
  createdAt: string;
};

type PayPageProps = {
  params: { token: string };
  searchParams?: { paid?: string; error?: string };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

async function getPaymentLink(token: string): Promise<PaymentLinkPublic | null> {
  const response = await fetch(new URL(`/api/v1/public/payment-links/${encodeURIComponent(token)}`, apiBaseUrl), {
    cache: "no-store"
  });
  if (!response.ok) return null;
  return (await response.json()) as PaymentLinkPublic;
}

export default async function PayPage({ params, searchParams }: PayPageProps) {
  const token = params.token;
  const paymentLink = await getPaymentLink(token);

  async function pay() {
    "use server";

    const response = await fetch(new URL(`/api/v1/public/payment-links/${encodeURIComponent(token)}/pay`, apiBaseUrl), {
      method: "POST",
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const code = typeof payload?.error === "string" ? payload.error : `pay_failed_${response.status}`;
      redirect(`/pay/${encodeURIComponent(token)}?error=${encodeURIComponent(code)}`);
    }

    redirect(`/pay/${encodeURIComponent(token)}?paid=1`);
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Payment link not available</CardTitle>
              <CardDescription>It may have expired or been removed.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const status = paymentLink.paymentStatus.trim().toLowerCase();
  const isPaid = status === "paid";
  const isExpired = status === "expired";
  const canPay = !isPaid && !isExpired;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader className="space-y-2">
            <p className="text-sm text-muted-foreground">{paymentLink.hotel.name}</p>
            <CardTitle>Complete payment</CardTitle>
            <CardDescription>
              {paymentLink.reasonText ? paymentLink.reasonText : "Payment request"} •{" "}
              <span className="font-mono">{formatMoney(paymentLink.amountCents, paymentLink.currency)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchParams?.paid === "1" ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Payment completed.
              </p>
            ) : null}
            {searchParams?.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Error: {searchParams.error}
              </p>
            ) : null}
            {isPaid ? (
              <p className="text-sm text-muted-foreground">Status: Paid</p>
            ) : isExpired ? (
              <p className="text-sm text-muted-foreground">Status: Expired</p>
            ) : (
              <p className="text-sm text-muted-foreground">Status: Created</p>
            )}

            <form action={pay}>
              <Button type="submit" className="w-full" disabled={!canPay}>
                {isPaid ? "Already paid" : isExpired ? "Expired" : "Pay now"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

