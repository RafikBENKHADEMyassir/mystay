/**
 * E2E tests: Useful Informations feature.
 *
 * Tests:
 *   1. Backend API: CRUD for useful info categories and items
 *   2. Admin panel: Navigate to useful informations page, view/edit categories
 *   3. Guest frontend: Room page → click "Informations utiles" → bottom sheet opens with tabs
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

test.describe("API: Useful Informations CRUD", () => {
  let staffToken: string;

  test.beforeAll(async () => {
    staffToken = await getStaffToken();
  });

  test("GET /api/v1/staff/useful-informations returns seeded categories", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/staff/useful-informations`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.categories).toBeDefined();
    expect(data.categories.length).toBeGreaterThanOrEqual(6);

    const wifi = data.categories.find((c: { title: string }) => c.title === "Connexion Wi-Fi");
    expect(wifi).toBeDefined();
    expect(wifi.items.length).toBeGreaterThanOrEqual(3);

    const noSmoking = data.categories.find((c: { title: string }) => c.title === "Politique non-fumeur");
    expect(noSmoking).toBeDefined();
  });

  test("GET /api/v1/hotels/:hotelId/useful-informations returns public data", async () => {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/hotels/${HOTEL_ID}/useful-informations`
    );
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.categories).toBeDefined();
    expect(data.categories.length).toBeGreaterThanOrEqual(6);

    const breakfast = data.categories.find(
      (c: { title: string }) => c.title === "Petit-déjeuner"
    );
    expect(breakfast).toBeDefined();
    expect(breakfast.items.length).toBeGreaterThanOrEqual(2);
  });

  test("POST + PATCH + DELETE category round-trip", async () => {
    // Create
    const createRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/useful-informations/categories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ title: "E2E Test Category", icon: "test" }),
      }
    );
    expect(createRes.ok).toBe(true);
    const created = await createRes.json();
    const categoryId = created.category.id;
    expect(created.category.title).toBe("E2E Test Category");

    // Update
    const updateRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/useful-informations/categories/${categoryId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ title: "E2E Updated Category" }),
      }
    );
    expect(updateRes.ok).toBe(true);
    const updated = await updateRes.json();
    expect(updated.category.title).toBe("E2E Updated Category");

    // Delete
    const deleteRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/useful-informations/categories/${categoryId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${staffToken}` },
      }
    );
    expect(deleteRes.ok).toBe(true);
    const deleted = await deleteRes.json();
    expect(deleted.deleted).toBe(true);
  });

  test("POST + PATCH + DELETE item round-trip", async () => {
    // Use existing category (Wi-Fi)
    const listRes = await fetch(`${BACKEND_URL}/api/v1/staff/useful-informations`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const listData = await listRes.json();
    const wifiCategory = listData.categories.find(
      (c: { title: string }) => c.title === "Connexion Wi-Fi"
    );
    expect(wifiCategory).toBeDefined();

    // Create item
    const createRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/useful-informations/items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          categoryId: wifiCategory.id,
          title: "E2E Test Item",
          content: "E2E test content",
        }),
      }
    );
    expect(createRes.ok).toBe(true);
    const created = await createRes.json();
    const itemId = created.item.id;
    expect(created.item.title).toBe("E2E Test Item");

    // Update item
    const updateRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/useful-informations/items/${itemId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ title: "E2E Updated Item", content: "Updated content" }),
      }
    );
    expect(updateRes.ok).toBe(true);
    const updated = await updateRes.json();
    expect(updated.item.title).toBe("E2E Updated Item");

    // Delete item
    const deleteRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/useful-informations/items/${itemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${staffToken}` },
      }
    );
    expect(deleteRes.ok).toBe(true);
    const deleted = await deleteRes.json();
    expect(deleted.deleted).toBe(true);
  });
});

// ─── Admin UI Tests ───

test.describe("Admin: Useful Informations page", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsStaff(context);
  });

  test("Sidebar shows Useful informations link", async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Sidebar not visible on mobile");

    await page.goto(`${ADMIN_URL}/useful-informations`, { waitUntil: "networkidle" });

    const navLink = page.locator('a[href="/useful-informations"]').first();
    await expect(navLink).toBeVisible({ timeout: 10000 });
    await expect(navLink).toContainText("Useful informations");
  });

  test("Useful informations page loads with seeded categories", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/useful-informations`, { waitUntil: "networkidle" });

    await expect(page.locator("h1").first()).toContainText("Useful Informations", {
      timeout: 15000,
    });

    // Should show Wi-Fi category title input
    const wifiInput = page.locator('input[value="Connexion Wi-Fi"]').first();
    await expect(wifiInput).toBeVisible({ timeout: 5000 });

    // Should show Petit-déjeuner category
    const breakfastInput = page.locator('input[value="Petit-déjeuner"]').first();
    await expect(breakfastInput).toBeVisible({ timeout: 5000 });
  });

  test("Categories display their items", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/useful-informations`, { waitUntil: "networkidle" });

    // Wi-Fi category should have items
    const wifiNetworkInput = page.locator('input[value="Réseau"]').first();
    await wifiNetworkInput.scrollIntoViewIfNeeded();
    await expect(wifiNetworkInput).toBeVisible({ timeout: 5000 });

    // Should show password item
    const passwordInput = page.locator('input[value="Mot de passe"]').first();
    await passwordInput.scrollIntoViewIfNeeded();
    await expect(passwordInput).toBeVisible();
  });

  test("Can create a new category", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/useful-informations`, { waitUntil: "networkidle" });

    // Scroll to the "Add new category" form
    const newCatTitle = page.locator("#new-cat-title");
    await newCatTitle.scrollIntoViewIfNeeded();
    await expect(newCatTitle).toBeVisible({ timeout: 5000 });

    await newCatTitle.fill("E2E Test Category");
    const iconInput = page.locator("#new-cat-icon");
    await iconInput.fill("test");

    await page.locator('button:has-text("Create category")').click();

    // Should redirect with success message
    await page.waitForURL(/saved=category_created/, { timeout: 10000 });
    await expect(page.locator('input[value="E2E Test Category"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Clean up: delete the test category
    const deleteBtn = page
      .locator('input[value="E2E Test Category"]')
      .first()
      .locator("../../..")
      .locator('button:has-text("Delete category")')
      .first();
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();
    await page.waitForURL(/saved=category_deleted/, { timeout: 10000 });
  });
});

// ─── Guest Frontend Tests ───

test.describe("Guest: Useful Informations Bottom Sheet", () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
  });

  test("Room page shows 'Informations utiles' quick action", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="useful-info-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await expect(trigger).toContainText("Informations utiles");
  });

  test("Clicking 'Informations utiles' opens bottom sheet with tabs", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="useful-info-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    // Bottom sheet should appear
    const sheet = page.locator('[data-testid="useful-info-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Should show Wi-Fi tab
    await expect(sheet.locator("text=Connexion Wi-Fi").first()).toBeVisible({ timeout: 5000 });

    // Should show Petit-déjeuner tab
    await expect(sheet.locator("text=Petit-déjeuner").first()).toBeVisible();

    // Should show Salle de sport tab
    await expect(sheet.locator("text=Salle de sport").first()).toBeVisible();
  });

  test("Bottom sheet shows all categories as continuous scroll", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="useful-info-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="useful-info-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    const content = sheet.locator('[data-testid="useful-info-content"]');
    await expect(content).toBeVisible({ timeout: 5000 });

    // Title and subtitle should be visible
    await expect(sheet.locator("text=Informations utiles").first()).toBeVisible();
    await expect(sheet.locator("text=Retrouvez ici toutes les informations utiles").first()).toBeVisible();

    // Wi-Fi section heading and content
    await expect(content.locator("text=FourSeasons_Guest").first()).toBeVisible();

    // Breakfast section should also exist in the continuous scroll
    const breakfastSection = sheet.locator('[data-testid="useful-info-section-UIC-BREAKFAST"]');
    await expect(breakfastSection).toBeAttached();

    // "Contacter la réception" link at the bottom
    const contactLink = sheet.locator('[data-testid="useful-info-contact-link"]');
    await expect(contactLink).toBeAttached();
  });

  test("Tab click scrolls to that category section", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="useful-info-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="useful-info-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Click on Petit-déjeuner tab — should scroll to that section
    const breakfastTab = sheet.locator("text=Petit-déjeuner").first();
    await breakfastTab.click();

    // Wait for smooth scroll to complete
    await page.waitForTimeout(600);

    // Breakfast content should now be visible in viewport
    const breakfastSection = sheet.locator('[data-testid="useful-info-section-UIC-BREAKFAST"]');
    await expect(breakfastSection.locator("text=6 h 30").first()).toBeVisible({ timeout: 3000 });
    await expect(breakfastSection.locator("text=buffet chaud").first()).toBeVisible();
  });

  test("Bottom sheet closes when clicking backdrop", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, { waitUntil: "networkidle" });

    const trigger = page.locator('[data-testid="useful-info-trigger"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const sheet = page.locator('[data-testid="useful-info-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Click the backdrop (top area)
    await page.mouse.click(200, 30);

    await expect(sheet).not.toBeVisible({ timeout: 2000 });
  });
});
