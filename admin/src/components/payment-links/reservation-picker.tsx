"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ReservationOption = {
  id: string;
  guestId: string | null;
  confirmationNumber: string;
  guestName: string;
  roomNumber: string | null;
  arrivalDate: string;
  departureDate: string;
  status: string;
  journeyStatus: string | null;
};

type ReservationPickerProps = {
  initialReservation?: ReservationOption | null;
};

type ReservationsResponse = {
  items?: ReservationOption[];
};

export function ReservationPicker({ initialReservation }: ReservationPickerProps) {
  const [selected, setSelected] = useState<ReservationOption | null>(initialReservation ?? null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReservationOption[]>([]);

  useEffect(() => {
    setSelected(initialReservation ?? null);
  }, [initialReservation]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!open) return;
    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("search", trimmedQuery);
        params.set("pageSize", "8");
        params.set("page", "1");
        const response = await fetch(`/api/staff/reservations?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = (await response.json().catch(() => null)) as ReservationsResponse | null;
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setResults(items);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [open, trimmedQuery]);

  const statusBadge = useMemo(() => {
    if (!selected?.status) return null;
    const value = selected.status.replace("_", " ");
    return <Badge variant="outline">{value}</Badge>;
  }, [selected?.status]);

  return (
    <div className="space-y-2">
      <Label htmlFor="paymentlink-reservation">Guest / reservation</Label>
      <input type="hidden" name="stayId" value={selected?.id ?? ""} />
      <input type="hidden" name="guestId" value={selected?.guestId ?? ""} />

      {selected ? (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold">{selected.guestName || "Unlinked guest"}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {selected.confirmationNumber}
              {selected.roomNumber ? ` · Room ${selected.roomNumber}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge}
              {selected.journeyStatus ? (
                <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                  {selected.journeyStatus}
                </Badge>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelected(null);
              setQuery("");
              setResults([]);
              setOpen(true);
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            id="paymentlink-reservation"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search guest name or booking number"
          />

          {open ? (
            <div className="rounded-md border bg-background shadow-sm">
              {loading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No matches.</p>
              ) : (
                <ul className="max-h-64 overflow-auto py-1">
                  {results.map((reservation) => (
                    <li key={reservation.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent/30"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSelected(reservation);
                          setQuery("");
                          setResults([]);
                          setOpen(false);
                        }}
                      >
                        <p className="truncate text-sm font-medium">{reservation.guestName || "Unlinked guest"}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {reservation.confirmationNumber}
                          {reservation.roomNumber ? ` · Room ${reservation.roomNumber}` : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

