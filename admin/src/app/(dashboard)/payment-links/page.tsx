import Link from "next/link";
import { redirect } from "next/navigation";

import { CopyButton } from "@/components/copy-button";
import { PaymentLinkCreateForm } from "@/components/payment-links/payment-link-create-form";
import { PaymentLinksFilters } from "@/components/payment-links/payment-links-filters";
import type { ReservationOption } from "@/components/payment-links/reservation-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireStaffToken } from "@/lib/staff-auth";

type PaymentLinkListItem = {
  id: string;
  hotelId: string;
  stayId: string | null;
  guestId: string | null;
  payerType: "guest" | "visitor";
  payerName: string;
  payerEmail: string | null;
  payerPhone: string | null;
  amountCents: number;
  currency: string;
  reasonCategory: string | null;
  reasonText: string | null;
  pmsStatus: string;
  paymentStatus: string;
  publicUrl: string;
  confirmationNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

type PaymentLinksResponse = {
  items: PaymentLinkListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type PaymentLinkDetail = {
  id: string;
  hotelId: string;
  payer: { type: string; name: string | null; email: string | null; phone: string | null };
  guest: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  stay: { id: string; confirmationNumber: string | null; roomNumber: string | null } | null;
  amountCents: number;
  currency: string;
  reasonCategory: string | null;
  reasonText: string | null;
  pmsStatus: string;
  paymentStatus: string;
  publicToken: string;
  publicUrl: string;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReservationDetail = {
  id: string;
  guest: { id: string; name: string | null } | null;
  stay: { id: string; confirmationNumber: string; roomNumber: string | null; checkIn: string; checkOut: string; status: string; journeyStatus: string | null };
};

type PaymentLinksPageProps = {
  searchParams?: {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
    page?: string;
    paymentLinkId?: string;
    new?: string;
    stayId?: string;
    saved?: string;
    queued?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function buildSearchParams(current: PaymentLinksPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(current ?? {})) {
    if (typeof value !== "string" || !value.trim()) continue;
    next.set(key, value);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, value);
  }

  return next;
}

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function badgeForPaymentStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid") return { label: "Paid", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (normalized === "failed") return { label: "Failed", className: "border-destructive/30 bg-destructive/10 text-destructive" };
  if (normalized === "expired") return { label: "Expired", className: "border-amber-200 bg-amber-50 text-amber-800" };
  return { label: "Created", className: "border-violet-200 bg-violet-50 text-violet-800" };
}

function badgeForPmsStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "posted") return { label: "Posted", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (normalized === "configured") return { label: "Configured", className: "border-blue-200 bg-blue-50 text-blue-800" };
  if (normalized === "failed_to_post") return { label: "Failed to post", className: "border-destructive/30 bg-destructive/10 text-destructive" };
  return { label: "Not configured", className: "border-muted/40 bg-muted/20 text-muted-foreground" };
}

async function getPaymentLinks(token: string, query: URLSearchParams): Promise<PaymentLinksResponse> {
  const qs = query.toString();
  const response = await fetch(qs ? `${backendUrl}/api/v1/staff/payment-links?${qs}` : `${backendUrl}/api/v1/staff/payment-links`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as PaymentLinksResponse;
}

async function getPaymentLink(token: string, id: string): Promise<PaymentLinkDetail | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/payment-links/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as PaymentLinkDetail;
}

async function getReservation(token: string, stayId: string): Promise<ReservationOption | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/reservations/${encodeURIComponent(stayId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as ReservationDetail;
  return {
    id: payload.stay.id,
    guestId: payload.guest?.id ?? null,
    confirmationNumber: payload.stay.confirmationNumber,
    guestName: payload.guest?.name ?? "Unlinked guest",
    roomNumber: payload.stay.roomNumber ?? null,
    arrivalDate: payload.stay.checkIn,
    departureDate: payload.stay.checkOut,
    status: payload.stay.status,
    journeyStatus: payload.stay.journeyStatus ?? null
  };
}

export default async function PaymentLinksPage({ searchParams }: PaymentLinksPageProps) {
  const token = requireStaffToken();
  const paymentLinkId = (searchParams?.paymentLinkId ?? "").trim();
  const wantsNew = (searchParams?.new ?? "").trim() === "1";
  const prefillStayId = (searchParams?.stayId ?? "").trim();

  const query = buildSearchParams(searchParams, {
    pageSize: "25",
    paymentLinkId: null,
    new: null,
    stayId: null,
    saved: null,
    queued: null,
    error: null
  });

  let data: PaymentLinksResponse | null = null;
  let detail: PaymentLinkDetail | null = null;
  let initialReservation: ReservationOption | null = null;
  let error: string | null = null;

  try {
    data = await getPaymentLinks(token, query);
    if (paymentLinkId) detail = await getPaymentLink(token, paymentLinkId);
    if (wantsNew && prefillStayId) initialReservation = await getReservation(token, prefillStayId);
  } catch {
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const items = data?.items ?? [];
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const statuses = ["created", "paid", "failed", "expired"];

  const openDetailHref = (id: string) => {
    const next = buildSearchParams(searchParams, { paymentLinkId: id, new: null, stayId: null });
    return `/payment-links?${next.toString()}`;
  };

  const openNewHref = (() => {
    const next = buildSearchParams(searchParams, { new: "1", paymentLinkId: null, stayId: prefillStayId || null });
    return `/payment-links?${next.toString()}`;
  })();

  const closeDrawerHref = (() => {
    const next = buildSearchParams(searchParams, { paymentLinkId: null, new: null, stayId: null });
    const value = next.toString();
    return value ? `/payment-links?${value}` : "/payment-links";
  })();

  async function createPaymentLink(formData: FormData) {
    "use server";

    const token = requireStaffToken();

    const payerType = String(formData.get("payerType") ?? "guest").trim();
    const stayId = String(formData.get("stayId") ?? "").trim();
    const guestId = String(formData.get("guestId") ?? "").trim();
    const payerName = String(formData.get("payerName") ?? "").trim();
    const payerEmail = String(formData.get("payerEmail") ?? "").trim();
    const payerPhone = String(formData.get("payerPhone") ?? "").trim();

    const amountRaw = String(formData.get("amount") ?? "").trim();
    const amountNumber = Number(amountRaw);
    const amountCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : NaN;

    const currency = String(formData.get("currency") ?? "").trim().toUpperCase();
    const reasonCategory = String(formData.get("reasonCategory") ?? "").trim();
    const reasonText = String(formData.get("reasonText") ?? "").trim();

    const response = await fetch(`${backendUrl}/api/v1/staff/payment-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        payerType,
        stayId: stayId || null,
        guestId: guestId || null,
        payerName: payerName || null,
        payerEmail: payerEmail || null,
        payerPhone: payerPhone || null,
        amountCents,
        currency: currency || null,
        reasonCategory: reasonCategory || null,
        reasonText: reasonText || null
      }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, new: "1" });
      redirect(`/payment-links?${next.toString()}`);
    }

    const id = typeof payload?.id === "string" ? payload.id : "";
    if (!id) redirect("/payment-links?error=invalid_payment_link");

    const next = buildSearchParams(searchParams, { paymentLinkId: id, new: null, stayId: null, saved: "1", error: null });
    redirect(`/payment-links?${next.toString()}`);
  }

  async function sendPaymentLinkEmail(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const id = String(formData.get("paymentLinkId") ?? "").trim();
    if (!id) redirect("/payment-links");

    const response = await fetch(`${backendUrl}/api/v1/staff/payment-links/${encodeURIComponent(id)}/send-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { paymentLinkId: id, error: errorCode });
      redirect(`/payment-links?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { paymentLinkId: id, queued: "1", error: null });
    redirect(`/payment-links?${next.toString()}`);
  }

  async function sendPaymentLinkMessage(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const id = String(formData.get("paymentLinkId") ?? "").trim();
    if (!id) redirect("/payment-links");

    const response = await fetch(`${backendUrl}/api/v1/staff/payment-links/${encodeURIComponent(id)}/send-message`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { paymentLinkId: id, error: errorCode });
      redirect(`/payment-links?${next.toString()}`);
    }

    const threadId = typeof payload?.threadId === "string" ? payload.threadId : "";
    if (!threadId) redirect(`/payment-links?paymentLinkId=${encodeURIComponent(id)}&error=missing_thread`);
    redirect(`/messages/${encodeURIComponent(threadId)}?sent=1`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Pay by Link</h1>
          <p className="text-sm text-muted-foreground">Create and track payment links shared with guests.</p>
        </div>
        <Button asChild>
          <Link href={openNewHref}>+ New payment link</Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Date window, search, and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PaymentLinksFilters statuses={statuses} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Payment links</CardTitle>
            <CardDescription>Sorted by newest first.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/payment-links?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>
                Previous
              </Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/payment-links?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}>
                Next
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[110px,1.2fr,90px,120px,1.2fr,120px,120px] gap-0 border-t text-sm">
            <div className="px-4 py-3 font-semibold text-muted-foreground">Created</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">Name</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">Type</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">Amount</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">Reason</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">PMS status</div>
            <div className="px-4 py-3 font-semibold text-muted-foreground">Status</div>
          </div>

          <div className="divide-y">
            {items.map((linkItem) => {
              const paymentBadge = badgeForPaymentStatus(linkItem.paymentStatus);
              const pmsBadge = badgeForPmsStatus(linkItem.pmsStatus);

              return (
                <Link
                  key={linkItem.id}
                  href={openDetailHref(linkItem.id)}
                  className="grid grid-cols-[110px,1.2fr,90px,120px,1.2fr,120px,120px] items-center gap-0 px-0 py-3 hover:bg-accent/20"
                >
                  <div className="px-4 text-xs text-muted-foreground">{new Date(linkItem.createdAt).toLocaleDateString()}</div>
                  <div className="px-4">
                    <p className="truncate font-semibold">{linkItem.payerName}</p>
                    <p className="truncate text-xs text-muted-foreground font-mono">
                      {linkItem.confirmationNumber ? linkItem.confirmationNumber : linkItem.id}
                    </p>
                  </div>
                  <div className="px-4 capitalize">{linkItem.payerType}</div>
                  <div className="px-4 font-mono">{formatMoney(linkItem.amountCents, linkItem.currency)}</div>
                  <div className="px-4 truncate">{linkItem.reasonText ?? "—"}</div>
                  <div className="px-4">
                    <Badge variant="outline" className={pmsBadge.className}>
                      {pmsBadge.label}
                    </Badge>
                  </div>
                  <div className="px-4">
                    <Badge variant="outline" className={paymentBadge.className}>
                      {paymentBadge.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}

            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No payment links found.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {wantsNew || paymentLinkId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label="Close" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">Pay by Link</p>
                <h2 className="truncate text-lg font-semibold">{wantsNew ? "New payment link" : "Payment link"}</h2>
                {!wantsNew && detail ? <p className="text-xs text-muted-foreground font-mono">{detail.id}</p> : null}
              </div>
              <Button variant="outline" asChild>
                <Link href={closeDrawerHref}>Close</Link>
              </Button>
            </div>

            <div className="space-y-6 p-6">
              {searchParams?.error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {searchParams.error}
                </p>
              ) : null}

              {wantsNew ? (
                <PaymentLinkCreateForm action={createPaymentLink} initialReservation={initialReservation} />
              ) : detail ? (
                <>
                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Details</CardTitle>
                      <CardDescription>Payer, amount, and status.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Payer</p>
                        <p className="text-sm">{detail.payer.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{detail.payer.email ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Amount</p>
                        <p className="text-sm font-mono">{formatMoney(detail.amountCents, detail.currency)}</p>
                        <p className="text-xs text-muted-foreground">{detail.reasonText ?? detail.reasonCategory ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">PMS status</p>
                        <Badge variant="outline" className={badgeForPmsStatus(detail.pmsStatus).className}>
                          {badgeForPmsStatus(detail.pmsStatus).label}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Payment status</p>
                        <Badge variant="outline" className={badgeForPaymentStatus(detail.paymentStatus).className}>
                          {badgeForPaymentStatus(detail.paymentStatus).label}
                        </Badge>
                      </div>
                      {detail.stay ? (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold text-muted-foreground">Reservation</p>
                          <p className="text-sm font-mono">
                            {detail.stay.confirmationNumber ?? detail.stay.id}
                            {detail.stay.roomNumber ? ` · Room ${detail.stay.roomNumber}` : ""}
                          </p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-base">Payment URL</CardTitle>
                      <CardDescription>Copy or open the secure link.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input readOnly value={detail.publicUrl} className="font-mono" />
                      <div className="flex flex-wrap items-center gap-2">
                        <CopyButton value={detail.publicUrl} variant="secondary">
                          Copy link
                        </CopyButton>
                        <Button asChild variant="outline">
                          <a href={detail.publicUrl} target="_blank" rel="noreferrer">
                            Open link
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={sendPaymentLinkEmail}>
                      <input type="hidden" name="paymentLinkId" value={detail.id} />
                      <Button type="submit" variant="outline">
                        Send via email
                      </Button>
                    </form>
                    <form action={sendPaymentLinkMessage}>
                      <input type="hidden" name="paymentLinkId" value={detail.id} />
                      <Button type="submit" disabled={!detail.stay}>
                        Send via message
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment link not available</CardTitle>
                    <CardDescription>It may have been removed or you do not have access.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

