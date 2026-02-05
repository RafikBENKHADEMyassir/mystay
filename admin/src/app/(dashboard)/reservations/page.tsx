import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationsFilters } from "@/components/reservations/reservations-filters";
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
    error = "Backend unreachable. Start `npm run dev:backend` (and `npm run db:reset` once) then refresh.";
  }

  const items = reservations?.items ?? [];
  const page = reservations?.page ?? 1;
  const totalPages = reservations?.totalPages ?? 1;

  const tabs = [
    { key: "arrivals", label: "Arrivals" },
    { key: "checked_in", label: "Checked-in" },
    { key: "checked_out", label: "Checked-out" },
    { key: "cancelled", label: "Cancelled" }
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
        children
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="text-sm text-muted-foreground">Arrivals, in-house guests, and departures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled>
            Create group
          </Button>
          {canManage ? (
            <form action={syncFromPms}>
              <Button type="submit" variant="outline">
                Sync from PMS
              </Button>
            </form>
          ) : (
            <Button variant="outline" disabled>
              Sync from PMS
            </Button>
          )}
          {canManage ? (
            <Button asChild>
              <Link href={openNewHref}>Add reservation</Link>
            </Button>
          ) : (
            <Button disabled>Add reservation</Button>
          )}
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Arrival/departure window plus guest/booking search.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ReservationsFilters />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {searchParams?.saved === "sync" ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Reservations synced from PMS.
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
          {reservations?.total ?? 0} reservation{(reservations?.total ?? 0) === 1 ? "" : "s"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">List</CardTitle>
            <CardDescription>Click a row to open the reservation drawer.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/reservations?${buildSearchParams(searchParams, { page: String(Math.max(1, page - 1)) }).toString()}`}>
                Previous
              </Link>
            </Button>
            <Badge variant="outline" className="font-mono">
              {page}/{totalPages}
            </Badge>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link
                href={`/reservations?${buildSearchParams(searchParams, { page: String(Math.min(totalPages, page + 1)) }).toString()}`}
              >
                Next
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead className="hidden sm:table-cell">Room</TableHead>
                <TableHead>Journey</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((reservation) => (
                <TableRow key={reservation.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        <Link href={openDrawerHref(reservation.id)} className="hover:underline">
                          {reservation.guestName?.trim() ? reservation.guestName : "Unlinked guest"}
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
                  <TableCell className="text-sm">{reservation.arrivalDate}</TableCell>
                  <TableCell className="text-sm">{reservation.departureDate}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{reservation.roomNumber ?? "—"}</TableCell>
                  <TableCell>
                    {reservation.journeyStatus ? (
                      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                        {reservation.journeyStatus}
                      </Badge>
                    ) : (
                      <Badge variant="outline">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No reservations match the current filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {wantsNew ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label="Close" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">Create reservation</p>
                <h2 className="truncate text-lg font-semibold">New reservation</h2>
                <p className="text-xs text-muted-foreground">Manager access</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={closeDrawerHref}>Close</Link>
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
                    <CardTitle className="text-base">New reservation</CardTitle>
                    <CardDescription>Creates a reservation in the PMS, then syncs it into MyStay.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={createReservation} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="res-first-name">First name</Label>
                          <Input id="res-first-name" name="guestFirstName" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-last-name">Last name</Label>
                          <Input id="res-last-name" name="guestLastName" required />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="res-email">Email</Label>
                          <Input id="res-email" name="guestEmail" type="email" placeholder="optional" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-phone">Phone</Label>
                          <Input id="res-phone" name="guestPhone" placeholder="optional" />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="res-arrival">Arrival date</Label>
                          <Input id="res-arrival" name="arrivalDate" type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-departure">Departure date</Label>
                          <Input id="res-departure" name="departureDate" type="date" required />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="res-room">Room</Label>
                          <Input id="res-room" name="roomNumber" placeholder="optional" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-adults">Adults</Label>
                          <Input id="res-adults" name="adults" type="number" min="1" defaultValue="1" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-children">Children</Label>
                          <Input id="res-children" name="children" type="number" min="0" defaultValue="0" />
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        Create reservation
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">Read-only</CardTitle>
                    <CardDescription>Ask a manager to create reservations.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedReservationId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <Link href={closeDrawerHref} className="absolute inset-0 bg-background/60 backdrop-blur" aria-label="Close" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-xl">
            {reservationDetail ? (
              <>
                <div className="flex items-start justify-between gap-4 border-b p-6">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">{reservationDetail.hotel.name}</p>
                    <h2 className="truncate text-lg font-semibold">
                      {reservationDetail.guest.name ?? "Unlinked guest"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">{reservationDetail.stay.confirmationNumber}</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={closeDrawerHref}>Close</Link>
                  </Button>
                </div>

                <div className="space-y-6 p-6">
                  {searchParams?.saved === "checkin-reminder" ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Check-in reminder queued in notifications outbox.
                    </p>
                  ) : null}
                  {searchParams?.saved === "created" ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Reservation created in PMS.
                    </p>
                  ) : null}
                  {searchParams?.saved === "updated" ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Reservation updated in PMS.
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
                    <CardTitle className="text-base">Stay</CardTitle>
                    <CardDescription>Reservation and room details.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Status</p>
                      <p className="text-sm">{reservationDetail.stay.status.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Room</p>
                      <p className="text-sm">{reservationDetail.stay.roomNumber ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Guests</p>
                      <p className="text-sm">
                        {reservationDetail.stay.guests.adults}A {reservationDetail.stay.guests.children}C
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Arrival</p>
                      <p className="text-sm">{reservationDetail.stay.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Departure</p>
                      <p className="text-sm">{reservationDetail.stay.checkOut}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Journey</p>
                      <p className="text-sm">{reservationDetail.stay.journeyStatus ?? "OK"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="sm:col-span-2">
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">Guest</CardTitle>
                    <CardDescription>Profile and contact information.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Email</p>
                      <p className="text-sm">{reservationDetail.guest.email ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Phone</p>
                      <p className="text-sm">{reservationDetail.guest.phone ?? "—"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {reservationDetail.guest.emailVerified ? (
                        <Badge variant="secondary">Email verified</Badge>
                      ) : (
                        <Badge variant="outline">Email unverified</Badge>
                      )}
                      {reservationDetail.guest.idDocumentVerified ? (
                        <Badge variant="secondary">ID verified</Badge>
                      ) : (
                        <Badge variant="outline">ID not verified</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {canManage ? (
                <Card>
                  <CardHeader className="space-y-1 pb-3">
                    <CardTitle className="text-base">Edit reservation</CardTitle>
                    <CardDescription>Updates the reservation in the PMS and syncs back into MyStay.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reservationDetail.stay.pmsReservationId ? (
                      <form action={updateReservation} className="space-y-4">
                        <input type="hidden" name="reservationId" value={reservationDetail.stay.id} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-first-name">First name</Label>
                            <Input id="edit-first-name" name="guestFirstName" defaultValue={reservationDetail.guest.firstName ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-last-name">Last name</Label>
                            <Input id="edit-last-name" name="guestLastName" defaultValue={reservationDetail.guest.lastName ?? ""} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" name="guestEmail" type="email" defaultValue={reservationDetail.guest.email ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input id="edit-phone" name="guestPhone" defaultValue={reservationDetail.guest.phone ?? ""} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-arrival">Arrival date</Label>
                            <Input id="edit-arrival" name="arrivalDate" type="date" defaultValue={reservationDetail.stay.checkIn} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-departure">Departure date</Label>
                            <Input id="edit-departure" name="departureDate" type="date" defaultValue={reservationDetail.stay.checkOut} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="edit-room">Room</Label>
                            <Input id="edit-room" name="roomNumber" defaultValue={reservationDetail.stay.roomNumber ?? ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-adults">Adults</Label>
                            <Input
                              id="edit-adults"
                              name="adults"
                              type="number"
                              min="1"
                              defaultValue={String(reservationDetail.stay.guests.adults)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-children">Children</Label>
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
                          Save changes
                        </Button>
                      </form>
                    ) : (
                      <p className="text-sm text-muted-foreground">No PMS reference yet. Click “Sync from PMS” first.</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/inbox?stayId=${encodeURIComponent(reservationDetail.stay.id)}`}>Open conversation</Link>
                </Button>
                <form action={triggerCheckinReminder}>
                  <input type="hidden" name="reservationId" value={reservationDetail.stay.id} />
                  <Button type="submit">Trigger check-in reminder</Button>
                </form>
                <Button variant="outline" asChild>
                  <Link href={`/payment-links?new=1&stayId=${encodeURIComponent(reservationDetail.stay.id)}`}>
                    Create payment link
                  </Link>
                </Button>
              </div>

              <Card>
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="text-base">Linked requests</CardTitle>
                  <CardDescription>Tickets created during the stay.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reservationDetail.links.tickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tickets linked to this stay yet.</p>
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
                  <CardTitle className="text-base">Linked messages</CardTitle>
                  <CardDescription>Guest conversations for this stay.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reservationDetail.links.threads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No threads linked to this stay yet.</p>
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
                    <p className="text-xs text-muted-foreground">MyStay Admin</p>
                    <h2 className="truncate text-lg font-semibold">Reservation not available</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedReservationId}</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={closeDrawerHref}>Close</Link>
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Unable to load reservation</CardTitle>
                    <CardDescription>It may have been removed or you do not have access.</CardDescription>
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
