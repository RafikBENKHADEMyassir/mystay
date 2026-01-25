"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Leaf, RefreshCw, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { ServiceCatalog } from "@/components/services";
import { getDemoSession } from "@/lib/demo-session";
import { withLocale } from "@/lib/i18n/paths";

// Unsplash placeholder image for hero
const HERO_IMAGE = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80";

type Ticket = {
  id: string;
  stayId: string | null;
  hotelId: string;
  roomNumber: string | null;
  department: string;
  status: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Status translations
const statusLabels: Record<string, string> = {
  pending: "En attente de confirmation",
  in_progress: "Confirmée",
  resolved: "Terminée"
};

export default function SpaPage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spaTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "spa-gym"),
    [tickets]
  );

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  async function loadTickets(activeSession = session) {
    if (!activeSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/v1/tickets", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });
      if (!response.ok) {
        setError("Impossible de charger les réservations.");
        return;
      }

      const data = (await response.json()) as { items?: Ticket[] };
      setTickets(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Service indisponible. Réessayez plus tard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  const handleRequestSubmitted = () => {
    void loadTickets(session);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={withLocale(locale, "/")} className="p-2 -ml-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </Link>
          <div className="text-center">
            <p className="font-medium text-gray-900">Spa & Gym</p>
            <p className="text-sm text-gray-500">Hôtel Four Seasons</p>
          </div>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">Connectez-vous pour accéder aux services spa.</p>
          <Link 
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            Commencer le check-in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header with Image */}
      <div className="relative h-48">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        
        {/* Topbar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4">
          <Link href={withLocale(locale, "/")} className="p-2 -ml-2 rounded-full bg-white/10 backdrop-blur-sm">
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <Leaf className="h-6 w-6 text-white/80" />
        </div>
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light tracking-wide text-white uppercase">
            Spa & Gym
          </h1>
          <p className="mt-1 text-sm text-white/80">Voir le service &gt;</p>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Ouvert aujourd'hui : 9h00 - 21h00</span>
        </div>
      </div>

      {/* Active Bookings Section */}
      {spaTickets.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Mes réservations</p>
            <button 
              onClick={() => loadTickets()} 
              disabled={isLoading}
              className="p-1.5 rounded-full hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="space-y-2">
            {spaTickets.map((ticket) => (
              <div 
                key={ticket.id}
                className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"
              >
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  🧖 {ticket.title}
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
              </div>
            ))}
            {spaTickets.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {statusLabels[spaTickets[0].status] || spaTickets[0].status}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Service Catalog */}
      <div className="px-4 py-6">
        <ServiceCatalog
          hotelId={session.hotelId}
          department="spa-gym"
          guestToken={session.guestToken}
          stayId={session.stayId}
          roomNumber={session.roomNumber}
          onRequestSubmitted={handleRequestSubmitted}
        />
      </div>
    </div>
  );
}
