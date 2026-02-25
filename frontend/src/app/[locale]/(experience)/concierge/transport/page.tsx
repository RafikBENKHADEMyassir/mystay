"use client";

import { AppLink } from "@/components/ui/app-link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Loader2, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { cn } from "@/lib/utils";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function TransportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { isLoading: sessionLoading, overview, authenticated, token } = useGuestOverview();
  const { content } = useGuestContent(locale, overview?.hotel.id ?? null);
  const page = content?.pages.transport;
  const common = content?.common;

  const isAirport = searchParams.get("type") === "airport";

  const [address, setAddress] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 48.8566, lng: 2.3522 });
  const [timing, setTiming] = useState<"asap" | "later">("asap");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [wantsReturn, setWantsReturn] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));
    setTime("13:15");
  }, []);

  async function handleSubmit() {
    if (!token || !overview || !page) return;
    if (!address.trim()) {
      setError(page.errors.missingFields);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const title = isAirport ? (page.airportTitle ?? page.title) : page.title;

      const response = await fetch(new URL("/api/v1/services/request", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hotelId: overview.hotel.id,
          stayId: overview.stay.id,
          roomNumber: overview.stay.roomNumber,
          department: "concierge",
          title,
          payload: {
            type: isAirport ? "airport_transfer" : "transport",
            destination: address,
            coordinates: mapCenter,
            timing,
            date: timing === "later" ? date : undefined,
            time: timing === "later" ? time : undefined,
            adults,
            children,
            wantsReturn: wantsReturn ?? false
          }
        })
      });

      if (!response.ok) {
        setError(page.errors.submitFailed);
        return;
      }

      setSuccess(true);
    } catch {
      setError(page.errors.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sessionLoading || !page || !common) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black/30" />
      </div>
    );
  }

  const pageTitle = isAirport ? (page.airportTitle ?? page.title) : page.title;

  if (!authenticated || !overview) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="-ml-2 p-2">
            <X className="h-5 w-5 text-black" />
          </button>
          <p className="text-[15px] font-medium text-black">{pageTitle}</p>
          <div className="h-5 w-5" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-[14px] text-black/50">{common.signInToAccessServices}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-[14px] font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mt-6 text-center text-[20px] font-medium text-black">{page.successTitle}</h2>
        <p className="mt-3 text-center text-[14px] leading-[1.5] text-black/50">
          {page.successMessage}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <AppLink
            href={withLocale(locale, "/messages?department=concierge")}
            className="flex h-[44px] w-full items-center justify-center rounded-[8px] bg-black text-[14px] font-medium text-white"
          >
            {page.goToMessages}
          </AppLink>
          <AppLink
            href={withLocale(locale, "/concierge")}
            className="flex h-[44px] w-full items-center justify-center rounded-[8px] text-[14px] font-medium text-black"
          >
            {page.backToConcierge}
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar — gradient fade bg, Annuler / Enregistrer */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-white via-white to-white/0">
        <div className="flex h-[52px] items-center justify-between px-2">
          <button
            onClick={() => router.back()}
            className="flex h-[36px] items-center gap-1.5 rounded-full px-2"
          >
            <X className="h-[18px] w-[18px] text-black" strokeWidth={2} />
            <span className="text-[15px] text-black">{page.cancelLabel}</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex h-[36px] items-center gap-1.5 rounded-full px-2 disabled:opacity-40"
          >
            <Check className="h-[18px] w-[18px] text-black" strokeWidth={2} />
            <span className="text-[15px] text-black">{page.saveLabel}</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pb-2 pt-[6px]">
        <h1 className="text-[22px] font-normal leading-[1.25] text-black">{pageTitle}</h1>
      </div>

      {/* Scrollable form sections */}
      <div className="flex-1 space-y-4 px-4 pt-4">
        {/* Section 1: Destination */}
        <SectionCard>
          <SectionHeader
            title={page.destinationTitle}
            subtitle={page.destinationHint}
          />
          {/* Address input */}
          <div className="mx-3 mt-4 overflow-hidden rounded-[8px] border border-black/[0.08]">
            <label className="block px-4 pt-2.5 text-[12px] leading-none text-black/40">
              {page.addressLabel}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={page.addressPlaceholder}
              className="w-full border-0 bg-transparent px-4 pb-3 pt-1.5 text-[16px] leading-[1.15] text-black placeholder:text-black/25 focus:outline-none"
            />
          </div>

          {/* Ouvrir la carte / Refermer la carte */}
          <button
            onClick={() => setMapOpen(!mapOpen)}
            className="mx-3 mt-3 flex w-[calc(100%-24px)] items-center justify-between rounded-[8px] border border-black/[0.08] px-4 py-2"
          >
            <span className="text-[14px] text-black">
              {mapOpen ? page.closeMapLabel : page.openMapLabel}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-black/40 transition-transform duration-200",
                mapOpen && "rotate-180"
              )}
            />
          </button>

          {/* Google Map */}
          {mapOpen && (
            <div className="mx-3 mt-3 overflow-hidden rounded-[8px]">
              <TransportMap
                apiKey={mapsApiKey}
                center={mapCenter}
                onCenterChange={setMapCenter}
              />
            </div>
          )}
        </SectionCard>

        {/* Section 2: When */}
        <SectionCard>
          <SectionHeader title={page.whenTitle} />
          <div className="mx-3 mt-4">
            <SegmentedToggle
              options={[
                { id: "asap", label: page.asapLabel },
                { id: "later", label: page.anotherTimeLabel }
              ]}
              value={timing}
              onChange={(v) => setTiming(v as "asap" | "later")}
            />
          </div>
          {timing === "later" && (
            <div className="mx-3 mt-3 flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-[8px] border border-black/[0.08] px-4 py-3.5">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-[15px] text-black focus:outline-none"
                />
              </div>
              <span className="shrink-0 text-[15px] text-black/40">a</span>
              <div className="flex items-center rounded-[8px] border border-black/[0.08]">
                <div className="border-r border-black/[0.08] px-3 py-3.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={time.split(":")[0] ?? "13"}
                    onChange={(e) => setTime(`${e.target.value.padStart(2, "0")}:${time.split(":")[1] ?? "00"}`)}
                    className="w-[24px] bg-transparent text-center text-[15px] text-black focus:outline-none"
                  />
                </div>
                <span className="px-0.5 text-[15px] text-black">:</span>
                <div className="px-3 py-3.5">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={time.split(":")[1] ?? "15"}
                    onChange={(e) => setTime(`${time.split(":")[0] ?? "13"}:${e.target.value.padStart(2, "0")}`)}
                    className="w-[24px] bg-transparent text-center text-[15px] text-black focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Section 3: Passengers */}
        <SectionCard>
          <SectionHeader title={page.passengersTitle} />
          <div className="mx-3 mt-4 space-y-[8px]">
            <PassengerRow label={page.adultsLabel} value={adults} min={1} max={10} onChange={setAdults} />
            <PassengerRow label={page.childrenLabel} value={children} min={0} max={10} onChange={setChildren} />
          </div>
        </SectionCard>

        {/* Section 4: Return trip */}
        <SectionCard>
          <SectionHeader title={page.returnTitle} />
          <div className="mx-3 mt-4">
            <SegmentedToggle
              options={[
                { id: "yes", label: page.yesLabel },
                { id: "no", label: page.noLabel }
              ]}
              value={wantsReturn === true ? "yes" : wantsReturn === false ? "no" : null}
              onChange={(v) => setWantsReturn(v === "yes")}
            />
          </div>
        </SectionCard>

        {/* Error */}
        {error && <p className="text-center text-[13px] text-red-500">{error}</p>}
      </div>

      {/* Submit — in content flow with safe bottom space for global nav */}
      <div className="px-4 pb-40 pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex h-[40px] w-full items-center justify-center rounded-[8px] bg-black text-[14px] font-medium text-white transition disabled:opacity-40"
        >
          {isSubmitting ? page.submitting : page.submitButton}
        </button>
      </div>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-black/[0.06] bg-white pb-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 pt-4">
      <p className="text-[16px] font-medium leading-[1.2] text-black">{title}</p>
      {subtitle && (
        <p className="mt-2 text-[13px] leading-[1.4] text-black/45">{subtitle}</p>
      )}
    </div>
  );
}

/* ─── Segmented Toggle ─── */
function SegmentedToggle({
  options,
  value,
  onChange
}: {
  options: Array<{ id: string; label: string }>;
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex rounded-[8px] border border-black/[0.08] bg-black/[0.02] p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 rounded-[6px] py-2 text-center text-[14px] transition-all",
            value === opt.id
              ? "bg-white font-medium text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-black/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Passenger Row ─── */
function PassengerRow({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex h-[45px] items-center justify-between rounded-[8px] border border-black/[0.08] px-4">
      <span className="text-[15px] text-black">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-[28px] w-[28px] items-center justify-center rounded-full border border-black/[0.12] transition disabled:opacity-25"
        >
          <Minus className="h-3.5 w-3.5 text-black" />
        </button>
        <span className="min-w-[18px] text-center text-[16px] tabular-nums text-black">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-[28px] w-[28px] items-center justify-center rounded-full border border-black/[0.12] transition disabled:opacity-25"
        >
          <Plus className="h-3.5 w-3.5 text-black" />
        </button>
      </div>
    </div>
  );
}

/* ─── Google Maps ─── */
function TransportMap({
  apiKey,
  center,
  onCenterChange
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  onCenterChange: (c: { lat: number; lng: number }) => void;
}) {
  const mapRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const getGoogleMaps = useCallback(
    () => (window as Window & { google?: { maps?: any } }).google?.maps,
    []
  );
  const [scriptReady, setScriptReady] = useState(typeof window !== "undefined" && !!getGoogleMaps());

  useEffect(() => {
    if (scriptReady || !apiKey) return;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true));
      if (getGoogleMaps()) setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, [apiKey, getGoogleMaps, scriptReady]);

  const initMap = useCallback(() => {
    const maps = getGoogleMaps();
    if (!containerRef.current || !maps) return;
    if (mapRef.current) return;

    const map = new maps.Map(containerRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] }
      ]
    });

    const marker = new maps.Marker({
      position: center,
      map,
      draggable: true
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) onCenterChange({ lat: pos.lat(), lng: pos.lng() });
    });

    map.addListener("click", (e: { latLng?: { lat: () => number; lng: () => number } }) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        onCenterChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });

    mapRef.current = map;
    setLoaded(true);
  }, [center, getGoogleMaps, onCenterChange]);

  useEffect(() => {
    if (scriptReady) initMap();
  }, [scriptReady, initMap]);

  if (!apiKey) {
    return (
      <div className="flex h-[266px] items-center justify-center rounded-[8px] bg-black/[0.04]">
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <div className="text-[24px]">🗺️</div>
          <p className="text-[13px] text-black/40">
            Google Maps API key required.
          </p>
          <p className="text-[12px] text-black/30">
            Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[266px] w-full rounded-[8px] bg-black/[0.04]" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-black/[0.04]">
          <Loader2 className="h-6 w-6 animate-spin text-black/20" />
        </div>
      )}
    </div>
  );
}
