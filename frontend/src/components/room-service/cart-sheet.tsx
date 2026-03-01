"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Props = {
  items: CartItem[];
  roomNumber: string | null;
  currencySymbol: string;
  isOrdering: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onSubmit: (notes: string, deliveryRoom?: string) => void;
  onClose: () => void;
};

function formatPrice(price: number, currencySymbol: string): string {
  const formatted = price.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencySymbol}`;
}

export function CartSheet({
  items,
  roomNumber,
  currencySymbol,
  isOrdering,
  onUpdateQuantity,
  onSubmit,
  onClose,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<"cart" | "change-room">("cart");
  const [notes, setNotes] = useState("");
  const [deliveryRoom, setDeliveryRoom] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (view === "change-room") {
      const trimmed = deliveryRoom.trim();
      if (!trimmed) {
        setRoomError("Ce numéro de chambre est invalide.");
        return;
      }
      onSubmit(notes, trimmed);
    } else {
      onSubmit(notes);
    }
  }, [view, deliveryRoom, notes, onSubmit]);

  const handleChangeRoomClick = useCallback(() => {
    setRoomError(null);
    setDeliveryRoom("");
    setView("change-room");
  }, []);

  const handleBackFromChangeRoom = useCallback(() => {
    setRoomError(null);
    setView("cart");
  }, []);

  const validateAndSubmitFromChangeRoom = useCallback(() => {
    const trimmed = deliveryRoom.trim();
    if (!trimmed) {
      setRoomError("Ce numéro de chambre est invalide.");
      return;
    }
    setRoomError(null);
    onSubmit(notes, trimmed);
  }, [deliveryRoom, notes, onSubmit]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" data-testid="cart-sheet">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative z-[101] mt-auto flex max-h-[92vh] flex-col rounded-t-[20px] bg-white transition-transform duration-300 ease-out",
          isClosing ? "translate-y-full" : "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Drag handle: 36px wide, 3px tall gray pill */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div className="h-[3px] w-9 rounded-full bg-gray-300" />
        </div>

        {view === "cart" ? (
          <CartView
            items={items}
            roomNumber={roomNumber}
            currencySymbol={currencySymbol}
            total={total}
            notes={notes}
            onNotesChange={setNotes}
            isOrdering={isOrdering}
            onUpdateQuantity={onUpdateQuantity}
            onSubmit={handleSubmit}
            onChangeRoomClick={handleChangeRoomClick}
          />
        ) : (
          <ChangeRoomView
            deliveryRoom={deliveryRoom}
            onDeliveryRoomChange={(v) => {
              setDeliveryRoom(v);
              setRoomError(null);
            }}
            roomError={roomError}
            isOrdering={isOrdering}
            onBack={handleBackFromChangeRoom}
            onSubmit={validateAndSubmitFromChangeRoom}
          />
        )}
      </div>
    </div>
  );
}

type CartViewProps = {
  items: CartItem[];
  roomNumber: string | null;
  currencySymbol: string;
  total: number;
  notes: string;
  onNotesChange: (v: string) => void;
  isOrdering: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onSubmit: () => void;
  onChangeRoomClick: () => void;
};

function CartView({
  items,
  roomNumber,
  currencySymbol,
  total,
  notes,
  onNotesChange,
  isOrdering,
  onUpdateQuantity,
  onSubmit,
  onChangeRoomClick,
}: CartViewProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-6">
      {/* Title */}
      <h2 className="pb-8 pt-4 text-center text-[18px] font-normal text-black">
        Votre panier Room Service
      </h2>

      {/* Cart items card */}
      <div className="rounded-[6px] border border-black/[0.06] bg-white p-3 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-normal text-black">{item.name}</p>
                <p className="mt-0.5 text-[15px] font-normal text-black/50">
                  {item.quantity > 1
                    ? `${item.quantity} × ${formatPrice(item.price, currencySymbol)}`
                    : formatPrice(item.price, currencySymbol)}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  disabled={isOrdering}
                  className="flex h-8 w-8 items-center justify-center"
                  aria-label="Réduire la quantité"
                >
                  <Image
                    src="/images/room-service/remove-btn.svg"
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                  />
                </button>
                <span className="w-6 text-center text-[15px] font-normal text-black">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  disabled={isOrdering}
                  className="flex h-8 w-8 items-center justify-center"
                  aria-label="Augmenter la quantité"
                >
                  <Image
                    src="/images/room-service/add-btn.svg"
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div
          className="my-4 h-[2px] rounded-full"
          style={{ backgroundColor: "rgba(204, 204, 204, 0.25)" }}
        />

        {/* Total row */}
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-normal text-black/50">Total</span>
          <span className="text-[20px] font-normal text-black">
            {formatPrice(total, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Delivery room card */}
      <div className="mt-4 rounded-[6px] border border-black/[0.06] bg-white p-3 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]">
        <p className="text-[15px] font-normal text-black">
          La commande en cours arrivera à la chambre {roomNumber ?? "—"}.
        </p>
        <button
          onClick={onChangeRoomClick}
          className="mt-2 flex items-center gap-1 text-[14px] font-medium text-black/50 underline"
        >
          Faire livrer à une autre chambre
          <Image
            src="/images/room-service/chevron-small.svg"
            alt=""
            width={6}
            height={11}
            unoptimized
          />
        </button>
      </div>

      {/* Special request */}
      <div className="mt-4">
        <p className="mb-2 text-[15px] font-normal text-black">
          Vous avez des demandes spéciales ?
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Votre demande"
          disabled={isOrdering}
          className="min-h-[80px] w-full resize-none rounded-[8px] bg-[#f5f5f5] p-4 text-[15px] text-black placeholder:text-black/30 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Commander button */}
      <button
        onClick={onSubmit}
        disabled={items.length === 0 || isOrdering}
        className={cn(
          "mt-4 w-full rounded-[6px] py-3.5 text-[14px] font-medium text-white transition-colors",
          items.length > 0 && !isOrdering
            ? "bg-black hover:bg-black/90"
            : "cursor-not-allowed bg-black/30"
        )}
      >
        {isOrdering ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </span>
        ) : (
          "Commander"
        )}
      </button>

      {/* Terms */}
      <p className="mt-3 text-center text-[13px] font-normal text-black/50">
        En commandant, vous acceptez les Conditions d&apos;utilisation.
      </p>
    </div>
  );
}

type ChangeRoomViewProps = {
  deliveryRoom: string;
  onDeliveryRoomChange: (v: string) => void;
  roomError: string | null;
  isOrdering: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

function ChangeRoomView({
  deliveryRoom,
  onDeliveryRoomChange,
  roomError,
  isOrdering,
  onBack,
  onSubmit,
}: ChangeRoomViewProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-8">
      {/* Header with back arrow */}
      <div className="relative mb-2 flex items-center justify-between px-2 py-2">
        <button
          onClick={onBack}
          className="flex h-[36px] items-center justify-center rounded-[8px] p-[8px]"
          aria-label="Retour"
        >
          <Image
            src="/images/housekeeping/arrow-back.svg"
            alt=""
            width={26}
            height={26}
            unoptimized
            className="invert"
          />
        </button>
        <div className="w-[36px]" />
      </div>

      <div className="flex flex-col items-center gap-[6px] pb-8">
        <p className="text-[15px] font-normal text-black/50">Room Service</p>
        <h2 className="text-center text-[18px] font-normal text-black">
          Faire livrer à une autre chambre
        </h2>
      </div>

      {/* Room number card */}
      <div className="rounded-[6px] border border-black/[0.06] bg-white px-3 py-4 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]">
        <p className="mb-4 text-[15px] font-medium text-black">
          Insérez le numéro de chambre
        </p>
        <div
          className={cn(
            "rounded-[8px] border bg-[#f5f5f5] px-4 pb-[14px] pt-[26px]",
            roomError ? "border-red-500" : "border-transparent"
          )}
        >
          <label className="absolute -mt-[18px] text-[13px] text-black/50">
            Numéro de chambre
          </label>
          <input
            type="text"
            value={deliveryRoom}
            onChange={(e) => onDeliveryRoomChange(e.target.value)}
            disabled={isOrdering}
            className="w-full bg-transparent text-[16px] text-black focus:outline-none disabled:opacity-60"
          />
        </div>
        {roomError && (
          <p className="mt-2 text-[13px] font-normal text-red-500">{roomError}</p>
        )}
      </div>

      {/* Commander button */}
      <div className="mt-6 px-0">
        <button
          onClick={onSubmit}
          disabled={isOrdering}
          className={cn(
            "w-full rounded-[6px] p-[12px] text-center text-[14px] font-medium text-white transition-colors",
            !isOrdering ? "bg-black" : "cursor-not-allowed bg-black/30"
          )}
        >
          {isOrdering ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          ) : (
            "Commander"
          )}
        </button>
      </div>
    </div>
  );
}
