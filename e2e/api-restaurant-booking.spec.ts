/**
 * Backend API integration tests for the restaurant booking flow.
 * Tests the full lifecycle: create booking → verify ticket, thread, event.
 *
 * Prerequisites: dev stack running (./dev.sh)
 */
import { test, expect } from "@playwright/test";
import {
  BACKEND_URL,
  HOTEL_ID,
  getGuestToken,
  getStaffToken,
  apiFetch,
} from "./helpers";

test.describe("API: Restaurant Booking", () => {
  let guestToken: string;
  let stayId: string;
  let staffToken: string;

  test.beforeAll(async () => {
    const guest = await getGuestToken();
    guestToken = guest.token;
    stayId = guest.stayId;
    staffToken = await getStaffToken();
  });

  test("GET /api/v1/hotels/:id/experiences returns restaurant-type items with config", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/experiences`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.sections).toBeDefined();
    expect(Array.isArray(data.sections)).toBe(true);

    const culinary = data.sections.find(
      (s: { slug: string }) => s.slug === "culinary"
    );
    expect(culinary).toBeDefined();
    expect(culinary.items.length).toBeGreaterThan(0);

    const seaFu = culinary.items.find(
      (i: { label: string }) => i.label === "SEA FU"
    );
    expect(seaFu).toBeDefined();
    expect(seaFu.type).toBe("restaurant");
    expect(seaFu.restaurantConfig).toBeDefined();
    expect(seaFu.restaurantConfig.description).toContain("seafood");
    expect(seaFu.restaurantConfig.menuSections.length).toBeGreaterThanOrEqual(4);

    // Verify Menu du jour has subsections
    const menuDuJour = seaFu.restaurantConfig.menuSections.find(
      (s: { id: string }) => s.id === "menu-du-jour"
    );
    expect(menuDuJour).toBeDefined();
    expect(menuDuJour.price).toBe("32,99 €");
    expect(menuDuJour.subsections.length).toBe(3);

    // Verify Entrees has priced items
    const entrees = seaFu.restaurantConfig.menuSections.find(
      (s: { id: string }) => s.id === "entrees"
    );
    expect(entrees).toBeDefined();
    expect(entrees.items.length).toBe(2);
    expect(entrees.items[0].price).toBeDefined();
  });

  test("POST /api/v1/restaurant-bookings creates ticket + thread + event", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/restaurant-bookings",
      guestToken,
      {
        method: "POST",
        body: JSON.stringify({
          restaurantName: "SEA FU",
          date: "2026-02-20",
          time: "19:30",
          guests: 2,
          specialRequests: "Window seat please",
          experienceItemId: "EI-1101",
        }),
      }
    );

    expect(status).toBe(201);
    expect(data.ticketId).toBeDefined();
    expect(data.threadId).toBeDefined();
    expect(data.eventId).toBeDefined();
    expect(typeof data.ticketId).toBe("string");
    expect(typeof data.threadId).toBe("string");
    expect(typeof data.eventId).toBe("string");

    // Verify the ticket exists
    const ticketsRes = await apiFetch(
      `/api/v1/tickets?stayId=${stayId}`,
      guestToken
    );
    expect(ticketsRes.status).toBe(200);
    const tickets = ticketsRes.data.items as Array<{
      id: string;
      department: string;
      title: string;
    }>;
    const ticket = tickets.find((t) => t.id === data.ticketId);
    expect(ticket).toBeDefined();
    expect(ticket!.department).toBe("restaurants");
    expect(ticket!.title).toContain("SEA FU");

    // Verify the thread exists with a message
    const threadsRes = await apiFetch(
      `/api/v1/threads?stayId=${stayId}`,
      guestToken
    );
    expect(threadsRes.status).toBe(200);
    const threads = threadsRes.data.items as Array<{
      id: string;
      department: string;
      lastMessage: string;
    }>;
    const thread = threads.find((t) => t.id === data.threadId);
    expect(thread).toBeDefined();
    expect(thread!.department).toBe("restaurants");
    expect(thread!.lastMessage).toContain("SEA FU");
    expect(thread!.lastMessage).toContain("19:30");
    expect(thread!.lastMessage).toContain("Window seat");

    // Verify the event exists in the agenda
    const eventsRes = await apiFetch(
      `/api/v1/events?stayId=${stayId}`,
      guestToken
    );
    expect(eventsRes.status).toBe(200);
    const events = eventsRes.data.items as Array<{
      id: string;
      type: string;
      title: string;
      status: string;
    }>;
    const event = events.find((e) => e.id === data.eventId);
    expect(event).toBeDefined();
    expect(event!.type).toBe("restaurant");
    expect(event!.title).toContain("SEA FU");
    expect(event!.status).toBe("pending");
  });

  test("POST /api/v1/restaurant-bookings rejects missing fields", async () => {
    // No guests
    const res1 = await apiFetch("/api/v1/restaurant-bookings", guestToken, {
      method: "POST",
      body: JSON.stringify({
        restaurantName: "SEA FU",
        date: "2026-02-20",
        time: "19:30",
        guests: 0,
      }),
    });
    expect(res1.status).toBe(400);

    // No restaurant name
    const res2 = await apiFetch("/api/v1/restaurant-bookings", guestToken, {
      method: "POST",
      body: JSON.stringify({
        restaurantName: "",
        date: "2026-02-20",
        time: "19:30",
        guests: 2,
      }),
    });
    expect(res2.status).toBe(400);
  });

  test("POST /api/v1/restaurant-bookings rejects without auth", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/restaurant-bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantName: "SEA FU",
        date: "2026-02-20",
        time: "19:30",
        guests: 2,
      }),
    });
    expect(res.status).toBe(401);
  });

  test("Staff can see restaurant booking tickets", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/tickets?department=restaurants",
      staffToken
    );
    expect(status).toBe(200);
    const items = data.items as Array<{ department: string; title: string }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((t) => t.title.includes("SEA FU"))).toBe(true);
  });
});
