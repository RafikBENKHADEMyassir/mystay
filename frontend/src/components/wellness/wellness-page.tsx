"use client";

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, Leaf, MessageCircle, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import type { GuestContent } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";

import { AvailabilityAccordion } from "./availability-accordion";
import { WellnessBookingDialog } from "./wellness-booking-dialog";

type WellnessCategory = "spa" | "gym";

type WellnessService = GuestContent["pages"]["spaGym"]["services"][number];

type WellnessPageProps = {
  category: WellnessCategory;
};

function formatDuration(durationMinutes: number, labels: { hour: string; minute: string }) {
  if (!durationMinutes) return "";

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} ${labels.hour} ${minutes}`;
  }

  if (hours > 0) {
    return `${hours} ${labels.hour}`;
  }

  return `${minutes} ${labels.minute}`;
}

export function WellnessPage({ category }: WellnessPageProps) {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
  const [selectedService, setSelectedService] = useState<WellnessService | null>(null);

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  useEffect(() => {
    setAvailabilityExpanded(false);
    setSelectedService(null);
  }, [category]);

  const { content, isLoading } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.spaGym;
  const common = content?.common;

  const services = useMemo(
    () => (page?.services ?? []).filter((item) => item.category === category),
    [category, page?.services]
  );

  const heroImage =
    category === "spa"
      ? page?.heroImages?.spa ?? page?.heroImage
      : page?.heroImages?.gym ?? page?.heroImage;

  const serviceCards = category === "gym" ? services.slice(0, 2) : services;
  const gymShowcase =
    category === "gym"
      ? (page?.galleryImages?.gym ?? services.map((item) => item.image).filter(Boolean)).slice(0, 3)
      : [];

  if (isLoading || !page || !common) {
    return <WellnessPageSkeleton />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <AppLink href={withLocale(locale, "/services")} className="-ml-2 p-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </AppLink>
          <p className="text-base font-medium text-gray-900">
            {category === "spa" ? page.tabs.spa : page.tabs.gym}
          </p>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>

        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">{common.signInToAccessSpaGym}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative h-[260px] overflow-clip">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-black/40" />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[90px]"
          style={{
            background:
              "linear-gradient(rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.376) 25%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 79.8%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2 py-2.5">
          <AppLink
            href={withLocale(locale, "/services")}
            className="rounded-md p-2 text-white/85 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </AppLink>
          <Leaf className="h-8 w-8 text-white/85" />
        </div>

        <div className="absolute inset-x-0 top-[104px] flex justify-center">
          <h1 className="text-[28px] font-light leading-[1.15] tracking-[1.12px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {category === "spa" ? page.tabs.spa : page.tabs.gym}
          </h1>
        </div>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <AppLink
          href={withLocale(locale, `/messages?department=${encodeURIComponent(page.messaging.department)}`)}
          className="block rounded-md border border-black/10 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-[33px] w-[33px]">
              <MessageCircle className="h-[33px] w-[33px] text-black/50" />
              <span className="absolute right-[2px] top-[3px] h-[7px] w-[7px] rounded-full bg-[#78c99f]" />
            </div>
            <p className="flex-1 text-[15px] leading-[1.2] text-black">{page.messaging.availabilityMessage}</p>
            <ChevronRight className="h-4 w-4 text-black/50" />
          </div>
        </AppLink>
      </div>

      <div className="px-4 pt-2">
        <AvailabilityAccordion
          title={page.availability.title}
          fromLabel={page.availability.fromLabel}
          toLabel={page.availability.toLabel}
          openingFrom={common.availabilityCard.openingFrom}
          openingTo={common.availabilityCard.openingTo}
          allDayLabel={page.availability.allDayLabel}
          unavailableLabel={page.availability.unavailableLabel}
          rows={page.availability.schedule}
          expanded={availabilityExpanded}
          onToggle={() => setAvailabilityExpanded((value) => !value)}
          openAriaLabel={page.availability.expandAriaLabel}
          closeAriaLabel={page.availability.collapseAriaLabel}
        />
      </div>

      <div className="px-4 py-6">
        <div className="mx-auto h-[2px] w-full max-w-[279px] rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
      </div>

      {gymShowcase.length > 0 ? (
        <div className="px-4 pb-3">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {gymShowcase.map((image, index) => (
              <div key={`${image}-${index}`} className="h-[150px] w-[150px] shrink-0 overflow-hidden rounded-[6px]">
                <img src={image ?? ""} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 px-4">
        {serviceCards.map((service) => (
          <WellnessServiceCard
            key={service.id}
            service={service}
            durationLabel={formatDuration(service.duration, page.durationLabels)}
            bookLabel={page.bookSession}
            onBook={() => setSelectedService(service)}
          />
        ))}
      </div>

      {category === "gym" && page.quickActions.gym.length > 0 ? (
        <div className="mt-3 px-4">
          <div className="space-y-2 rounded-[6px] border border-black/[0.06] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            {page.quickActions.gym.map((action) => (
              <AppLink
                key={action.id}
                href={withLocale(locale, action.href)}
                className="flex items-center gap-3 rounded-[6px] border border-black/10 p-3 text-[15px] text-black transition hover:bg-black/[0.02]"
              >
                <span className="flex-1 leading-[1.15]">{action.label}</span>
                <ChevronRight className="h-4 w-4 text-black/55" />
              </AppLink>
            ))}
          </div>
        </div>
      ) : null}

      <WellnessBookingDialog
        open={Boolean(selectedService)}
        onOpenChange={(open) => {
          if (!open) setSelectedService(null);
        }}
        guestToken={session.guestToken}
        hotelId={session.hotelId}
        stayId={session.stayId}
        roomNumber={session.roomNumber}
        service={selectedService}
        timeSlots={page.timeSlots}
        content={page.bookingDialog}
      />

      {/* Sticky Message Bar */}
      <div className="sticky bottom-0 border-t bg-white/90 backdrop-blur">
        <AppLink
          href={withLocale(locale, `/messages?department=${encodeURIComponent(page.messaging.department)}`)}
          className="mx-auto flex max-w-md items-center gap-3 px-4 py-3"
        >
          <span className="flex-1 text-sm text-gray-400">
            {locale === "fr" ? "Écrire un message" : "Write a message"}
          </span>
          <Send className="h-5 w-5 text-black/60" />
        </AppLink>
      </div>
    </div>
  );
}

type WellnessServiceCardProps = {
  service: WellnessService;
  durationLabel: string;
  bookLabel: string;
  onBook: () => void;
};

function WellnessServiceCard({ service, durationLabel, bookLabel, onBook }: WellnessServiceCardProps) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-start">
        <div className="h-[125px] w-[125px] shrink-0 overflow-hidden bg-black/[0.03]">
          {service.image ? <img src={service.image} alt={service.name} className="h-full w-full object-cover" /> : null}
        </div>

        <div className="flex min-h-[125px] min-w-0 flex-1 flex-col justify-between gap-[18px] p-4">
          <div className="space-y-3">
            <div className="flex items-baseline gap-2.5">
              <h3 className="flex-1 text-[16px] font-normal leading-none text-black">{service.name}</h3>
              {durationLabel ? (
                <span className="whitespace-nowrap text-[15px] leading-none text-black/50">{durationLabel}</span>
              ) : null}
            </div>
            <p className="text-[15px] leading-[1.15] text-black/50">{service.description}</p>
          </div>

          <button
            type="button"
            onClick={onBook}
            className="h-10 rounded-[8px] bg-white/65 text-[14px] font-medium text-black shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-[6px] transition hover:bg-white/80"
          >
            {bookLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function WellnessPageSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="h-[260px] animate-pulse bg-black/5" />
      <div className="-mt-6 px-4">
        <div className="h-[60px] animate-pulse rounded-md border border-black/10 bg-black/5" />
      </div>
      <div className="px-4 pt-4">
        <div className="h-10 animate-pulse rounded-md bg-black/5" />
      </div>
      <div className="px-4 py-6">
        <div className="mx-auto h-[2px] w-full max-w-[279px] rounded-[9px] bg-black/10" />
      </div>
      <div className="space-y-3 px-4">
        <div className="h-[125px] animate-pulse rounded-[6px] border border-black/[0.06] bg-black/[0.03]" />
        <div className="h-[125px] animate-pulse rounded-[6px] border border-black/[0.06] bg-black/[0.03]" />
      </div>
    </div>
  );
}
