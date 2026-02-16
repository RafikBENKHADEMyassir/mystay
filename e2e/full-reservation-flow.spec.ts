/**
 * Full reservation flow E2E tests.
 *
 * End-to-end journey:
 *   1. Guest creates a restaurant reservation (API)
 *   2. Restaurant manager sees the request in the admin panel
 *   3. Manager confirms (resolves) the ticket
 *   4. Guest receives a confirmation message in the thread
 *   5. Event in agenda is updated to confirmed status
 *
 * Prerequisites: dev stack running (./dev.sh)
 */
import { test, expect, type BrowserContext } from "@playwright/test";
import {
  BACKEND_URL,
  ADMIN_URL,
  HOTEL_ID,
  getGuestToken,
  getStaffToken,
  apiFetch,
  RESTAURANT_MANAGER_EMAIL,
  RESTAURANT_MANAGER_PASSWORD,
} from "./helpers";

/**
 * Get a staff token for the restaurant manager.
 */
async function getRestaurantManagerToken() {
  return getStaffToken(RESTAURANT_MANAGER_EMAIL, RESTAURANT_MANAGER_PASSWORD);
}

/**
 * Inject staff authentication for admin panel via cookie.
 */
async function loginAsStaff(context: BrowserContext, token: string) {
  await context.addCookies([
    {
      name: "mystay_staff_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
      secure: false,
    },
  ]);
}

test.describe("Full Reservation Flow: Guest → Manager → Confirmation", () => {
  let guestToken: string;
  let stayId: string;
  let managerToken: string;
  let bookingResult: {
    ticketId: string;
    threadId: string;
    eventId: string;
  };

  test.beforeAll(async () => {
    const guest = await getGuestToken();
    guestToken = guest.token;
    stayId = guest.stayId;
    managerToken = await getRestaurantManagerToken();

    // Create a fresh booking for this test suite
    const { status, data } = await apiFetch(
      "/api/v1/restaurant-bookings",
      guestToken,
      {
        method: "POST",
        body: JSON.stringify({
          restaurantName: "SEA FU",
          date: "2026-02-25",
          time: "20:00",
          guests: 4,
          specialRequests: "Birthday celebration, quiet table please",
          experienceItemId: "EI-1101",
        }),
      }
    );
    expect(status).toBe(201);
    bookingResult = data as typeof bookingResult;
  });

  test("1. Guest booking creates ticket, thread, and event", async () => {
    expect(bookingResult.ticketId).toBeDefined();
    expect(bookingResult.threadId).toBeDefined();
    expect(bookingResult.eventId).toBeDefined();
  });

  test("2. Restaurant manager can see the booking ticket", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/tickets?department=restaurants",
      managerToken
    );
    expect(status).toBe(200);

    const items = data.items as Array<{
      id: string;
      department: string;
      title: string;
      status: string;
    }>;
    expect(items.length).toBeGreaterThan(0);

    const booking = items.find((t) => t.id === bookingResult.ticketId);
    expect(booking).toBeDefined();
    expect(booking!.status).toBe("pending");
    expect(booking!.department).toBe("restaurants");
  });

  test("3. Manager sees booking message in thread with ticket reference", async () => {
    const messagesRes = await apiFetch(
      `/api/v1/threads/${bookingResult.threadId}/messages`,
      managerToken
    );
    expect(messagesRes.status).toBe(200);

    const messages = messagesRes.data.items as Array<{
      id: string;
      bodyText: string;
      senderType: string;
      payload: { type?: string; ticketId?: string };
    }>;

    // Find the message that references our specific ticket ID
    const bookingMsg = messages.find(
      (m) =>
        m.senderType === "guest" &&
        m.payload?.ticketId === bookingResult.ticketId
    );
    expect(bookingMsg).toBeDefined();
    expect(bookingMsg!.payload.type).toBe("restaurant_booking");
    expect(bookingMsg!.bodyText).toContain("SEA FU");
  });

  test("4. Manager confirms the reservation (resolves ticket)", async () => {
    const updateRes = await apiFetch(
      `/api/v1/tickets/${bookingResult.ticketId}`,
      managerToken,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved" }),
      }
    );
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.status).toBe("resolved");
  });

  test("5. Guest receives confirmation message in thread", async () => {
    // Small delay to allow the confirmation message to be created
    await new Promise((r) => setTimeout(r, 500));

    const messagesRes = await apiFetch(
      `/api/v1/threads/${bookingResult.threadId}/messages`,
      guestToken
    );
    expect(messagesRes.status).toBe(200);

    const messages = messagesRes.data.items as Array<{
      id: string;
      bodyText: string;
      senderType: string;
      payload: { type?: string; ticketId?: string };
    }>;

    // Find the confirmation message that references our specific ticket ID
    const confirmationMsg = messages.find(
      (m) =>
        m.senderType === "staff" &&
        m.payload?.type === "restaurant_booking_confirmed" &&
        m.payload?.ticketId === bookingResult.ticketId
    );
    expect(confirmationMsg).toBeDefined();
    expect(confirmationMsg!.bodyText).toContain("SEA FU");
    expect(confirmationMsg!.bodyText).toContain("confirmed");
  });

  test("6. Event in agenda is updated to confirmed", async () => {
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

    const confirmedEvent = events.find(
      (e) => e.id === bookingResult.eventId
    );
    expect(confirmedEvent).toBeDefined();
    expect(confirmedEvent!.status).toBe("confirmed");
    expect(confirmedEvent!.type).toBe("restaurant");
    expect(confirmedEvent!.title).toContain("SEA FU");
  });
});

test.describe("Admin UI: Manager views reservation in admin panel", () => {
  let staffToken: string;

  test.beforeAll(async () => {
    staffToken = await getStaffToken();
  });

  test("Manager sees restaurant requests in admin requests page", async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Admin panel layout differs on mobile");
    await loginAsStaff(context, staffToken);
    await page.goto(`${ADMIN_URL}/requests`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("h1").first()).toContainText("Requests", {
      timeout: 5000,
    });

    // Should see at least one restaurants ticket
    await expect(page.locator("text=restaurants").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("Manager sees restaurant booking messages in thread view", async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Admin panel layout differs on mobile");
    await loginAsStaff(context, staffToken);
    await page.goto(`${ADMIN_URL}/messages`);
    await page.waitForSelector("h1", { timeout: 15000 });

    // Should see restaurant threads
    await expect(page.locator("text=restaurants").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Auth redirect: authenticated users on login/signup", () => {
  test("Authenticated user is redirected away from login page (middleware)", async ({
    page,
    context,
  }) => {
    // Set guest_session cookie to simulate authenticated user
    const guest = await getGuestToken();
    await context.addCookies([
      {
        name: "guest_session",
        value: guest.token,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        sameSite: "Lax",
        secure: false,
      },
    ]);

    // Navigate to login page - should redirect to home
    const response = await page.goto("http://localhost:3000/fr/login", {
      waitUntil: "domcontentloaded",
    });

    // Should have been redirected (final URL should not be login)
    const finalUrl = page.url();
    expect(finalUrl).not.toContain("/login");
  });

  test("Authenticated user is redirected away from signup page (middleware)", async ({
    page,
    context,
  }) => {
    const guest = await getGuestToken();
    await context.addCookies([
      {
        name: "guest_session",
        value: guest.token,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        sameSite: "Lax",
        secure: false,
      },
    ]);

    const response = await page.goto("http://localhost:3000/fr/signup", {
      waitUntil: "domcontentloaded",
    });

    const finalUrl = page.url();
    expect(finalUrl).not.toContain("/signup");
  });
});
