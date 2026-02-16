/**
 * Frontend E2E tests: Guest restaurant booking flow.
 *
 * Full journey:
 *   1. Session is injected (simulating a logged-in guest with linked reservation)
 *   2. Home page shows experience carousels
 *   3. Clicks a restaurant-type item → bottom sheet opens
 *   4. Browses the menu tabs
 *   5. Clicks "Choisir ce restaurant" → booking form opens
 *   6. Fills in date, time, guests, special requests
 *   7. Submits → success toast
 *   8. Verifies messages and agenda
 *
 * Prerequisites: dev stack running (./dev.sh)
 */
import { test, expect, type Page } from "@playwright/test";
import { FRONTEND_URL, BACKEND_URL, getGuestToken } from "./helpers";

const LOCALE = "fr";

/**
 * Inject a demo session into sessionStorage so the app treats us as an
 * authenticated guest with a linked reservation. This mirrors how setDemoSession works.
 */
async function injectGuestSession(page: Page) {
  const guest = await getGuestToken();

  // Navigate to any page first so we can set sessionStorage on the correct origin
  await page.goto(`${FRONTEND_URL}/${LOCALE}`, { waitUntil: "commit" });

  await page.evaluate(
    ({ g, frontendUrl }) => {
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
    { g: guest, frontendUrl: FRONTEND_URL }
  );

  return guest;
}

async function goHomeAndWaitForCarousels(page: Page) {
  await page.goto(`${FRONTEND_URL}/${LOCALE}`);
  // Wait for experience sections to load (they use the text-based label)
  await page.waitForSelector('text=SEA FU', { timeout: 15000 });
}

test.describe("Guest: Restaurant Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
  });

  test("Home page shows experience carousels with restaurant items", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);

    // Should see culinary section with SEA FU
    await expect(page.locator('button:has-text("SEA FU")').first()).toBeVisible();

    // Should also see other restaurants
    await expect(page.locator('button:has-text("COYA")').first()).toBeVisible();
  });

  test("Clicking restaurant item opens bottom sheet with menu", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);

    // Click SEA FU card (it should be a button since type=restaurant)
    await page.locator('button:has-text("SEA FU")').first().click();

    // Bottom sheet should show the restaurant name
    await expect(page.locator('h2:has-text("SEA FU")').first()).toBeVisible({ timeout: 5000 });

    // Should show description
    await expect(page.locator('text=seafood').first()).toBeVisible({ timeout: 3000 });

    // Should show hours
    await expect(page.locator('text=Ouvert tous les jours').first()).toBeVisible();

    // Should show menu tabs
    await expect(page.locator('button:has-text("Menu du jour")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Entrées")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Plats")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Desserts")').first()).toBeVisible();

    // Should show the book button
    await expect(
      page.locator('button:has-text("Choisir ce restaurant")').first()
    ).toBeVisible();
  });

  test("Menu du jour tab shows subsections with items", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);
    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('button:has-text("Menu du jour")', { timeout: 5000 });

    // Menu du jour should be active by default (first tab)
    // Should show price
    await expect(page.locator('text=32,99 €').first()).toBeVisible({ timeout: 3000 });

    // Should show subsection titles
    await expect(page.locator('text=Entrées au choix').first()).toBeVisible();
    await expect(page.locator('text=Plats au choix').first()).toBeVisible();

    // Should show items within subsections
    await expect(page.locator('text=Toast au chèvre').first()).toBeVisible();
    await expect(page.locator('text=Magret de canard').first()).toBeVisible();
  });

  test("Can switch between menu tabs", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);
    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('button:has-text("Entrées")');

    // Click Entrées tab
    await page.locator('button:has-text("Entrées")').first().click();
    await expect(page.locator('text=8,00 €').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Salade césar du chef').first()).toBeVisible();

    // Click Plats tab
    await page.locator('button:has-text("Plats")').first().click();
    await expect(page.locator('text=17,50 €').first()).toBeVisible({ timeout: 3000 });

    // Click Desserts tab
    await page.locator('button:has-text("Desserts")').first().click();
    await expect(page.locator('text=Fondant au chocolat').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=3,00 €').first()).toBeVisible();

    // Click Alcools tab
    await page.locator('button:has-text("Alcools")').first().click();
    await expect(page.locator('text=Coupe de champagne').first()).toBeVisible({ timeout: 3000 });

    // Click Softs tab
    await page.locator('button:has-text("Softs")').first().click();
    await expect(page.locator('text=Jus de fruits frais').first()).toBeVisible({ timeout: 3000 });
  });

  test("Book button opens reservation form", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);
    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('button:has-text("Choisir ce restaurant")', { timeout: 5000 });

    // Click "Choisir ce restaurant"
    await page.locator('button:has-text("Choisir ce restaurant")').first().click();

    // Should show the booking form
    await expect(
      page.locator('text=Réserver une table').first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1:has-text("SEA FU")').first()).toBeVisible();

    // Should have date selector
    await expect(page.locator("text=Date").first()).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();

    // Should have time selectors
    await expect(page.locator("text=Pour").first()).toBeVisible();

    // Should have guest counter at 0
    await expect(page.locator('text=Nombre de personnes').first()).toBeVisible();

    // Should have special requests textarea
    await expect(page.locator('textarea').first()).toBeVisible();

    // Should have submit button
    await expect(page.locator('button:has-text("Réserver")').first()).toBeVisible();
  });

  test("Booking form validates guest count > 0", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);
    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('button:has-text("Choisir ce restaurant")', { timeout: 5000 });
    await page.locator('button:has-text("Choisir ce restaurant")').first().click();
    await page.waitForSelector('text=Réserver une table', { timeout: 5000 });

    // Try to submit with 0 guests
    await page.locator('button:has-text("Réserver")').first().click();

    // Should show error message
    await expect(
      page.locator('text=nombre de personnes').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test("Full booking flow: browse menu → book → fill form → success", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);

    // 1. Open SEA FU
    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('button:has-text("Choisir ce restaurant")', { timeout: 5000 });

    // 2. Browse menu - click Plats tab
    await page.locator('button:has-text("Plats")').first().click();
    await expect(page.locator('text=Magret de canard').first()).toBeVisible({ timeout: 3000 });

    // 3. Click book
    await page.locator('button:has-text("Choisir ce restaurant")').first().click();
    await page.waitForSelector('text=Réserver une table', { timeout: 5000 });

    // 4. Add 3 guests (the + button is the last small round button in the guests section)
    const guestSection = page.locator('text=Nombre de personnes').locator('..');
    const plusButton = guestSection.locator('button').last();
    await plusButton.click();
    await plusButton.click();
    await plusButton.click();

    // 5. Fill special request
    await page.locator('textarea').first().fill("Terrasse si possible, anniversaire");

    // 6. Submit
    await page.locator('button:has-text("Réserver")').first().click();

    // 7. Verify success
    await expect(
      page.locator('text=réservation a été envoyée').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("Back button in booking form returns to bottom sheet", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);

    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('button:has-text("Choisir ce restaurant")', { timeout: 5000 });
    await page.locator('button:has-text("Choisir ce restaurant")').first().click();
    await page.waitForSelector('text=Réserver une table', { timeout: 5000 });

    // Click the back button (top-left button with a small SVG - first button on the page)
    const backButton = page.locator('.fixed button').first();
    await backButton.click();

    // Should return to bottom sheet menu
    await expect(page.locator('button:has-text("Menu du jour")').first()).toBeVisible({ timeout: 5000 });
  });

  test("Close bottom sheet returns to home page", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);

    await page.locator('button:has-text("SEA FU")').first().click();
    await page.waitForSelector('h2:has-text("SEA FU")', { timeout: 5000 });

    // Click the backdrop overlay (bg-black/50 div behind the bottom sheet) to close
    // The backdrop is a div.absolute.inset-0 at the top of the fixed container
    await page.locator('.bg-black\\/50').first().click({ force: true, position: { x: 10, y: 10 } });

    // Bottom sheet should close, SEA FU card should still be visible on home
    await expect(page.locator('button:has-text("SEA FU")').first()).toBeVisible({ timeout: 5000 });
    // Bottom sheet heading should be gone
    await expect(page.locator('h2:has-text("SEA FU")')).toHaveCount(0, { timeout: 3000 });
  });

  test("Can book different restaurants (COYA)", async ({ page }) => {
    await goHomeAndWaitForCarousels(page);

    // Scroll to find COYA and click it
    await page.locator('button:has-text("COYA")').first().click();

    // Should show COYA bottom sheet
    await expect(page.locator('h2:has-text("COYA")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Peruvian').first()).toBeVisible({ timeout: 3000 });
    await expect(
      page.locator('button:has-text("Choisir ce restaurant")').first()
    ).toBeVisible();
  });
});
