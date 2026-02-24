"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Leaf, Star } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { interpolateTemplate } from "@/lib/guest-content";
import { withLocale } from "@/lib/i18n/paths";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function RatingPage() {
  const locale = useLocale();
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.profile;

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = getDemoSession();
    if (s) setSession(s);
  }, []);

  async function handleSubmit() {
    if (!session || rating === 0 || submitting) return;
    setSubmitting(true);

    try {
      await fetch(new URL("/api/v1/guest/review", apiBaseUrl).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.guestToken}`,
        },
        body: JSON.stringify({ rating, comment, consent }),
      });
    } catch {
      // Review submission is best-effort
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (!page) {
    return <div className="min-h-screen bg-white" />;
  }

  const strings = page.hub;
  const hotelName = session?.hotelName ?? "";

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-black">{strings.reviewThankYou}</h1>
        <p className="mt-2 text-center text-sm text-black/50">{strings.reviewThankYouSub}</p>
        <button
          type="button"
          onClick={() => router.push(withLocale(locale, "/profile"))}
          className="mt-8 w-full max-w-xs rounded-[6px] bg-black py-3 text-sm font-medium text-white"
        >
          OK
        </button>
      </div>
    );
  }

  const active = hovered || rating;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Topbar */}
      <div className="pointer-events-none sticky top-0 z-20">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-2.5"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0.75) 25%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0) 100%)",
            backgroundSize: "100% 90px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <button
            onClick={() => router.back()}
            className="flex h-9 items-center gap-3 rounded-lg p-2"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <Leaf className="h-8 w-8 text-black/70" />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-3 pt-6">
        {/* Hotel / Stay Card with Stars */}
        <div className="flex flex-col items-center gap-3 rounded-[6px] border border-black/[0.06] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100">
            <div className="flex h-full w-full items-center justify-center">
              <Leaf className="h-8 w-8 text-black/20" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[24px] font-light leading-[1.15] tracking-[-0.24px] text-black/75">
              {interpolateTemplate(strings.reviewTitle, { hotelName })}
            </p>
            {session?.roomNumber ? (
              <p className="text-[15px] leading-[1.35] text-black/50">
                {content?.pages.room?.suiteNameTemplate
                  ? interpolateTemplate(content.pages.room.suiteNameTemplate, { roomNumber: session.roomNumber })
                  : `Room ${session.roomNumber}`}
              </p>
            ) : null}
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    i <= active ? "fill-[#cd9113] text-[#cd9113]" : "text-[#cd9113]/30"
                  }`}
                  strokeWidth={1}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment Card */}
        <div className="flex flex-col gap-4 rounded-[6px] border border-black/[0.06] bg-white px-3 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-2">
            <p className="text-[15px] font-medium text-black">{strings.reviewSubtitle}</p>
            <p className="text-[15px] leading-[1.35] text-black/50">{strings.reviewPlaceholder}</p>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Votre message"
            className="h-[140px] w-full resize-none rounded-[8px] bg-[#f5f5f5] p-4 text-[16px] leading-[1.15] text-black outline-none placeholder:text-black/30"
          />

          <label className="flex cursor-pointer gap-4 items-start">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-6 w-6 flex-shrink-0 rounded border border-black/10 accent-black"
            />
            <span className="text-[15px] leading-[1.35] text-black/50">
              {strings.reviewConsentLabel ??
                "Je suis d'accord d'etre recontacte par email suite a ma demande pour donner plus d'informations si necessaire."}
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={rating === 0 || submitting}
          className="flex h-[40px] w-full items-center justify-center rounded-[6px] bg-black text-[14px] font-medium text-white disabled:opacity-40"
        >
          {strings.reviewSubmit}
        </button>
      </div>
    </div>
  );
}
