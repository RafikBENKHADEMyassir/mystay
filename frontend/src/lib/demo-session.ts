export type DemoSession = {
  hotelId: string;
  hotelName: string;
  stayId: string;
  confirmationNumber: string;
  guestToken: string;
  roomNumber?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: {
    adults: number;
    children: number;
  } | null;
};

const storageKey = "mystay_demo_session_v1";

export function setDemoSession(session: DemoSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(storageKey, JSON.stringify(session));
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.hotelId || !parsed.hotelName || !parsed.stayId || !parsed.confirmationNumber || !parsed.guestToken) {
      return null;
    }

    return {
      hotelId: parsed.hotelId,
      hotelName: parsed.hotelName,
      stayId: parsed.stayId,
      confirmationNumber: parsed.confirmationNumber,
      guestToken: parsed.guestToken,
      roomNumber: parsed.roomNumber ?? null,
      checkIn: typeof parsed.checkIn === "string" ? parsed.checkIn : parsed.checkIn ?? null,
      checkOut: typeof parsed.checkOut === "string" ? parsed.checkOut : parsed.checkOut ?? null,
      guests:
        parsed.guests && typeof parsed.guests === "object"
          ? {
              adults:
                typeof (parsed.guests as { adults?: unknown }).adults === "number"
                  ? (parsed.guests as { adults: number }).adults
                  : 0,
              children:
                typeof (parsed.guests as { children?: unknown }).children === "number"
                  ? (parsed.guests as { children: number }).children
                  : 0
            }
          : null
    };
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(storageKey);
}
