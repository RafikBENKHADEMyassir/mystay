import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
const defaultHotelId = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID ?? "H-FOURSEASONS";

type PayPageContent = {
  notAvailableTitle: string;
  notAvailableDescription: string;
  completePaymentTitle: string;
  paymentRequestFallback: string;
  paymentCompleted: string;
  errorPrefix: string;
  statusPrefix: string;
  statusPaid: string;
  statusExpired: string;
  statusCreated: string;
  actionAlreadyPaid: string;
  actionExpired: string;
  actionPayNow: string;
};

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

function resolveLocaleFromHeaders() {
  const acceptLanguage = headers().get("accept-language")?.toLowerCase() ?? "";
  if (acceptLanguage.startsWith("fr")) return "fr";
  if (acceptLanguage.startsWith("es")) return "es";
  return "en";
}

async function getPayPageContent(hotelId: string, locale: string): Promise<PayPageContent | null> {
  const response = await fetch(
    new URL(`/api/v1/hotels/${encodeURIComponent(hotelId)}/guest-content?locale=${encodeURIComponent(locale)}`, apiBaseUrl),
    { cache: "no-store" }
  );
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { content?: { pages?: { pay?: PayPageContent } } } | null;
  return payload?.content?.pages?.pay ?? null;
}

export default async function PayPage({ params, searchParams }: PayPageProps) {
  const token = params.token;
  const locale = resolveLocaleFromHeaders();
  const paymentLink = await getPaymentLink(token);
  const payContent = await getPayPageContent(paymentLink?.hotel.id ?? defaultHotelId, locale);
  if (!payContent) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-6" />
      </div>
    );
  }

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
              <CardTitle>{payContent.notAvailableTitle}</CardTitle>
              <CardDescription>{payContent.notAvailableDescription}</CardDescription>
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
            <CardTitle>{payContent.completePaymentTitle}</CardTitle>
            <CardDescription>
              {paymentLink.reasonText ? paymentLink.reasonText : payContent.paymentRequestFallback} •{" "}
              <span className="font-mono">{formatMoney(paymentLink.amountCents, paymentLink.currency)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchParams?.paid === "1" ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {payContent.paymentCompleted}
              </p>
            ) : null}
            {searchParams?.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {payContent.errorPrefix}: {searchParams.error}
              </p>
            ) : null}
            {isPaid ? (
              <p className="text-sm text-muted-foreground">{payContent.statusPrefix}: {payContent.statusPaid}</p>
            ) : isExpired ? (
              <p className="text-sm text-muted-foreground">{payContent.statusPrefix}: {payContent.statusExpired}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{payContent.statusPrefix}: {payContent.statusCreated}</p>
            )}

            <form action={pay}>
              <Button type="submit" className="w-full" disabled={!canPay}>
                {isPaid ? payContent.actionAlreadyPaid : isExpired ? payContent.actionExpired : payContent.actionPayNow}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
