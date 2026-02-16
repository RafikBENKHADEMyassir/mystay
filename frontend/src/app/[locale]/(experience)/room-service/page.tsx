"use client";

import { AppLink } from "@/components/ui/app-link";
/* eslint-disable @next/next/no-img-element */
import {
  ChevronLeft,
  Leaf,
  RefreshCw,
  Plus,
  Minus,
  ShoppingCart,
  MessageSquare
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { getDemoSession } from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { withLocale } from "@/lib/i18n/paths";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  stayId: string | null;
  hotelId: string;
  roomNumber: string | null;
  department: string;
  status: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  tags?: string[];
};

type CartItem = MenuItem & { quantity: number };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function RoomServicePage() {
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const { content } = useGuestContent(locale, session?.hotelId);
  const page = content?.pages.roomService;
  const common = content?.common;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomServiceTickets = useMemo(
    () => tickets.filter((ticket) => ticket.department === "room_service" || ticket.department === "room-service"),
    [tickets]
  );

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  useEffect(() => {
    if (!page?.categories?.length) return;
    if (!activeCategory || !page.categories.some((category) => category.id === activeCategory)) {
      setActiveCategory(page.categories[0].id);
    }
  }, [page?.categories, activeCategory]);

  const filteredItems = useMemo(() => {
    if (!page) return [];
    return page.menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, page]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  async function loadTickets(activeSession = session) {
    if (!activeSession) return;

    setIsLoading(true);

    try {
      const url = new URL("/api/v1/tickets", apiBaseUrl);
      url.searchParams.set("stayId", activeSession.stayId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${activeSession.guestToken}` }
      });
      if (response.ok) {
        const data = (await response.json()) as { items?: Ticket[] };
        setTickets(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stayId]);

  // Real-time updates
  const handleRealtimeUpdate = useCallback(() => {
    void loadTickets(session);
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["room_service", "room-service"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate
  });

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...current, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((current) => {
      const existing = current.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return current.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
      }
      return current.filter((i) => i.id !== itemId);
    });
  }

  function getCartQuantity(itemId: string): number {
    return cart.find((i) => i.id === itemId)?.quantity ?? 0;
  }

  async function submitOrder() {
    if (!session || !page || cart.length === 0 || isOrdering) return;

    setIsOrdering(true);
    setError(null);

    try {
      const orderSummary = cart.map((item) => `${item.quantity}x ${item.name}`).join(", ");

      const response = await fetch(new URL("/api/v1/services/request", apiBaseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.guestToken}` },
        body: JSON.stringify({
          hotelId: session.hotelId,
          stayId: session.stayId,
          roomNumber: session.roomNumber,
          department: "room_service",
          title: `${page.orderTitlePrefix}: ${orderSummary.slice(0, 50)}`,
          payload: {
            items: cart.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            total: cartTotal
          }
        })
      });

      if (!response.ok) {
        setError(page.errors.couldNotPlaceOrder);
        return;
      }

      setCart([]);
      await loadTickets(session);
    } catch {
      setError(page.errors.serviceUnavailable);
    } finally {
      setIsOrdering(false);
    }
  }

  if (!page || !common) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <AppLink href={withLocale(locale, "/services")} className="-ml-2 p-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </AppLink>
          <div className="text-center">
            <p className="font-medium text-gray-900">{page.title}</p>
          </div>
          <Leaf className="h-6 w-6 text-gray-300" />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">{common.signInToAccessRoomService}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  const activeCategoryLabel = page.categories.find((category) => category.id === activeCategory)?.label ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-white pb-24">
      {/* Hero Header */}
      <div className="relative h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${page.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        {/* Topbar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
          <AppLink
            href={withLocale(locale, "/services")}
            className="-ml-2 rounded-full bg-white/10 p-2 backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </AppLink>

          {/* Order button */}
          {cartCount > 0 && (
            <button
              onClick={submitOrder}
              disabled={isOrdering}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{page.orderButton}</span>
              <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">{cartCount}</span>
            </button>
          )}

          <Leaf className="h-6 w-6 text-white/80" />
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1 className="font-serif text-3xl font-light uppercase tracking-wide text-white">{page.title}</h1>
        </div>
      </div>

      {/* Staff Availability Card */}
      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
                <span className="text-2xl">🍽️</span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">{common.availabilityCard.currentlyAvailableTo}</p>
              <p className="text-sm text-gray-500">{common.availabilityCard.chat}</p>
            </div>

            <AppLink
              href={withLocale(locale, "/messages?department=room-service")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </AppLink>
          </div>

          {/* Hours */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{common.availabilityCard.availability}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{common.availabilityCard.from}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{common.availabilityCard.openingFrom}</span>
              <span className="text-gray-400">{common.availabilityCard.to}</span>
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{common.availabilityCard.openingTo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders */}
      {roomServiceTickets.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{page.activeOrders}</p>
            <button
              onClick={() => loadTickets()}
              disabled={isLoading}
              className="rounded-full p-1.5 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-2">
            {roomServiceTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-amber-50 p-3">
                <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                <p className="mt-1 text-xs text-amber-700">
                  {ticket.status === "in_progress"
                    ? page.ticketStatus.inProgress
                    : ticket.status === "resolved"
                      ? page.ticketStatus.resolved
                      : page.ticketStatus.pending}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white">
        <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
          {page.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                activeCategory === category.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 py-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{activeCategoryLabel}</h2>

        {/* Items with images (horizontal scroll) */}
        {filteredItems.some((item) => item.image) && (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filteredItems
              .filter((item) => item.image)
              .slice(0, 4)
              .map((item) => (
                <div key={item.id} className="w-28 flex-shrink-0">
                  <div className="relative h-20 w-full overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={item.image!}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Items list */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const quantity = getCartQuantity(item.id);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.description && <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {item.price.toFixed(2)} {common.currencySymbol}
                  </span>

                  {quantity > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium">{quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>

      {/* Cart Summary (Fixed bottom) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
          <div className="mx-auto max-w-md">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">{interpolateTemplate(page.itemCount, { count: cartCount })}</span>
              <span className="font-semibold text-gray-900">
                {cartTotal.toFixed(2)} {common.currencySymbol}
              </span>
            </div>
            <button
              onClick={submitOrder}
              disabled={isOrdering}
              className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {isOrdering ? page.placingOrder : page.placeOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
