"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { interpolateTemplate } from "@/lib/guest-content";

type WellnessBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestToken: string;
  hotelId: string;
  stayId: string;
  roomNumber?: string | null;
  service: {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: "spa" | "gym";
  } | null;
  timeSlots: string[];
  content: {
    titleTemplate: string;
    descriptionTemplate: string;
    dateLabel: string;
    timeLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    cancel: string;
    submit: string;
    submitting: string;
    done: string;
    referenceLabel: string;
    successTitle: string;
    successMessage: string;
    errorTitle: string;
    ticketTitleTemplate: string;
    errors: {
      missingDateTime: string;
      submitFailed: string;
      serviceUnavailable: string;
    };
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function WellnessBookingDialog({
  open,
  onOpenChange,
  guestToken,
  hotelId,
  stayId,
  roomNumber,
  service,
  timeSlots,
  content,
}: WellnessBookingDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setDate(tomorrow.toISOString().slice(0, 10));
    setTime(timeSlots[0] ?? "");
    setNotes("");
    setStatus("idle");
    setErrorMessage("");
    setTicketId("");
  }, [open, timeSlots]);

  const title = useMemo(() => {
    if (!service) return "";
    return interpolateTemplate(content.titleTemplate, { serviceName: service.name });
  }, [content.titleTemplate, service]);

  const description = useMemo(() => {
    if (!service) return "";
    return interpolateTemplate(content.descriptionTemplate, { serviceName: service.name });
  }, [content.descriptionTemplate, service]);

  async function handleSubmit() {
    if (!service || isSubmitting) return;

    if (!date || !time) {
      setStatus("error");
      setErrorMessage(content.errors.missingDateTime);
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(new URL("/api/v1/tickets", apiBaseUrl).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          hotelId,
          stayId,
          roomNumber: roomNumber ?? "",
          department: "spa-gym",
          title: interpolateTemplate(content.ticketTitleTemplate, {
            serviceName: service.name,
            date,
            time,
          }),
          payload: {
            type: "wellness_booking",
            category: service.category,
            serviceId: service.id,
            serviceName: service.name,
            description: service.description,
            duration: service.duration,
            price: service.price,
            date,
            time,
            notes,
          },
        }),
      });

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(content.errors.submitFailed);
        return;
      }

      const result = (await response.json()) as { id?: string };
      setTicketId(result.id ?? "");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(content.errors.serviceUnavailable);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-black/10 p-5">
        {status === "success" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-black">{content.successTitle}</DialogTitle>
              <DialogDescription className="text-sm text-black/60">{content.successMessage}</DialogDescription>
            </DialogHeader>

            {ticketId ? (
              <p className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black/70">
                {content.referenceLabel}: <span className="font-mono text-black">{ticketId}</span>
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
                {content.done}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-black">{title}</DialogTitle>
              <DialogDescription className="text-sm text-black/60">{description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-black/80">{content.dateLabel}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="h-11 rounded-md border border-black/10 px-3 text-sm text-black focus:border-black/30 focus:outline-none"
                />
              </label>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-black/80">{content.timeLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={[
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        time === slot
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black/70",
                      ].join(" ")}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-black/80">{content.notesLabel}</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder={content.notesPlaceholder}
                  className="rounded-md border border-black/10 px-3 py-2 text-sm text-black focus:border-black/30 focus:outline-none"
                />
              </label>

              {status === "error" ? (
                <p className="rounded-md border border-[#b7092633] bg-[#b7092612] px-3 py-2 text-sm text-[#b70926]">
                  <strong>{content.errorTitle}</strong> {errorMessage}
                </p>
              ) : null}
            </div>

            <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {content.cancel}
              </Button>
              <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? content.submitting : content.submit}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
