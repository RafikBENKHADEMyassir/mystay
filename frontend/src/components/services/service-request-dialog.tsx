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
        setSubmitMessage("Votre demande a été envoyée avec succès !");
      } else {
        setSubmitState("error");
        setSubmitMessage(result.error || "Échec de l'envoi. Veuillez réessayer.");
      }
    } catch {
      setSubmitState("error");
      setSubmitMessage("Une erreur inattendue s'est produite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!serviceItem) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl border-0 bg-white px-0">
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <SheetHeader className="px-6 pb-4 text-left border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold text-gray-900">
                {serviceItem.nameDefault}
              </SheetTitle>
              <SheetDescription className="mt-1 text-gray-500">
                {serviceItem.descriptionDefault}
              </SheetDescription>
            </div>
            <button 
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </SheetHeader>

        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 200px)" }}>
          {submitState === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Demande envoyée !</h3>
              <p className="mb-4 text-sm text-gray-500">{submitMessage}</p>
              {ticketId && (
                <p className="mb-4 text-xs text-gray-400">
                  Référence : <span className="font-mono">{ticketId}</span>
                </p>
              )}
              {serviceItem.estimatedTimeMinutes && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-2">
                  <Clock className="h-4 w-4" />
                  <span>Temps estimé : ~{serviceItem.estimatedTimeMinutes} min</span>
                </div>
              )}
              <button 
                onClick={handleClose}
                className="mt-6 rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white"
              >
                Terminé
              </button>
            </div>
          ) : submitState === "error" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Échec de l'envoi</h3>
              <p className="mb-6 text-sm text-gray-500">{submitMessage}</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleClose}
                  className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => setSubmitState("idle")}
                  className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white"
                >
                  Réessayer
                </button>
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
