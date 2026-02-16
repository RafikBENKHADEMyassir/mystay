"use client";

import { AppLink } from "@/components/ui/app-link";
import { Bell, CreditCard, Download, IdCard, Languages, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearDemoSession, getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";

type Invoice = {
  id: string;
  title: string;
  department: string | null;
  amountCents: number;
  currency: string;
  pointsEarned: number;
  issuedAt: string;
  downloadUrl: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

export default function ProfilePage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.profile;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPoints = useMemo(
    () => invoices.reduce((sum, invoice) => sum + (Number(invoice.pointsEarned) || 0), 0),
    [invoices]
  );

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  async function loadInvoices(activeSession = session) {
    if (!activeSession || !page) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/v1/invoices", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });
      if (!response.ok) {
        setError(page.errors.loadInvoices);
        return;
      }

      const data = (await response.json()) as { items?: Invoice[] };
      setInvoices(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(page.errors.backendUnreachable);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session || !page) return;
    void loadInvoices(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId, page?.title]);

  async function handleLogout() {
    clearDemoSession();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = withLocale(locale, "/");
  }

  if (!page) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? (
                <Badge variant="outline">
                  {interpolateTemplate(page.roomLabel, { roomNumber: session.roomNumber })}
                </Badge>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => loadInvoices()} disabled={isLoading}>
                {isLoading ? page.refreshing : page.refresh}
              </Button>
              <Button size="sm" asChild>
                <AppLink href={withLocale(locale, "/reception/check-in")}>{page.changeReservation}</AppLink>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <AppLink href={withLocale(locale, "/reception/check-in")}>{page.startCheckIn}</AppLink>
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-primary" />
              <CardTitle>{page.guestIdentityTitle}</CardTitle>
              <Badge variant="secondary">{page.guestIdentityBadge}</Badge>
            </div>
            <CardDescription>{page.guestIdentityDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!session ? <p className="text-sm text-muted-foreground">{page.connectStay}</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">{page.loading}</p> : null}
            {session && !isLoading && invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{page.noInvoices}</p>
            ) : null}

            {session && invoices.length ? (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {interpolateTemplate(page.loyaltyPointsTemplate, { points: totalPoints })}
                  </span>
                </p>
                <ul className="divide-y rounded-lg border bg-card">
                  {invoices.map((invoice) => (
                    <li key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{invoice.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.department ?? session.hotelName} · {invoice.issuedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatMoney(invoice.amountCents, invoice.currency)}</p>
                          <p className="text-xs text-muted-foreground">+{invoice.pointsEarned} pts</p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={!invoice.downloadUrl}
                          aria-label={page.invoiceDownloadAria}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{page.payments.title}</CardTitle>
            <CardDescription>{page.payments.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <CreditCard className="h-4 w-4" />
              <span>{page.payments.paymentMethodsTitle}</span>
            </div>
            <p>{page.payments.paymentMethodsText}</p>
            <div className="flex items-center gap-2 text-foreground">
              <Bell className="h-4 w-4" />
              <span>{page.payments.alertsTitle}</span>
            </div>
            <p>{page.payments.alertsText}</p>
            <div className="flex items-center gap-2 text-foreground">
              <Languages className="h-4 w-4" />
              <span>{page.payments.localizationTitle}</span>
            </div>
            <p>{page.payments.localizationText}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pb-12 pt-6">
        <Button variant="destructive" onClick={handleLogout} className="w-full max-w-sm gap-2">
          <LogOut className="h-4 w-4" />
          {content?.navigation.logout ?? ""}
        </Button>
      </div>
    </div>
  );
}
