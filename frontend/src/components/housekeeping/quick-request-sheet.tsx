"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  itemId: string;
  itemLabel: string;
  onClose: () => void;
  onSubmit: (itemId: string, quantity: number, notes: string) => Promise<void>;
};

const ITEM_IMAGE_POSITIONS: Record<
  string,
  { left: string; right: string; top: string }
> = {
  shampoo: { left: "-67.5%", right: "-220.2%", top: "calc(50% + 42.32px)" },
  pillows: { left: "-158.68%", right: "-57.02%", top: "calc(50% + 33.58px)" },
  toilet_paper: {
    left: "-56.97%",
    right: "-202.39%",
    top: "calc(50% - 25.3px)",
  },
  towels: { left: "-160.97%", right: "-58.59%", top: "calc(50% - 24.79px)" },
};

function ProductImage({ itemId }: { itemId: string }) {
  const pos = ITEM_IMAGE_POSITIONS[itemId];
  if (!pos) return null;

  return (
    <div className="relative h-[60px] w-[67px] shrink-0">
      <div className="absolute left-0 top-0 h-[60px] w-[60px] overflow-hidden bg-white">
        <div
          className="absolute"
          style={{
            aspectRatio: "1536/1024",
            left: pos.left,
            right: pos.right,
            top: pos.top,
            transform: "translateY(-50%)",
          }}
        >
          <Image
            src="/images/housekeeping/items-photo.png"
            alt=""
            fill
            className="max-w-none object-cover pointer-events-none"
            sizes="240px"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

export function QuickRequestSheet({
  itemId,
  itemLabel,
  onClose,
  onSubmit,
}: Props) {
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (quantity < 1 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(itemId, quantity, notes.trim());
      handleClose();
    } catch {
      setIsSubmitting(false);
    }
  }, [itemId, quantity, notes, isSubmitting, onSubmit, handleClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative z-[101] mt-auto flex flex-col rounded-t-[16px] bg-white px-[8px] pb-[24px] pt-[8px] transition-transform duration-300 ease-out",
          isClosing
            ? "translate-y-full"
            : "animate-in slide-in-from-bottom duration-300"
        )}
      >
        <div className="overflow-hidden rounded-[16px] bg-white py-[32px]">
          {/* Drag handle */}
          <div className="absolute left-1/2 top-[16px] h-[3px] w-[36px] -translate-x-1/2 rounded-full bg-black/15" />

          {/* Product image + name */}
          <div className="flex flex-col items-center gap-[6px] px-[16px] pb-[32px]">
            <ProductImage itemId={itemId} />
            <p className="text-[18px] font-normal text-black">{itemLabel}</p>
          </div>

          {/* Quantity selector */}
          <div className="px-[16px]">
            <div className="flex items-center rounded-[6px] border border-black/10 px-[12px] py-[14px]">
              <span className="flex-1 text-[15px] text-black/50">
                Quantité
              </span>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                  className={cn(
                    "flex h-[28px] w-[28px] items-center justify-center",
                    quantity === 0 && "opacity-25"
                  )}
                  disabled={quantity === 0}
                >
                  <Image
                    src="/images/housekeeping/remove-btn.svg"
                    alt="Remove"
                    width={28}
                    height={28}
                    unoptimized
                  />
                </button>
                <span className="flex w-[24px] items-center justify-center text-[18px] text-black/50">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-[28px] w-[28px] items-center justify-center"
                >
                  <Image
                    src="/images/housekeeping/add-btn.svg"
                    alt="Add"
                    width={28}
                    height={28}
                    unoptimized
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Special request */}
          <div className="flex flex-col gap-[8px] px-[16px] pt-[24px]">
            <p className="text-[15px] text-black">
              Vous avez des demandes spéciales ?
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Votre demande"
              className="min-h-[80px] w-full resize-none rounded-[8px] bg-[#f5f5f5] p-[16px] text-[16px] text-black placeholder:text-black/30 focus:outline-none"
            />
          </div>

          {/* Submit button */}
          <div className="px-[16px] pt-[24px]">
            <button
              onClick={() => void handleSubmit()}
              disabled={quantity < 1 || isSubmitting}
              className={cn(
                "w-full rounded-[6px] p-[12px] text-center text-[14px] font-medium text-white transition-colors",
                quantity >= 1 && !isSubmitting
                  ? "bg-black"
                  : "cursor-not-allowed bg-black/30"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </span>
              ) : (
                "Demander"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
