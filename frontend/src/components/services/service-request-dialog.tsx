"use client";

import { useState } from "react";
import { X, Clock, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ServiceRequestForm, ServiceItem } from "./service-request-form";

type ServiceRequestDialogProps = {
  serviceItem: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceItem: ServiceItem, formData: Record<string, unknown>) => Promise<{ success: boolean; ticketId?: string; error?: string }>;
};

export function ServiceRequestDialog({
  serviceItem,
  isOpen,
  onClose,
  onSubmit
}: ServiceRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleClose = () => {
    setSubmitState("idle");
    setSubmitMessage(null);
    setTicketId(null);
    onClose();
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!serviceItem) return;
    
    setIsSubmitting(true);
    setSubmitState("idle");
    setSubmitMessage(null);

    try {
      const result = await onSubmit(serviceItem, formData);
      
      if (result.success) {
        setSubmitState("success");
        setTicketId(result.ticketId || null);
        setSubmitMessage("Your request has been submitted successfully!");
      } else {
        setSubmitState("error");
        setSubmitMessage(result.error || "Failed to submit request. Please try again.");
      }
    } catch {
      setSubmitState("error");
      setSubmitMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!serviceItem) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl sm:max-w-lg sm:mx-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {serviceItem.nameDefault}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            {serviceItem.descriptionDefault}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 overflow-y-auto pr-2" style={{ maxHeight: "calc(85vh - 150px)" }}>
          {submitState === "success" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Request Submitted!</h3>
              <p className="mb-4 text-sm text-muted-foreground">{submitMessage}</p>
              {ticketId && (
                <p className="mb-4 text-xs text-muted-foreground">
                  Request ID: <span className="font-mono">{ticketId}</span>
                </p>
              )}
              {serviceItem.estimatedTimeMinutes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated time: ~{serviceItem.estimatedTimeMinutes} min</span>
                </div>
              )}
              <Button className="mt-6" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : submitState === "error" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Request Failed</h3>
              <p className="mb-6 text-sm text-muted-foreground">{submitMessage}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => setSubmitState("idle")}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <ServiceRequestForm
              serviceItem={serviceItem}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
