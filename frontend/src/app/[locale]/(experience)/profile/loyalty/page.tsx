"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Leaf } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";

type Invoice = {
  id: string;
  pointsEarned: number;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const GOLD_THRESHOLD = 100;

const rewardCards = [
  {
    id: "flowers",
    title: "FLEURS",
    discount: "-15 %",
    image: "/images/profile/loyalty/flowers.png",
  },
  {
    id: "champagne",
    title: "CHAMPAGNE",
    discount: "-15 %",
    image: "/images/profile/loyalty/champagne.png",
  },
  {
    id: "letter",
    title: "LETTRE",
    discount: "-15 %",
    image: "/images/profile/loyalty/letter.png",
  },
  {
    id: "magazine",
    title: "MAGAZINE",
    discount: "-15 %",
    image: "/images/profile/loyalty/magazine.png",
  },
  {
    id: "upsells",
    title: "VOS UPSELLS",
    discount: "-15 %",
    image: "/images/profile/loyalty/upsells.png",
  },
];

export default function LoyaltyPage() {
  const locale = useLocale();
  const router = useRouter();

  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(
    null
  );
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.profile;

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  useEffect(() => {
    if (!session) return;
    fetch(new URL("/api/v1/invoices", apiBaseUrl).toString(), {
      headers: { Authorization: `Bearer ${session.guestToken}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { items?: Invoice[] };
          setInvoices(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch(() => {});
  }, [session?.guestToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPoints = useMemo(
    () =>
      invoices.reduce(
        (sum, inv) => sum + (Number(inv.pointsEarned) || 0),
        0
      ),
    [invoices]
  );

  const pointsToGold = Math.max(0, GOLD_THRESHOLD - totalPoints);
  const progressPct = Math.min(
    Math.max((totalPoints / GOLD_THRESHOLD) * 100, 1),
    100
  );

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
            className="flex items-center gap-3 rounded-lg p-2"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
            <span className="text-[20px] tracking-[-0.2px] text-black">
              {page.loyalty.title}
            </span>
          </button>
          <Leaf className="h-8 w-8 text-black/70" />
        </div>
      </div>

      {/* Points Display */}
      <div className="px-4 pt-12">
        <p
          className="text-[36px] font-light leading-[1.1] text-black"
          style={{ fontFeatureSettings: "'lnum', 'pnum'" }}
        >
          {totalPoints}
        </p>
        <p className="mt-1.5 text-[15px] leading-[1.1] text-black/50">
          {page.loyalty.pointsLabel}
        </p>
      </div>

      {/* Tier Progress */}
      <div className="space-y-1.5 px-4 py-6">
        <div className="flex items-center gap-2">
          <span
            className="rounded-[3px] border border-[#999] px-1 py-px text-[13px] text-[#787878] shadow-[0_0_6px_rgba(153,153,153,0.3)]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2)), linear-gradient(90deg, rgba(153,153,153,0.3), rgba(153,153,153,0.3))",
            }}
          >
            {page.loyalty.silverTier}
          </span>

          <div className="flex-1 rounded-2xl bg-[#f5f5f5]">
            <div className="h-1">
              <div
                className="h-full rounded-2xl bg-gradient-to-r from-[rgba(153,153,153,0.3)] to-[#999]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <span
            className="rounded-[3px] border border-[#cd9113] px-1 py-px text-[13px] text-[#cd9113] shadow-[0_0_6px_rgba(205,145,19,0.3)]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2)), linear-gradient(90deg, rgba(205,145,19,0.3), rgba(205,145,19,0.3))",
            }}
          >
            {page.loyalty.goldTier}
          </span>
        </div>
        <p className="text-right text-[13px] leading-[1.1] text-black/50">
          {interpolateTemplate(page.loyalty.progressTemplate, {
            points: pointsToGold,
          })}
        </p>
      </div>

      {/* Discounts Carousel */}
      <div className="pt-6">
        <h2 className="px-4 text-[22px] font-medium leading-[1.15] text-black">
          {page.loyalty.discountsTitle}
        </h2>

        <div className="mt-4 flex gap-1 overflow-x-auto px-4 pb-4 scrollbar-hide">
          {rewardCards.map((card) => (
            <div
              key={card.id}
              className="relative flex h-[215px] w-[170px] flex-none flex-col items-start justify-end overflow-hidden rounded-[6px] border border-black/10"
            >
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover"
                sizes="170px"
                unoptimized
              />
              <div
                className="absolute inset-x-0 bottom-0 top-[32%]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.098) 20%, rgba(0,0,0,0.325) 50%, rgba(0,0,0,0.584) 100%)",
                }}
              />
              <div className="relative z-10 flex flex-col gap-2 p-3 pb-4">
                <span
                  className="self-start rounded-[3px] border border-[#cd9113] px-1 py-px text-[13px] text-[#ebd3a0] shadow-[0_0_6px_rgba(205,145,19,0.3)] backdrop-blur-[6px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05)), linear-gradient(90deg, rgba(205,145,19,0.35), rgba(205,145,19,0.35))",
                  }}
                >
                  {card.discount}
                </span>
                <span className="text-[23px] uppercase leading-[1.25] text-white">
                  {card.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
