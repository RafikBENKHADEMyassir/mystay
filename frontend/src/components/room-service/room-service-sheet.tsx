"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Minus, Plus, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  tags?: string[];
};

type Category = {
  id: string;
  label: string;
};

type CartItem = MenuItem & { quantity: number };

type Props = {
  hotelId: string;
  stayId?: string | null;
  roomNumber?: string | null;
  guestToken: string;
  categories: Category[];
  menuItems: MenuItem[];
  currencySymbol?: string;
  labels?: {
    title?: string;
    placeOrder?: string;
    placingOrder?: string;
    itemCount?: string;
    orderButton?: string;
  };
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type SheetState = "menu" | "loading" | "success";

export function RoomServiceSheet({
  hotelId,
  stayId,
  roomNumber,
  guestToken,
  categories,
  menuItems,
  currencySymbol = "EUR",
  labels,
  onClose,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>("menu");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [menuItems, activeCategory]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((current) => {
      const existing = current.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return current.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return current.filter((i) => i.id !== itemId);
    });
  }

  function getCartQuantity(itemId: string): number {
    return cart.find((i) => i.id === itemId)?.quantity ?? 0;
  }

  const handleOrder = useCallback(async () => {
    if (cart.length === 0) return;
    setSheetState("loading");

    try {
      const orderSummary = cart
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(", ");

      const res = await fetch(`${API_BASE}/api/v1/services/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          hotelId,
          stayId,
          roomNumber,
          department: "room_service",
          title: `Room Service: ${orderSummary.slice(0, 80)}`,
          payload: {
            items: cart.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total: cartTotal,
          },
        }),
      });

      if (res.ok) {
        setSheetState("success");
      } else {
        setSheetState("menu");
      }
    } catch {
      setSheetState("menu");
    }
  }, [cart, cartTotal, guestToken, hotelId, stayId, roomNumber]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      data-testid="room-service-sheet"
    >
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
          isClosing
            ? "translate-y-full"
            : "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Handle */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-9 rounded-full bg-gray-300" />
        </div>

        {sheetState === "success" ? (
          <SuccessView onClose={handleClose} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {labels?.title ?? "Room Service"}
              </h2>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition",
                    activeCategory === cat.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div
              className="flex-1 overflow-y-auto px-5 pb-4"
              data-testid="room-service-items"
            >
              <div className="space-y-2.5">
                {filteredItems.map((item) => {
                  const quantity = getCartQuantity(item.id);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-[12px] border border-black/[0.06] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    >
                      {item.image && (
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-gray-900">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-[12px] text-gray-400">
                            {item.description}
                          </p>
                        )}
                        <p className="mt-1 text-[13px] font-medium text-gray-900">
                          {item.price.toFixed(2)} {currencySymbol}
                        </p>
                      </div>

                      {quantity > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-[14px] font-medium">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] text-gray-500 hover:bg-gray-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart footer */}
            {cartCount > 0 && (
              <div className="flex-shrink-0 border-t border-black/[0.06] px-5 py-4">
                <div className="mb-3 flex items-center justify-between text-[13px]">
                  <span className="text-gray-500">
                    {cartCount} article{cartCount > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {cartTotal.toFixed(2)} {currencySymbol}
                  </span>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={sheetState === "loading"}
                  data-testid="room-service-order-btn"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[14px] font-semibold transition-colors",
                    sheetState === "loading"
                      ? "bg-gray-200 text-gray-400"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  )}
                >
                  {sheetState === "loading" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {labels?.placingOrder ?? "Placing order..."}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      {labels?.placeOrder ?? "Place order"}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Terms */}
            <p className="flex-shrink-0 px-5 pb-6 text-center text-[11px] text-gray-400">
              Delivery to your room within 30-45 min.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-8 py-12"
      data-testid="room-service-order-success"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500">
        <Check className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-gray-900">
        Order confirmed!
      </h2>
      <p className="mt-1 text-base text-gray-900">
        Your order is being prepared.
      </p>

      <p className="mt-3 text-center text-[13px] leading-tight text-gray-400">
        You can track your order status in the messages section or check back
        here.
      </p>

      <button
        onClick={onClose}
        data-testid="room-service-order-done"
        className="mt-8 w-full rounded-lg border border-gray-200 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
      >
        Got it
      </button>
    </div>
  );
}
