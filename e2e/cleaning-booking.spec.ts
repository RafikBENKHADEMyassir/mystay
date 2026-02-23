/**
 * E2E tests: Cleaning Booking feature.
 *
 * Tests:
 *   1. Backend API: Cleaning service config, booking creation
 *   2. Admin panel: Nettoyage service visible in upsell services with bookable badge
 *   3. Guest frontend: Room page → "Demander un nettoyage" → bottom sheet → book → success
 *
 * Prerequisites: dev stack running (./dev.sh) with seeded data
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {
  BACKEND_URL,
  FRONTEND_URL,
  ADMIN_URL,
  HOTEL_ID,
  getStaffToken,
  getGuestToken,
} from "./helpers";

const LOCALE = "fr";

async function loginAsStaff(context: BrowserContext) {
  const token = await getStaffToken();
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
  return token;
}

async function injectGuestSession(page: Page) {
  const guest = await getGuestToken();
  await page.goto(`${FRONTEND_URL}/${LOCALE}`, { waitUntil: "commit" });
  await page.evaluate(
    ({ g }) => {
      const session = {
        hotelId: g.hotelId,
        hotelName: "Four Seasons Resort Dubai",
        stayId: g.stayId,
        confirmationNumber: "DEMO123456",
        guestToken: g.token,
        roomNumber: g.roomNumber,
        checkIn: "2026-02-15",
        checkOut: "2026-02-22",
        guests: { adults: 2, children: 0 },
        guestFirstName: "Sophie",
        guestLastName: "Martin",
      };
      window.sessionStorage.setItem("mystay_demo_session_v1", JSON.stringify(session));
    },
    { g: guest }
  );
  return guest;
}

// ─── API Tests ───

test.describe("API: Cleaning Service", () => {
  let guestToken: string;
  let guestStayId: string;

  test.beforeAll(async () => {
    const guest = await getGuestToken();
    guestToken = guest.token;
    guestStayId = guest.stayId;
  });

  test("GET /api/v1/hotels/:id/cleaning/service returns nettoyage config", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/cleaning/service`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.service).toBeDefined();
    expect(data.service.name).toBe("Nettoyage");
    expect(data.service.priceCents).toBe(5000);
    expect(data.service.timeSlots).toEqual([
      "10:00 - 11:00",
      "12:00 - 13:00",
      "15:00 - 16:00",
      "17:00 - 18:00",
    ]);
    expect(data.service.imageUrl).toBe("/images/room/nettoyage.png");
  });

  test("POST booking creates booking + ticket + thread + event", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/cleaning/service`);
    const svc = (await res.json()).service;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const bookRes = await fetch(`${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/cleaning/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guestToken}`,
      },
      body: JSON.stringify({
        serviceId: svc.id,
        bookingDate: dateStr,
        timeSlot: "10:00 - 11:00",
      }),
    });
    expect(bookRes.status).toBe(201);

    const result = await bookRes.json();
    const booking = result.booking;
    expect(booking.timeSlot).toBe("10:00 - 11:00");
    expect(booking.priceCents).toBe(5000);
    expect(booking.status).toBe("confirmed");

    expect(result.ticketId).toBeDefined();
    expect(result.threadId).toBeDefined();
    expect(result.eventId).toBeDefined();

    const slotsRes = await fetch(
      `${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/cleaning/bookings?date=${dateStr}`
    );
    expect(slotsRes.ok).toBe(true);
    const slotsData = await slotsRes.json();
    expect(slotsData.bookedSlots).toBeDefined();
    const slot1000 = slotsData.bookedSlots.find(
      (s: { timeSlot: string }) => s.timeSlot === "10:00 - 11:00"
    );
    expect(slot1000).toBeDefined();
    expect(slot1000.count).toBeGreaterThanOrEqual(1);
  });

  test("POST booking without auth returns 401", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/cleaning/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: "UP-CLEANING-01",
        bookingDate: "2026-03-01",
        timeSlot: "10:00 - 11:00",
      }),
    });
    expect(res.status).toBe(401);
  });

  test("POST booking with missing fields returns 400", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/cleaning/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guestToken}`,
      },
      body: JSON.stringify({ serviceId: "UP-CLEANING-01" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("missing_fields");
  });

  test("Staff can list service bookings", async () => {
    const token = await getStaffToken();
    const res = await fetch(`${BACKEND_URL}/api/v1/staff/service-bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.bookings).toBeDefined();
    expect(Array.isArray(data.bookings)).toBe(true);
    expect(data.bookings.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Admin UI Tests ───

test.describe("Admin: Cleaning service in Upsell", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsStaff(context);
  });

  test("Nettoyage service appears with Bookable badge", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/upsell-services`, { waitUntil: "networkidle" });

    const nettoyageLink = page.locator('a:has-text("Nettoyage")').first();
    await expect(nettoyageLink).toBeVisible({ timeout: 15000 });

    const badge = nettoyageLink.locator("../../..").locator("text=Bookable").first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test("Nettoyage service detail shows bookable fields", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/upsell-services`, { waitUntil: "networkidle" });

    const nettoyageLink = page.locator('a:has-text("Nettoyage")').first();
    await nettoyageLink.click();

    await expect(page.locator("text=Bookable service options").first()).toBeVisible({
      timeout: 10000,
    });

    const bookableCheckbox = page.locator('input[name="bookable"]');
    await expect(bookableCheckbox).toBeChecked();

    const timeSlotsInput = page.locator('input[name="timeSlots"]');
    await expect(timeSlotsInput).toBeVisible();
    const timeSlotsValue = await timeSlotsInput.inputValue();
    expect(timeSlotsValue).toContain("10:00 - 11:00");
  });
});

// ─── Guest Frontend Tests ───

test.describe("Guest: Cleaning Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
  });

  test("Room page shows 'Demander un nettoyage' promo card", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="cleaning-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await expect(trigger).toContainText("nettoyage", { ignoreCase: true });
  });

  test("Clicking promo card opens cleaning booking bottom sheet", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="cleaning-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="cleaning-booking-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    const form = sheet.locator('[data-testid="cleaning-booking-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    await expect(form.locator("text=Nettoyage").first()).toBeVisible();
    await expect(form.locator("text=Sélectionnez le jour").first()).toBeVisible();
    await expect(form.locator("text=Sélectionnez votre créneau").first()).toBeVisible();
  });

  test("Day and time slot selection works", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="cleaning-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="cleaning-booking-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    const dayPicker = sheet.locator('[data-testid="cleaning-day-picker"]');
    await expect(dayPicker).toBeVisible({ timeout: 5000 });

    const days = dayPicker.locator("button");
    const dayCount = await days.count();
    expect(dayCount).toBe(6);

    const slotPicker = sheet.locator('[data-testid="cleaning-slot-picker"]');
    const slots = slotPicker.locator("button");
    const slotCount = await slots.count();
    expect(slotCount).toBe(4);

    await slots.first().click();

    const price = sheet.locator('[data-testid="cleaning-price"]');
    await expect(price).toContainText("50");

    const bookBtn = sheet.locator('[data-testid="cleaning-book-btn"]');
    await expect(bookBtn).toBeEnabled();
  });

  test("Full booking flow shows success confirmation", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="cleaning-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="cleaning-booking-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    const slotPicker = sheet.locator('[data-testid="cleaning-slot-picker"]');
    await slotPicker.locator("button").first().click();

    const bookBtn = sheet.locator('[data-testid="cleaning-book-btn"]');
    await bookBtn.click();

    const success = sheet.locator('[data-testid="cleaning-booking-success"]');
    await expect(success).toBeVisible({ timeout: 10000 });

    await expect(success.locator("text=Parfait").first()).toBeVisible();
    await expect(success.locator("text=Votre session a été réservée").first()).toBeVisible();

    const doneBtn = sheet.locator('[data-testid="cleaning-booking-done"]');
    await expect(doneBtn).toBeVisible();
    await expect(doneBtn).toContainText("compris");
  });

  test("Success 'C'est compris' closes the sheet", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="cleaning-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="cleaning-booking-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    const slotPicker = sheet.locator('[data-testid="cleaning-slot-picker"]');
    await slotPicker.locator("button").first().click();
    await sheet.locator('[data-testid="cleaning-book-btn"]').click();

    const doneBtn = sheet.locator('[data-testid="cleaning-booking-done"]');
    await expect(doneBtn).toBeVisible({ timeout: 10000 });
    await doneBtn.click();

    await expect(sheet).not.toBeVisible({ timeout: 3000 });
  });

  test("Bottom sheet closes when clicking backdrop", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="cleaning-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="cleaning-booking-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    await page.mouse.click(200, 20);
    await expect(sheet).not.toBeVisible({ timeout: 3000 });
  });
});
