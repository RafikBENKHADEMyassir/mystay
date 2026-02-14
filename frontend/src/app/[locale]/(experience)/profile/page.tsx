"use client";

import Link from "next/link";
import { Bell, CreditCard, Download, IdCard, Languages, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearDemoSession, getDemoSession } from "@/lib/demo-session";
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
    if (!activeSession) return;
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
        setError("Could not load invoices.");
        return;
      }

      const data = (await response.json()) as { items?: Invoice[] };
      setInvoices(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Backend unreachable. Start `npm run dev:backend` then refresh.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadInvoices(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  async function handleLogout() {
    clearDemoSession();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = withLocale(locale, "/");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profile"
        description="Identity, preferences, and stay history synced from the backend DB."
        actions={
          session ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.hotelName}</Badge>
              {session.roomNumber ? <Badge variant="outline">Room {session.roomNumber}</Badge> : null}
              <Button size="sm" variant="outline" onClick={() => loadInvoices()} disabled={isLoading}>
                {isLoading ? "Refreshing…" : "Refresh"}
              </Button>
              <Button size="sm" asChild>
                <Link href={withLocale(locale, "/reception/check-in")}>Change reservation</Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link href={withLocale(locale, "/reception/check-in")}>Start check-in</Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-primary" />
              <CardTitle>Guest identity</CardTitle>
              <Badge variant="secondary">Secure</Badge>
            </div>
            <CardDescription>Documents, signatures, and stay history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!session ? <p className="text-sm text-muted-foreground">Connect a stay to see invoices.</p> : null}
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {session && !isLoading && invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : null}

            {session && invoices.length ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Loyalty points earned: <span className="font-semibold text-foreground">+{totalPoints} pts</span>
                </p>
                <ul className="divide-y rounded-lg border bg-card">
                  {invoices.map((invoice) => (
                    <li key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{invoice.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.department ?? "hotel"} · {invoice.issuedAt}
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
                          aria-label="Download invoice"
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
            <CardTitle>Payments & notifications</CardTitle>
            <CardDescription>Control channels and saved cards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Payment methods</span>
            </div>
            <p>On-file cards with tokenized storage, 3DS where required, and tipping options.</p>
            <div className="flex items-center gap-2 text-foreground">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
            </div>
            <p>Control push, SMS, and email preferences per department.</p>
            <div className="flex items-center gap-2 text-foreground">
              <Languages className="h-4 w-4" />
              <span>Localization</span>
            </div>
            <p>Language and currency toggles so communications stay consistent.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-6 pb-12">
        <Button variant="destructive" onClick={handleLogout} className="w-full max-w-sm gap-2">
            <LogOut className="h-4 w-4" />
            {locale === "fr" ? "Se déconnecter" : "Log out"}
        </Button>
      </div>
    </div>
  );
}
