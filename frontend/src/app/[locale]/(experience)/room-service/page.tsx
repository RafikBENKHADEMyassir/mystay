"use client";

import { AppLink } from "@/components/ui/app-link";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { CartSheet } from "@/components/room-service";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
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

/** French price format: "X,XX €" */
function formatPrice(price: number): string {
  const formatted = price.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} €`;
}

export default function RoomServicePage() {
  const locale = useLocale();
  const { overview, token: overviewToken } = useGuestOverview();
  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(null);
  const hotelId = session?.hotelId ?? overview?.hotel.id ?? null;
  const { content } = useGuestContent(locale, hotelId);
  const page = content?.pages.roomService;
  const common = content?.common;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const roomServiceTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.department === "room_service" || ticket.department === "room-service"
      ),
    [tickets]
  );

  useEffect(() => {
    const demo = getDemoSession();
    if (demo) {
      setSession(demo);
    } else if (overview && overviewToken) {
      setSession({
        hotelId: overview.hotel.id,
        hotelName: overview.hotel.name,
        stayId: overview.stay.id,
        confirmationNumber: overview.stay.confirmationNumber,
        guestToken: overviewToken,
        roomNumber: overview.stay.roomNumber,
      });
    }
  }, [overview, overviewToken]);

  useEffect(() => {
    if (!page?.categories?.length) return;
    if (!activeCategory || !page.categories.some((c) => c.id === activeCategory)) {
      setActiveCategory(page.categories[0].id);
    }
  }, [page?.categories, activeCategory]);

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
        headers: { Authorization: `Bearer ${activeSession.guestToken}` },
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

  const handleRealtimeUpdate = useCallback(() => {
    void loadTickets(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useRealtimeMessages({
    hotelId: session?.hotelId,
    departments: ["room_service", "room-service"],
    token: session?.guestToken,
    enabled: !!session,
    onMessage: handleRealtimeUpdate,
  });

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

  function handleCartUpdateQuantity(itemId: string, delta: number) {
    if (delta > 0) {
      const item = page?.menuItems.find((m) => m.id === itemId);
      if (item) addToCart(item);
    } else {
      removeFromCart(itemId);
    }
  }

  async function submitOrder(notes: string, deliveryRoom?: string) {
    if (!session || !page || cart.length === 0 || isOrdering) return;

    setIsOrdering(true);
    setError(null);

    const roomNumber = deliveryRoom?.trim() || session.roomNumber;
    const orderSummary = cart.map((item) => `${item.quantity}x ${item.name}`).join(", ");

    try {
      const response = await fetch(
        new URL("/api/v1/services/request", apiBaseUrl).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.guestToken}`,
          },
          body: JSON.stringify({
            hotelId: session.hotelId,
            stayId: session.stayId,
            roomNumber,
            department: "room_service",
            title: `${page.orderTitlePrefix}: ${orderSummary.slice(0, 50)}`,
            payload: {
              items: cart.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              total: cartTotal,
              notes: notes || undefined,
            },
          }),
        }
      );

      if (!response.ok) {
        setError(page.errors.couldNotPlaceOrder);
        return;
      }

      setCart([]);
      setShowCartSheet(false);
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
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
          <AppLink href={withLocale(locale, "/services")} className="p-2">
            <Image
              src="/images/housekeeping/arrow-back.svg"
              alt="Back"
              width={26}
              height={26}
              unoptimized
            />
          </AppLink>
          <p className="text-[16px] font-medium text-black">{page.title}</p>
          <Image
            src="/images/housekeeping/logo.svg"
            alt=""
            width={32}
            height={32}
            unoptimized
          />
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-black/40">{common.signInToAccessRoomService}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
          >
            {common.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white pb-24">
      {/* Hero — 260px with 40% black overlay */}
      <div className="relative h-[260px] overflow-hidden">
        <Image
          src="/images/room-service/hero-background.png"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Top bar — sticky over the hero */}
      <div className="pointer-events-none absolute left-0 right-0 top-0">
        <div
          className="pointer-events-auto flex items-center justify-between px-2 py-[10px] pr-4"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.376) 25%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 79.808%, rgba(0,0,0,0) 100%)",
          }}
        >
          <AppLink
            href={withLocale(locale, "/services")}
            className="flex h-[36px] items-center justify-center rounded-[8px] p-[8px]"
          >
            <Image
              src="/images/housekeeping/arrow-back.svg"
              alt="Back"
              width={26}
              height={26}
              unoptimized
            />
          </AppLink>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCartSheet(true)}
              className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[15px] font-medium text-white"
            >
              Panier
              {cartCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/90 px-1.5 text-[12px] font-medium text-black">
                  {cartCount}
                </span>
              )}
            </button>
            <Image
              src="/images/housekeeping/logo.svg"
              alt=""
              width={32}
              height={32}
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Title — centered over the hero */}
      <div className="pointer-events-none absolute left-0 right-0 top-[104px] flex items-center justify-center">
        <h1
          className="text-[28px] font-light tracking-[1.12px] text-white"
          style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.5)" }}
        >
          {page.title}
        </h1>
      </div>

      {/* Content overlapping the hero (-24px margin) */}
      <div className="-mt-[24px] relative z-10 pb-8">
        {/* Chat availability card */}
        <div className="px-4">
          <AppLink
            href={withLocale(locale, "/messages?department=room-service")}
            className="flex items-center gap-3 rounded-[6px] border border-black/10 bg-white px-4 py-3 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]"
          >
            <div className="relative h-[33px] w-[33px] shrink-0">
              <Image
                src="/images/housekeeping/message-circle.svg"
                alt=""
                width={33}
                height={33}
                unoptimized
              />
            </div>
            <div className="flex flex-1 items-center gap-4">
              <p className="flex-1 text-[15px] text-black">
                {common.availabilityCard.currentlyAvailableTo}
              </p>
              <Image
                src="/images/housekeeping/chevron-right.svg"
                alt=""
                width={18}
                height={12}
                unoptimized
              />
            </div>
          </AppLink>
        </div>

        {/* Availability accordion */}
        <div className="px-4 pt-2">
          <div className="overflow-hidden rounded-[8px] px-2">
            <button className="relative flex w-full items-center gap-1.5 overflow-hidden rounded-[8px] py-2">
              <span className="text-[15px] font-medium text-black/50">
                {common.availabilityCard.availability}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <span className="text-[15px] text-black">{common.availabilityCard.from}</span>
                <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-[15px] text-black">
                  {common.availabilityCard.openingFrom}
                </span>
                <span className="text-[15px] text-black">{common.availabilityCard.to}</span>
                <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-[15px] text-black">
                  {common.availabilityCard.openingTo}
                </span>
              </div>
              <div className="absolute right-[-5px] top-1/2 h-6 w-6 -translate-y-1/2">
                <Image
                  src="/images/housekeeping/accordion-toggle.svg"
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                />
              </div>
            </button>
          </div>
        </div>

        {/* Room number card */}
        <div className="px-4 pt-2">
          <div className="flex items-center gap-3 rounded-[6px] border border-black/[0.06] bg-white px-4 py-3 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.06)]">
            <Image
              src="/images/room-service/room-icon.svg"
              alt=""
              width={24}
              height={24}
              unoptimized
            />
            <span className="flex-1 text-[15px] font-medium text-black">
              Chambre No. {session.roomNumber ?? "—"}
            </span>
            <Image
              src="/images/room-service/room-chevron.svg"
              alt=""
              width={24}
              height={24}
              unoptimized
            />
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center px-12 py-6">
          <div className="h-[2px] w-full rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* Category tabs — sticky */}
        <div className="sticky top-0 z-20 border-b border-black/10 bg-white">
          <div className="flex gap-6 overflow-x-auto px-4 py-3 scrollbar-hide">
            {page.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  categoryRefs.current[cat.id]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={cn(
                  "shrink-0 pb-2 text-[15px] font-medium transition-colors",
                  activeCategory === cat.id
                    ? "border-b-2 border-black text-black"
                    : "text-black/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu sections — show ALL categories with their items */}
        <div className="space-y-8 px-4 pt-4">
          {page.categories.map((category) => {
            const items = page.menuItems.filter((item) => item.category === category.id);
            const galleryImages = category.galleryImages;

            return (
              <section
                key={category.id}
                ref={(el) => {
                  categoryRefs.current[category.id] = el;
                }}
                id={`category-${category.id}`}
              >
                <h2 className="mb-4 text-[22px] font-medium text-black">
                  {category.label}
                </h2>

                {/* Horizontal photo gallery (configured per category in content) */}
                {galleryImages && galleryImages.length > 0 && (
                  <div className="mb-4 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {galleryImages.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative h-[120px] w-[160px] shrink-0 overflow-hidden rounded-[8px] bg-black/5"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="160px"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Menu items list */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const quantity = getCartQuantity(item.id);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-[8px] border border-black/[0.06] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-normal text-black">{item.name}</p>
                          {item.description && (
                            <p className="mt-0.5 text-[13px] text-black/50">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[15px] font-normal text-black">
                            {formatPrice(item.price)}
                          </span>
                          {quantity > 0 ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="flex h-8 w-8 items-center justify-center"
                                aria-label="Réduire"
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
                                {quantity}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="flex h-8 w-8 items-center justify-center"
                                aria-label="Augmenter"
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
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="flex h-8 w-8 items-center justify-center"
                              aria-label="Ajouter"
                            >
                              <Image
                                src="/images/room-service/add-circle.svg"
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Active orders */}
        {roomServiceTickets.length > 0 && (
          <div className="mt-8 border-t border-black/[0.06] px-4 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-black/40">{page.activeOrders}</p>
              <button
                onClick={() => loadTickets()}
                disabled={isLoading}
                className="rounded-full p-1.5 hover:bg-black/[0.04]"
              >
                <RefreshCw
                  className={cn("h-4 w-4 text-black/30", isLoading && "animate-spin")}
                />
              </button>
            </div>

            <div className="space-y-2">
              {roomServiceTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 rounded-[10px] bg-black/[0.02] px-4 py-3"
                >
                  <span className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] font-medium text-black/70">
                    {ticket.title}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[11px]",
                      ticket.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : ticket.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-black/[0.05] text-black/50"
                    )}
                  >
                    {ticket.status === "resolved"
                      ? page.ticketStatus.resolved
                      : ticket.status === "in_progress"
                        ? page.ticketStatus.inProgress
                        : page.ticketStatus.pending}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 px-4 text-center text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Floating cart button — when cart has items */}
      {cartCount > 0 && (
        <div className="fixed right-4 top-[calc(env(safe-area-inset-top)+60px)] z-30">
          <button
            onClick={() => setShowCartSheet(true)}
            className="rounded-full bg-black px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"
          >
            Panier {cartCount}
          </button>
        </div>
      )}

      {/* Cart sheet */}
      {showCartSheet && (
        <CartSheet
          items={cart.map(({ id, name, price, quantity }) => ({
            id,
            name,
            price,
            quantity,
          }))}
          roomNumber={session.roomNumber ?? null}
          currencySymbol={common.currencySymbol === "EUR" ? "€" : common.currencySymbol}
          isOrdering={isOrdering}
          onUpdateQuantity={handleCartUpdateQuantity}
          onSubmit={submitOrder}
          onClose={() => setShowCartSheet(false)}
        />
      )}
    </div>
  );
}
