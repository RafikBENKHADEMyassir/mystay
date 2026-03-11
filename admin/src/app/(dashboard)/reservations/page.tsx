import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationsFilters } from "@/components/reservations/reservations-filters";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";

type Reservation = {
  id: string;
  hotelId: string;
  guestId: string | null;
  confirmationNumber: string;
  guestName: string;
  phone: string | null;
  email: string | null;
  arrivalDate: string;
  departureDate: string;
  roomNumber: string | null;
  status: "arrivals" | "checked_in" | "checked_out" | "cancelled";
  journeyStatus: string | null;
  updatedAt: string;
};

type ReservationDetail = {
  id: string;
  hotel: { id: string; name: string };
  guest: {
    id: string | null;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    idDocumentVerified: boolean;
    idDocumentUrl: string | null;
  };
  stay: {
    id: string;
    confirmationNumber: string;
    pmsReservationId: string | null;
    pmsStatus: string | null;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
    guests: { adults: number; children: number };
    priceCents: number | null;
    status: string;
    journeyStatus: string | null;
  };
  links: {
    tickets: Array<{ id: string; roomNumber: string | null; department: string; status: string; title: string; updatedAt: string }>;
    threads: Array<{
      id: string;
      department: string;
      status: string;
      title: string;
      updatedAt: string;
      lastMessage: string | null;
      lastMessageAt: string | null;
    }>;
  };
};

type ReservationsResponse = {
  items: Reservation[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ReservationsPageProps = {
  searchParams?: {
    status?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: string;
    reservationId?: string;
    new?: string;
    saved?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const reservationsCopy = {
  en: {
    appName: "MyStay Admin",
    title: "Reservations",
    subtitle: "Arrivals, in-house guests, and departures.",
    createGroup: "Create group",
    syncFromPms: "Sync from PMS",
    addReservation: "Add reservation",
    filtersTitle: "Filters",
    filtersDescription: "Arrival/departure window plus guest/booking search.",
    syncedFromPms: "Reservations synced from PMS.",
    tabs: {
      arrivals: "Arrivals",
      checked_in: "Checked-in",
      checked_out: "Checked-out",
      cancelled: "Cancelled",
    },
    reservationLabel: "reservation",
    reservationsLabel: "reservations",
    listTitle: "List",
    listDescription: "Click a row to open the reservation drawer.",
    previous: "Previous",
    next: "Next",
    table: {
      guest: "Guest",
      phone: "Phone",
      email: "Email",
      arrival: "Arrival",
      departure: "Departure",
      room: "Room",
      journey: "Journey",
    },
    unlinkedGuest: "Unlinked guest",
    journeyOk: "OK",
    noReservations: "No reservations match the current filters.",
    createReservation: "Create reservation",
    newReservation: "New reservation",
    managerAccess: "Manager access",
    close: "Close",
    newReservationCardTitle: "New reservation",
    newReservationCardDescription: "Creates a reservation in the PMS, then syncs it into MyStay.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    optional: "optional",
    arrivalDate: "Arrival date",
    departureDate: "Departure date",
    room: "Room",
    roomPlaceholder: "e.g. 101",
    adults: "Adults",
    children: "Children",
    priceEur: "Price (EUR)",
    pricePlaceholder: "e.g. 250.00",
    readOnly: "Read-only",
    askManager: "Ask a manager to create reservations.",
    checkinReminderQueued: "Check-in reminder queued in notifications outbox.",
    reservationCreated: "Reservation created in PMS.",
    reservationUpdated: "Reservation updated in PMS.",
    stayTitle: "Stay",
    stayDescription: "Reservation and room details.",
    status: "Status",
    guests: "Guests",
    arrival: "Arrival",
    departure: "Departure",
    price: "Price",
    journey: "Journey",
    guestTitle: "Guest",
    guestDescription: "Profile and contact information.",
    emailVerified: "Email verified",
    emailUnverified: "Email unverified",
    idVerified: "ID verified",
    idNotVerified: "ID not verified",
    editReservationTitle: "Edit reservation",
    editReservationDescription: "Updates the reservation in the PMS and syncs back into MyStay.",
    saveChanges: "Save changes",
    noPmsReference: "No PMS reference yet. Click \"Sync from PMS\" first.",
    openConversation: "Open conversation",
    triggerCheckinReminder: "Trigger check-in reminder",
    createPaymentLink: "Create payment link",
    linkedRequestsTitle: "Linked requests",
    linkedRequestsDescription: "Tickets created during the stay.",
    noLinkedRequests: "No tickets linked to this stay yet.",
    linkedMessagesTitle: "Linked messages",
    linkedMessagesDescription: "Guest conversations for this stay.",
    noLinkedMessages: "No threads linked to this stay yet.",
    reservationNotAvailable: "Reservation not available",
    unableToLoadReservation: "Unable to load reservation",
    unableToLoadReservationDescription: "It may have been removed or you do not have access.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.",
  },
  fr: {
    appName: "MyStay Admin",
    title: "Reservations",
    subtitle: "Arrivees, clients sur place et departs.",
    createGroup: "Creer groupe",
    syncFromPms: "Synchroniser PMS",
    addReservation: "Ajouter reservation",
    filtersTitle: "Filtres",
    filtersDescription: "Fenetre arrivee/depart plus recherche client/reservation.",
    syncedFromPms: "Reservations synchronisees depuis le PMS.",
    tabs: {
      arrivals: "Arrivees",
      checked_in: "Check-in effectue",
      checked_out: "Check-out effectue",
      cancelled: "Annule",
    },
    reservationLabel: "reservation",
    reservationsLabel: "reservations",
    listTitle: "Liste",
    listDescription: "Cliquez une ligne pour ouvrir le panneau reservation.",
    previous: "Precedent",
    next: "Suivant",
    table: {
      guest: "Client",
      phone: "Telephone",
      email: "Email",
      arrival: "Arrivee",
      departure: "Depart",
      room: "Chambre",
      journey: "Parcours",
    },
    unlinkedGuest: "Client non lie",
    journeyOk: "OK",
    noReservations: "Aucune reservation ne correspond aux filtres actuels.",
    createReservation: "Creer reservation",
    newReservation: "Nouvelle reservation",
    managerAccess: "Acces manager",
    close: "Fermer",
    newReservationCardTitle: "Nouvelle reservation",
    newReservationCardDescription: "Cree une reservation dans le PMS puis la synchronise dans MyStay.",
    firstName: "Prenom",
    lastName: "Nom",
    email: "Email",
    phone: "Telephone",
    optional: "optionnel",
    arrivalDate: "Date d'arrivee",
    departureDate: "Date de depart",
    room: "Chambre",
    roomPlaceholder: "ex. 101",
    adults: "Adultes",
    children: "Enfants",
    priceEur: "Prix (EUR)",
    pricePlaceholder: "ex. 250.00",
    readOnly: "Lecture seule",
    askManager: "Demandez a un manager de creer des reservations.",
    checkinReminderQueued: "Rappel de check-in ajoute a la file de notifications.",
    reservationCreated: "Reservation creee dans le PMS.",
    reservationUpdated: "Reservation mise a jour dans le PMS.",
    stayTitle: "Sejour",
    stayDescription: "Details de reservation et de chambre.",
    status: "Statut",
    guests: "Clients",
    arrival: "Arrivee",
    departure: "Depart",
    price: "Prix",
    journey: "Parcours",
    guestTitle: "Client",
    guestDescription: "Profil et informations de contact.",
    emailVerified: "Email verifie",
    emailUnverified: "Email non verifie",
    idVerified: "ID verifie",
    idNotVerified: "ID non verifie",
    editReservationTitle: "Modifier reservation",
    editReservationDescription: "Met a jour la reservation dans le PMS et la resynchronise dans MyStay.",
    saveChanges: "Enregistrer modifications",
    noPmsReference: "Aucune reference PMS pour le moment. Cliquez d'abord sur \"Synchroniser PMS\".",
    openConversation: "Ouvrir conversation",
    triggerCheckinReminder: "Declencher rappel de check-in",
    createPaymentLink: "Creer lien de paiement",
    linkedRequestsTitle: "Demandes liees",
    linkedRequestsDescription: "Tickets crees pendant le sejour.",
    noLinkedRequests: "Aucun ticket lie a ce sejour pour le moment.",
    linkedMessagesTitle: "Messages lies",
    linkedMessagesDescription: "Conversations client pour ce sejour.",
    noLinkedMessages: "Aucun fil lie a ce sejour pour le moment.",
    reservationNotAvailable: "Reservation indisponible",
    unableToLoadReservation: "Impossible de charger la reservation",
    unableToLoadReservationDescription: "Elle a peut-etre ete supprimee ou vous n'avez pas acces.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` (et `npm run db:reset` une fois) puis actualisez.",
  },
  es: {
    appName: "MyStay Admin",
    title: "Reservas",
    subtitle: "Llegadas, huespedes alojados y salidas.",
    createGroup: "Crear grupo",
    syncFromPms: "Sincronizar PMS",
    addReservation: "Agregar reserva",
    filtersTitle: "Filtros",
    filtersDescription: "Ventana llegada/salida mas busqueda de huesped/reserva.",
    syncedFromPms: "Reservas sincronizadas desde PMS.",
    tabs: {
      arrivals: "Llegadas",
      checked_in: "Check-in realizado",
      checked_out: "Check-out realizado",
      cancelled: "Cancelado",
    },
    reservationLabel: "reserva",
    reservationsLabel: "reservas",
    listTitle: "Lista",
    listDescription: "Haz clic en una fila para abrir el panel de reserva.",
    previous: "Anterior",
    next: "Siguiente",
    table: {
      guest: "Huesped",
      phone: "Telefono",
      email: "Correo",
      arrival: "Llegada",
      departure: "Salida",
      room: "Habitacion",
      journey: "Recorrido",
    },
    unlinkedGuest: "Huesped no vinculado",
    journeyOk: "OK",
    noReservations: "Ninguna reserva coincide con los filtros actuales.",
    createReservation: "Crear reserva",
    newReservation: "Nueva reserva",
    managerAccess: "Acceso manager",
    close: "Cerrar",
    newReservationCardTitle: "Nueva reserva",
    newReservationCardDescription: "Crea una reserva en PMS y luego la sincroniza en MyStay.",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo",
    phone: "Telefono",
    optional: "opcional",
    arrivalDate: "Fecha de llegada",
    departureDate: "Fecha de salida",
    room: "Habitacion",
    roomPlaceholder: "ej. 101",
    adults: "Adultos",
    children: "Ninos",
    priceEur: "Precio (EUR)",
    pricePlaceholder: "ej. 250.00",
    readOnly: "Solo lectura",
    askManager: "Pide a un manager que cree reservas.",
    checkinReminderQueued: "Recordatorio de check-in en cola de notificaciones.",
    reservationCreated: "Reserva creada en PMS.",
    reservationUpdated: "Reserva actualizada en PMS.",
    stayTitle: "Estancia",
    stayDescription: "Detalles de reserva y habitacion.",
    status: "Estado",
    guests: "Huespedes",
    arrival: "Llegada",
    departure: "Salida",
    price: "Precio",
    journey: "Recorrido",
    guestTitle: "Huesped",
    guestDescription: "Perfil e informacion de contacto.",
    emailVerified: "Correo verificado",
    emailUnverified: "Correo no verificado",
    idVerified: "ID verificado",
    idNotVerified: "ID no verificado",
    editReservationTitle: "Editar reserva",
    editReservationDescription: "Actualiza la reserva en PMS y la sincroniza de vuelta en MyStay.",
    saveChanges: "Guardar cambios",
    noPmsReference: "Aun no hay referencia PMS. Haz clic primero en \"Sincronizar PMS\".",
    openConversation: "Abrir conversacion",
    triggerCheckinReminder: "Enviar recordatorio de check-in",
    createPaymentLink: "Crear enlace de pago",
    linkedRequestsTitle: "Solicitudes vinculadas",
    linkedRequestsDescription: "Tickets creados durante la estancia.",
    noLinkedRequests: "No hay tickets vinculados a esta estancia todavia.",
    linkedMessagesTitle: "Mensajes vinculados",
    linkedMessagesDescription: "Conversaciones del huesped para esta estancia.",
    noLinkedMessages: "No hay hilos vinculados a esta estancia todavia.",
    reservationNotAvailable: "Reserva no disponible",
    unableToLoadReservation: "No se pudo cargar la reserva",
    unableToLoadReservationDescription: "Puede haber sido eliminada o no tienes acceso.",
    backendUnreachable: "Backend inaccesible. Inicia `npm run dev:backend` (y `npm run db:reset` una vez) y actualiza.",
  },
} as const;

function formatDate(raw: string): string {
  if (!raw) return "—";
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw;
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return raw;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function toDateInputValue(raw: string): string {
  if (!raw) return "";
  return raw.includes("T") ? raw.split("T")[0] : raw;
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getDayAfterTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function buildSearchParams(current: ReservationsPageProps["searchParams"], patch: Record<string, string | null | undefined>) {
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

async function getReservations(token: string, query: URLSearchParams): Promise<ReservationsResponse> {
  const response = await fetch(`${backendUrl}/api/v1/staff/reservations?${query.toString()}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as ReservationsResponse;
}

async function getReservation(token: string, reservationId: string): Promise<ReservationDetail | null> {
  const response = await fetch(`${backendUrl}/api/v1/staff/reservations/${encodeURIComponent(reservationId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as ReservationDetail;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const token = requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = reservationsCopy[locale];
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";
  const activeStatus = (searchParams?.status ?? "arrivals").trim() || "arrivals";
  const selectedReservationId = (searchParams?.reservationId ?? "").trim();
  const wantsNew = (searchParams?.new ?? "").trim() === "1";

  const query = buildSearchParams(searchParams, {
    status: activeStatus,
    page: searchParams?.page ?? "1",
    reservationId: null,
    new: null,
    saved: null,
    error: null
  });

  let reservations: ReservationsResponse | null = null;
  let reservationDetail: ReservationDetail | null = null;
  let error: string | null = null;

  try {
    reservations = await getReservations(token, query);
    if (selectedReservationId) {
      reservationDetail = await getReservation(token, selectedReservationId);
    }
  } catch {
    error = t.backendUnreachable;
  }

  const items = reservations?.items ?? [];
  const page = reservations?.page ?? 1;
  const totalPages = reservations?.totalPages ?? 1;

  const tabs = [
    { key: "arrivals", label: t.tabs.arrivals },
    { key: "checked_in", label: t.tabs.checked_in },
    { key: "checked_out", label: t.tabs.checked_out },
    { key: "cancelled", label: t.tabs.cancelled }
  ] as const;

  const baseQuery = buildSearchParams(searchParams, { page: "1", reservationId: null, new: null, saved: null, error: null });

  const closeDrawerHref = (() => {
    const next = buildSearchParams(searchParams, { reservationId: null, new: null, saved: null, error: null });
    const value = next.toString();
    return value ? `/reservations?${value}` : "/reservations";
  })();

  const openDrawerHref = (reservationId: string) => {
    const next = buildSearchParams(searchParams, { reservationId, new: null, saved: null, error: null });
    return `/reservations?${next.toString()}`;
  };

  const openNewHref = (() => {
    const next = buildSearchParams(searchParams, { new: "1", reservationId: null, saved: null, error: null });
    return `/reservations?${next.toString()}`;
  })();

  async function syncFromPms() {
    "use server";

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/staff/reservations/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, saved: null });
      redirect(`/reservations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { saved: "sync", error: null });
    redirect(`/reservations?${next.toString()}`);
  }

  async function createReservation(formData: FormData) {
    "use server";

    const token = requireStaffToken();

    const guestFirstName = String(formData.get("guestFirstName") ?? "").trim();
    const guestLastName = String(formData.get("guestLastName") ?? "").trim();
    const guestEmail = String(formData.get("guestEmail") ?? "").trim();
    const guestPhone = String(formData.get("guestPhone") ?? "").trim();

    const arrivalDate = String(formData.get("arrivalDate") ?? "").trim();
    const departureDate = String(formData.get("departureDate") ?? "").trim();
    const roomNumber = String(formData.get("roomNumber") ?? "").trim();

    const adultsRaw = Number(String(formData.get("adults") ?? "").trim());
    const childrenRaw = Number(String(formData.get("children") ?? "").trim());
    const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 ? Math.floor(adultsRaw) : 1;
    const children = Number.isFinite(childrenRaw) && childrenRaw >= 0 ? Math.floor(childrenRaw) : 0;

    const priceRaw = parseFloat(String(formData.get("price") ?? "").trim());
    const priceCents = Number.isFinite(priceRaw) && priceRaw >= 0 ? Math.round(priceRaw * 100) : null;

    const response = await fetch(`${backendUrl}/api/v1/staff/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        guestFirstName,
        guestLastName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        arrivalDate,
        departureDate,
        roomNumber: roomNumber || null,
        adults,
        children,
        ...(priceCents !== null ? { priceCents } : {})
      }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, saved: null, new: "1" });
      redirect(`/reservations?${next.toString()}`);
    }

    const id = typeof payload?.stay?.id === "string" ? payload.stay.id : "";
    if (!id) {
      const next = buildSearchParams(searchParams, { error: "invalid_reservation", saved: null, new: "1" });
      redirect(`/reservations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { reservationId: id, new: null, saved: "created", error: null });
    redirect(`/reservations?${next.toString()}`);
  }

  async function updateReservation(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const reservationId = String(formData.get("reservationId") ?? "").trim();
    if (!reservationId) redirect("/reservations");

    const guestFirstName = String(formData.get("guestFirstName") ?? "").trim();
    const guestLastName = String(formData.get("guestLastName") ?? "").trim();
    const guestEmail = String(formData.get("guestEmail") ?? "").trim();
    const guestPhone = String(formData.get("guestPhone") ?? "").trim();

    const arrivalDate = String(formData.get("arrivalDate") ?? "").trim();
    const departureDate = String(formData.get("departureDate") ?? "").trim();
    const roomNumber = String(formData.get("roomNumber") ?? "").trim();

    const adultsRaw = Number(String(formData.get("adults") ?? "").trim());
    const childrenRaw = Number(String(formData.get("children") ?? "").trim());
    const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 ? Math.floor(adultsRaw) : undefined;
    const children = Number.isFinite(childrenRaw) && childrenRaw >= 0 ? Math.floor(childrenRaw) : undefined;

    const response = await fetch(`${backendUrl}/api/v1/staff/reservations/${encodeURIComponent(reservationId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...(guestFirstName ? { guestFirstName } : {}),
        ...(guestLastName ? { guestLastName } : {}),
        ...(guestEmail ? { guestEmail } : {}),
        ...(guestPhone ? { guestPhone } : {}),
        ...(arrivalDate ? { arrivalDate } : {}),
        ...(departureDate ? { departureDate } : {}),
        ...(roomNumber ? { roomNumber } : {}),
        ...(adults !== undefined ? { adults } : {}),
        ...(children !== undefined ? { children } : {})
      }),
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { reservationId, error: errorCode, saved: null });
      redirect(`/reservations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { reservationId, saved: "updated", error: null });
    redirect(`/reservations?${next.toString()}`);
  }

  async function triggerCheckinReminder(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const reservationId = String(formData.get("reservationId") ?? "").trim();
    if (!reservationId) redirect("/reservations");

    const response = await fetch(`${backendUrl}/api/v1/staff/reservations/${encodeURIComponent(reservationId)}/checkin-reminder`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { error: errorCode, saved: null });
      redirect(`/reservations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { saved: "checkin-reminder", error: null });
    redirect(`/reservations?${next.toString()}`);
  }

  async function toggleIdVerification(formData: FormData) {
    "use server";

    const token = requireStaffToken();
    const guestId = String(formData.get("guestId") ?? "").trim();
    const reservationId = String(formData.get("reservationId") ?? "").trim();
    const verified = formData.get("verified") === "true";

    if (!guestId || !reservationId) {
      const next = buildSearchParams(searchParams, { reservationId, error: "missing_guest_id" });
      redirect(`/reservations?${next.toString()}`);
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/guests/${encodeURIComponent(guestId)}/id-verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ verified }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      const next = buildSearchParams(searchParams, { reservationId, error: errorCode });
      redirect(`/reservations?${next.toString()}`);
    }

    const next = buildSearchParams(searchParams, { reservationId, saved: "updated", error: null });
    redirect(`/reservations?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t.appName}</p>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled>
            {t.createGroup}
          </Button>
          {canManage ? (
            <form action={syncFromPms}>
              <Button type="submit" variant="outline">
                {t.syncFromPms}
              </Button>
            </form>
          ) : (
            <Button variant="outline" disabled>
              {t.syncFromPms}
            </Button>
          )}
          {canManage ? (
            <Button asChild>
              <Link href={openNewHref}>{t.addReservation}</Link>
            </Button>
          ) : (
            <Button disabled>{t.addReservation}</Button>
          )}
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.filtersTitle}</CardTitle>
          <CardDescription>{t.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ReservationsFilters />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {searchParams?.saved === "sync" ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {t.syncedFromPms}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const next = new URLSearchParams(baseQuery.toString());
            next.set("status", tab.key);
            return (
              <Button key={tab.key} asChild variant={tab.key === activeStatus ? "secondary" : "ghost"}>
                <Link href={`/reservations?${next.toString()}`}>{tab.label}</Link>
              </Button>
            );
          })}
        </div>
        <Badge variant="secondary">
          {reservations?.total ?? 0} {(reservations?.total ?? 0) === 1 ? t.reservationLabel : t.reservationsLabel}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t.listTitle}</CardTitle>
            <CardDescription>{t.listDescription}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/reservations?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>
                {t.previous}
              </Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link
                href={`/reservations?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}
              >
                {t.next}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.table.guest}</TableHead>
                <TableHead className="hidden md:table-cell">{t.table.phone}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.table.email}</TableHead>
                <TableHead>{t.table.arrival}</TableHead>
                <TableHead>{t.table.departure}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.table.room}</TableHead>
                <TableHead>{t.table.journey}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((reservation) => (
                <TableRow key={reservation.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        <Link href={openDrawerHref(reservation.id)} className="hover:underline">
                          {reservation.guestName?.trim() ? reservation.guestName : t.unlinkedGuest}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        <Link href={openDrawerHref(reservation.id)} className="hover:underline">
                          {reservation.confirmationNumber}
                        </Link>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{reservation.phone ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{reservation.email ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatDate(reservation.arrivalDate)}</TableCell>
                  <TableCell className="text-sm">{formatDate(reservation.departureDate)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{reservation.roomNumber ?? "—"}</TableCell>
                  <TableCell>
                    {reservation.journeyStatus ? (
                      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                        {reservation.journeyStatus}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t.journeyOk}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {t.noReservations}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {wantsNew ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label={t.close} />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">{t.createReservation}</p>
                <h2 className="truncate text-lg font-semibold">{t.newReservation}</h2>
                <p className="text-xs text-muted-foreground">{t.managerAccess}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={closeDrawerHref}>{t.close}</Link>
              </Button>
            </div>

            <div className="space-y-6 p-6">
              {searchParams?.error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {searchParams.error}
                </p>
              ) : null}

              {canManage ? (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">{t.newReservationCardTitle}</CardTitle>
                    <CardDescription>{t.newReservationCardDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={createReservation} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="res-first-name">{t.firstName}</Label>
                          <Input id="res-first-name" name="guestFirstName" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-last-name">{t.lastName}</Label>
                          <Input id="res-last-name" name="guestLastName" required />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="res-email">{t.email}</Label>
                          <Input id="res-email" name="guestEmail" type="email" placeholder={t.optional} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-phone">{t.phone}</Label>
                          <Input id="res-phone" name="guestPhone" placeholder={t.optional} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="res-arrival">{t.arrivalDate}</Label>
                          <Input id="res-arrival" name="arrivalDate" type="date" required defaultValue={getTomorrow()} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-departure">{t.departureDate}</Label>
                          <Input id="res-departure" name="departureDate" type="date" required defaultValue={getDayAfterTomorrow()} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="res-room">{t.room}</Label>
                          <Input id="res-room" name="roomNumber" required placeholder={t.roomPlaceholder} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-adults">{t.adults}</Label>
                          <Input id="res-adults" name="adults" type="number" min="1" defaultValue="1" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-children">{t.children}</Label>
                          <Input id="res-children" name="children" type="number" min="0" defaultValue="0" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="res-price">{t.priceEur}</Label>
                        <Input id="res-price" name="price" type="number" min="0" step="0.01" placeholder={t.pricePlaceholder} />
                      </div>

                      <Button type="submit" className="w-full">
                        {t.createReservation}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">{t.readOnly}</CardTitle>
                    <CardDescription>{t.askManager}</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedReservationId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label={t.close} />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            {reservationDetail ? (
              <>
                <div className="flex items-start justify-between gap-4 border-b p-6">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">{reservationDetail.hotel.name}</p>
                    <h2 className="truncate text-lg font-semibold">
                      {reservationDetail.guest.name ?? t.unlinkedGuest}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">{reservationDetail.stay.confirmationNumber}</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={closeDrawerHref}>{t.close}</Link>
                  </Button>
                </div>

                <div className="space-y-6 p-6">
                  {searchParams?.saved === "checkin-reminder" ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      {t.checkinReminderQueued}
                    </p>
                  ) : null}
                  {searchParams?.saved === "created" ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      {t.reservationCreated}
                    </p>
                  ) : null}
                  {searchParams?.saved === "updated" ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      {t.reservationUpdated}
                    </p>
                  ) : null}
                  {searchParams?.error ? (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {searchParams.error}
                    </p>
                  ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="sm:col-span-2">
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">{t.stayTitle}</CardTitle>
                    <CardDescription>{t.stayDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.status}</p>
                      <p className="text-sm">{reservationDetail.stay.status.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.room}</p>
                      <p className="text-sm">{reservationDetail.stay.roomNumber ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.guests}</p>
                      <p className="text-sm">
                        {reservationDetail.stay.guests.adults}A {reservationDetail.stay.guests.children}C
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.arrival}</p>
                      <p className="text-sm">{formatDate(reservationDetail.stay.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.departure}</p>
                      <p className="text-sm">{formatDate(reservationDetail.stay.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.price}</p>
                      <p className="text-sm">
                        {reservationDetail.stay.priceCents != null
                          ? `${(reservationDetail.stay.priceCents / 100).toFixed(2)} €`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.journey}</p>
                      <p className="text-sm">{reservationDetail.stay.journeyStatus ?? t.journeyOk}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="sm:col-span-2">
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">{t.guestTitle}</CardTitle>
                    <CardDescription>{t.guestDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.email}</p>
                      <p className="text-sm">{reservationDetail.guest.email ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t.phone}</p>
                      <p className="text-sm">{reservationDetail.guest.phone ?? "—"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {reservationDetail.guest.emailVerified ? (
                        <Badge variant="secondary">{t.emailVerified}</Badge>
                      ) : (
                        <Badge variant="outline">{t.emailUnverified}</Badge>
                      )}
                      {reservationDetail.guest.idDocumentVerified ? (
                        <Badge variant="secondary">{t.idVerified}</Badge>
                      ) : (
                        <Badge variant="outline">{t.idNotVerified}</Badge>
                      )}
                    </div>
                    {reservationDetail.guest.id && canManage ? (
                      <div className="mt-3 space-y-3 rounded-md border p-3">
                        <p className="text-xs font-semibold text-muted-foreground">ID Document</p>
                        {reservationDetail.guest.idDocumentUrl ? (
                          <div className="space-y-2">
                            {reservationDetail.guest.idDocumentUrl.startsWith("demo://") ? (
                              <p className="text-xs text-muted-foreground italic">Document uploaded (demo storage)</p>
                            ) : (
                              <img
                                src={reservationDetail.guest.idDocumentUrl}
                                alt="ID Document"
                                className="max-h-48 rounded border object-contain"
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No document uploaded</p>
                        )}
                        <form action={toggleIdVerification}>
                          <input type="hidden" name="guestId" value={reservationDetail.guest.id} />
                          <input type="hidden" name="reservationId" value={reservationDetail.stay.id} />
                          <input
                            type="hidden"
                            name="verified"
                            value={reservationDetail.guest.idDocumentVerified ? "false" : "true"}
                          />
                          <Button type="submit" size="sm" variant={reservationDetail.guest.idDocumentVerified ? "outline" : "default"} className="w-full">
                            {reservationDetail.guest.idDocumentVerified ? "Mark as Unverified" : "Mark as Verified"}
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              {canManage ? (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">{t.editReservationTitle}</CardTitle>
                    <CardDescription>{t.editReservationDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reservationDetail.stay.pmsReservationId ? (
                      <form action={updateReservation} className="space-y-4">
                        <input type="hidden" name="reservationId" value={reservationDetail.stay.id} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-first-name">{t.firstName}</Label>
                            <Input id="edit-first-name" name="guestFirstName" defaultValue={reservationDetail.guest.firstName ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-last-name">{t.lastName}</Label>
                            <Input id="edit-last-name" name="guestLastName" defaultValue={reservationDetail.guest.lastName ?? ""} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-email">{t.email}</Label>
                            <Input id="edit-email" name="guestEmail" type="email" defaultValue={reservationDetail.guest.email ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone">{t.phone}</Label>
                            <Input id="edit-phone" name="guestPhone" defaultValue={reservationDetail.guest.phone ?? ""} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-arrival">{t.arrivalDate}</Label>
                            <Input id="edit-arrival" name="arrivalDate" type="date" defaultValue={toDateInputValue(reservationDetail.stay.checkIn)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-departure">{t.departureDate}</Label>
                            <Input id="edit-departure" name="departureDate" type="date" defaultValue={toDateInputValue(reservationDetail.stay.checkOut)} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="edit-room">{t.room}</Label>
                            <Input id="edit-room" name="roomNumber" defaultValue={reservationDetail.stay.roomNumber ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-adults">{t.adults}</Label>
                            <Input
                              id="edit-adults"
                              name="adults"
                              type="number"
                              min="1"
                              defaultValue={String(reservationDetail.stay.guests.adults)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-children">{t.children}</Label>
                            <Input
                              id="edit-children"
                              name="children"
                              type="number"
                              min="0"
                              defaultValue={String(reservationDetail.stay.guests.children)}
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          {t.saveChanges}
                        </Button>
                      </form>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.noPmsReference}</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/inbox?stayId=${encodeURIComponent(reservationDetail.stay.id)}`}>{t.openConversation}</Link>
                </Button>
                <form action={triggerCheckinReminder}>
                  <input type="hidden" name="reservationId" value={reservationDetail.stay.id} />
                  <Button type="submit">{t.triggerCheckinReminder}</Button>
                </form>
                <Button variant="outline" asChild>
                  <Link href={`/payment-links?new=1&stayId=${encodeURIComponent(reservationDetail.stay.id)}`}>
                    {t.createPaymentLink}
                  </Link>
                </Button>
              </div>

              <Card>
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="text-base">{t.linkedRequestsTitle}</CardTitle>
                  <CardDescription>{t.linkedRequestsDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reservationDetail.links.tickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.noLinkedRequests}</p>
                  ) : (
                    reservationDetail.links.tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            <Link href={`/requests/${encodeURIComponent(ticket.id)}`} className="hover:underline">
                              {ticket.title}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{ticket.id}</span> · {ticket.department} ·{" "}
                            {ticket.status.replace("_", " ")}
                          </p>
                        </div>
                        <Badge variant="outline">{ticket.status.replace("_", " ")}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="text-base">{t.linkedMessagesTitle}</CardTitle>
                  <CardDescription>{t.linkedMessagesDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reservationDetail.links.threads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.noLinkedMessages}</p>
                  ) : (
                    reservationDetail.links.threads.map((thread) => (
                      <div key={thread.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            <Link href={`/inbox?conversationId=${encodeURIComponent(thread.id)}`} className="hover:underline">
                              {thread.title}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{thread.id}</span> · {thread.department} ·{" "}
                            {thread.status.replace("_", " ")}
                          </p>
                        </div>
                        <Badge variant="outline">{thread.status.replace("_", " ")}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
                </div>
              </>
            ) : (
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">{t.appName}</p>
                    <h2 className="truncate text-lg font-semibold">{t.reservationNotAvailable}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedReservationId}</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={closeDrawerHref}>{t.close}</Link>
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t.unableToLoadReservation}</CardTitle>
                    <CardDescription>{t.unableToLoadReservationDescription}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
