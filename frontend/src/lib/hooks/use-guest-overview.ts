"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getDemoSession, type DemoSession } from "@/lib/demo-session";

export type GuestSessionResponse = {
  authenticated: boolean;
  backendToken: string | null;
  user: {
    guestId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    emailVerified?: boolean;
    idDocumentVerified?: boolean;
    hasPaymentMethod?: boolean;
  } | null;
  stay: { hotelId: string; stayId: string } | null;
};

export type GuestOverview = {
  hotel: {
    id: string;
    name: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    city: string | null;
    country: string | null;
    currency: string | null;
  };
  stay: {
    id: string;
    confirmationNumber: string;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
    guests: { adults: number; children: number };
    pmsReservationId: string | null;
    pmsStatus: string | null;
  };
  guest: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    emailVerified: boolean | null;
    idDocumentVerified: boolean | null;
    hasPaymentMethod: boolean | null;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchSession(): Promise<GuestSessionResponse> {
  const res = await fetch("/api/auth/session", { method: "GET" });
  return (await res.json()) as GuestSessionResponse;
}

async function fetchOverview(token: string): Promise<GuestOverview> {
  const res = await fetch(new URL("/api/v1/guest/overview", apiBaseUrl).toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    const code = typeof payload?.error === "string" ? payload.error : `overview_failed_${res.status}`;
    throw new Error(code);
  }

  return (await res.json()) as GuestOverview;
}

function tokenFromDemoSession(session: DemoSession | null) {
  const token = typeof session?.guestToken === "string" ? session.guestToken.trim() : "";
  return token || null;
}

export function useGuestOverview() {
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [session, setSession] = useState<GuestSessionResponse | null>(null);
  const [overview, setOverview] = useState<GuestOverview | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const currentDemo = getDemoSession();
    setDemoSession(currentDemo);

    let resolvedToken = tokenFromDemoSession(currentDemo);
    let resolvedSession: GuestSessionResponse | null = null;

    try {
      resolvedSession = await fetchSession();
      setSession(resolvedSession);
      if (!resolvedToken && resolvedSession?.authenticated && resolvedSession.backendToken) {
        resolvedToken = resolvedSession.backendToken;
      }
    } catch {
      // Ignore session fetch errors and fall back to demo session
    }

    setToken(resolvedToken);

    if (resolvedToken) {
      try {
        const nextOverview = await fetchOverview(resolvedToken);
        setOverview(nextOverview);
      } catch (err) {
        const message = err instanceof Error ? err.message : "overview_failed";
        setError(message);
        setOverview(null);
      }
    } else {
      setOverview(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const authenticated = Boolean(session?.authenticated) || Boolean(demoSession);
  const hasStay = Boolean(overview?.stay?.id);

  return useMemo(
    () => ({
      isLoading,
      error,
      token,
      session,
      overview,
      authenticated,
      hasStay,
      refresh
    }),
    [authenticated, error, hasStay, isLoading, overview, refresh, session, token]
  );
}

