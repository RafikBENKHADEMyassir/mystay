"use client";

import { useState, useCallback, useEffect } from "react";
import { AppLink } from "@/components/ui/app-link";
import { ImageIcon } from "lucide-react";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";
import type { ExperienceItem, ExperienceSection } from "@/types/overview";
import { RestaurantBottomSheet } from "@/components/restaurant/restaurant-bottom-sheet";
import { RestaurantBookingForm } from "@/components/restaurant/restaurant-booking-form";
import { getDemoSession } from "@/lib/demo-session";

type Props = {
  locale: Locale;
  content: Pick<GuestContent["pages"]["home"]["overview"], "upsellsUnavailable" | "noUpsellsConfigured">;
  sections: ExperienceSection[];
  error: string | null;
};

export function ExperienceCarousel({ locale, content, sections, error }: Props) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<ExperienceItem | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const visibleSections = sections.filter(
    (section) => Array.isArray(section.items) && section.items.length > 0
  );

  const handleRestaurantClick = useCallback((item: ExperienceItem) => {
    setSelectedRestaurant(item);
    setShowBookingForm(false);
    setBookingSuccess(false);
  }, []);

  const handleBook = useCallback(() => {
    setShowBookingForm(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedRestaurant(null);
    setShowBookingForm(false);
  }, []);

  const handleBooked = useCallback(() => {
    setBookingSuccess(true);
    setShowBookingForm(false);
    setSelectedRestaurant(null);
  }, []);

  // Auto-hide success toast
  useEffect(() => {
    if (!bookingSuccess) return;
    const timer = setTimeout(() => setBookingSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [bookingSuccess]);

  if (visibleSections.length === 0) {
    return (
      <p className="mt-6 px-0.5 text-xs text-muted-foreground">
        {error ? content.upsellsUnavailable : content.noUpsellsConfigured}
      </p>
    );
  }

  const session = getDemoSession();

  return (
    <>
      {visibleSections.map((section) => (
        <ExperienceSectionRow
          key={section.id}
          locale={locale}
          section={section}
          onRestaurantClick={handleRestaurantClick}
        />
      ))}

      {/* Restaurant bottom sheet */}
      {selectedRestaurant && !showBookingForm && (
        <RestaurantBottomSheet
          item={selectedRestaurant}
          onBook={handleBook}
          onClose={handleClose}
        />
      )}

      {/* Booking form */}
      {selectedRestaurant && showBookingForm && session?.guestToken && (() => {
        const config = (selectedRestaurant.restaurantConfig ?? {}) as Record<string, unknown>;
        const hoursStr = typeof config.hours === "string" ? config.hours : "";
        const [openingTime, closingTime] = hoursStr.includes("-")
          ? hoursStr.split("-").map((s: string) => s.trim())
          : [undefined, undefined];
        return (
          <RestaurantBookingForm
            restaurantName={selectedRestaurant.label}
            experienceItemId={selectedRestaurant.id}
            onClose={() => setShowBookingForm(false)}
            onBooked={handleBooked}
            guestToken={session.guestToken}
            openingTime={openingTime}
            closingTime={closingTime}
          />
        );
      })()}

      {/* Success toast */}
      {bookingSuccess && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
            {locale === "fr"
              ? "Votre réservation a été envoyée ! Consultez vos messages pour le suivi."
              : "Your booking request has been sent! Check your messages for updates."}
          </div>
        </div>
      )}
    </>
  );
}

type ExperienceSectionRowProps = {
  locale: Locale;
  section: ExperienceSection;
  onRestaurantClick: (item: ExperienceItem) => void;
};

function ExperienceSectionRow({ locale, section, onRestaurantClick }: ExperienceSectionRowProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  return (
    <section className="mt-6 ml-5">
      <p className="mb-3 px-0.5 text-[20px] font-semibold text-foreground">
        {locale === "fr" ? section.titleFr : section.titleEn}
      </p>
      <div className="-mx-4 flex gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 no-scrollbar snap-x snap-mandatory">
        {section.items.map((item) => {
          const isRestaurant = item.type === "restaurant";
          const href = item.linkUrl ? withLocale(locale, item.linkUrl) : withLocale(locale, "/services");
          const isUpsellsCard = item.label.toLowerCase().includes("upsell");
          const imageUrl = item.imageUrl?.startsWith("/uploads/")
            ? `${apiBaseUrl}${item.imageUrl}`
            : item.imageUrl;

          if (isRestaurant) {
            return (
              <button
                key={item.id}
                onClick={() => onRestaurantClick(item)}
                className={cn(
                  "relative h-[250px] w-[170px] flex-shrink-0 snap-start overflow-hidden rounded-[14px] bg-muted/40 shadow-sm text-left",
                  isUpsellsCard && "bg-muted/70"
                )}
                style={{
                  backgroundImage: isUpsellsCard ? undefined : `url(${imageUrl})`,
                  backgroundSize: isUpsellsCard ? undefined : "cover",
                  backgroundPosition: isUpsellsCard ? undefined : "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                <p className="absolute text-[20px] bottom-2 left-2 right-2 line-clamp-2 text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-white">
                  {item.label}
                </p>
              </button>
            );
          }

          return (
            <AppLink
              key={item.id}
              href={href}
              className={cn(
                "relative h-[250px] w-[170px] flex-shrink-0 snap-start overflow-hidden rounded-[14px] bg-muted/40 shadow-sm",
                isUpsellsCard && "bg-muted/70"
              )}
              style={{
                backgroundImage: isUpsellsCard ? undefined : `url(${imageUrl})`,
                backgroundSize: isUpsellsCard ? undefined : "cover",
                backgroundPosition: isUpsellsCard ? undefined : "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              {isUpsellsCard ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    <ImageIcon className="h-5 w-5 text-white/80" />
                  </div>
                </div>
              ) : null}
              <p className="absolute text-[20px] bottom-2 left-2 right-2 line-clamp-2 text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-white">
                {item.label}
              </p>
            </AppLink>
          );
        })}
      </div>
    </section>
  );
}
