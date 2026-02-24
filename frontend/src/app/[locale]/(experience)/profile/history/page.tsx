"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Leaf } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";

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

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function resolveDownloadUrl(downloadUrl: string | null) {
  if (!downloadUrl) return null;
  return downloadUrl.startsWith("/uploads/")
    ? `${apiBaseUrl}${downloadUrl}`
    : downloadUrl;
}

export default function HistoryPage() {
  const locale = useLocale();
  const router = useRouter();

  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(
    null
  );
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.profile;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  useEffect(() => {
    if (!session || !page) return;
    fetch(new URL("/api/v1/invoices", apiBaseUrl).toString(), {
      headers: { Authorization: `Bearer ${session.guestToken}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { items?: Invoice[] };
          setInvoices(Array.isArray(data.items) ? data.items : []);
        } else {
          setError(page.errors.loadInvoices);
        }
      })
      .catch(() => setError(page.errors.backendUnreachable));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.guestToken, page?.title]);

  if (!page) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Topbar */}
      <div className="pointer-events-none sticky top-0 z-20">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-2.5 pr-4"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0.75) 25%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0) 100%)",
            backgroundSize: "100% 90px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg p-2"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <Leaf className="h-8 w-8 text-black/70" />
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pr-12 pt-12">
        <h1 className="text-[24px] font-light leading-[1.15] tracking-[-0.24px] text-black/75">
          {page.billing.title}
        </h1>
      </div>

      {/* Invoice List */}
      <div className="px-4 pt-8">
        {error && (
          <p className="text-sm text-[#b70926]">{error}</p>
        )}

        {!error && invoices.length === 0 && (
          <p className="text-[15px] text-black/50">{page.billing.empty}</p>
        )}

        {invoices.length > 0 && (
          <div className="rounded-[6px] border border-black/[0.06] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            {invoices.map((invoice, idx) => {
              const href = resolveDownloadUrl(invoice.downloadUrl);
              return (
                <div key={invoice.id}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-[16px] leading-[1.15] text-black">
                          {invoice.title}
                        </p>
                        <p className="text-[16px] leading-[1.15] text-black/50">
                          {invoice.department ?? ""}
                        </p>
                      </div>
                      <p className="text-[16px] leading-[1.15] text-black/50">
                        {formatDate(invoice.issuedAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch">
                      <div className="space-y-1 text-right">
                        <p
                          className="text-[22px] font-light leading-[1.15] text-black"
                          style={{
                            fontFeatureSettings: "'lnum', 'pnum'",
                          }}
                        >
                          {formatMoney(
                            invoice.amountCents,
                            invoice.currency
                          )}
                        </p>
                        <p
                          className="text-[17px] leading-[1.15] text-black/50"
                          style={{
                            fontFeatureSettings: "'lnum', 'pnum'",
                          }}
                        >
                          {interpolateTemplate(
                            page.billing.pointsTemplate,
                            { points: invoice.pointsEarned }
                          )}
                        </p>
                      </div>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-6 w-6 items-center justify-center text-black/50"
                          aria-label={page.invoiceDownloadAria}
                        >
                          <Download className="h-6 w-6" />
                        </a>
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center text-black/20">
                          <Download className="h-6 w-6" />
                        </span>
                      )}
                    </div>
                  </div>

                  {idx < invoices.length - 1 && (
                    <div className="py-6">
                      <div className="h-[2px] rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
