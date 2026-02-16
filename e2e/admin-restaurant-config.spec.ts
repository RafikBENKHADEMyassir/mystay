/**
 * Admin E2E tests: Restaurant configuration in Upselling (home-carousels).
 *
 * Tests the admin staff workflow:
 *   1. Login to admin panel
 *   2. Navigate to /home-carousels (Upselling page)
 *   3. View sections and items
 *   4. Restaurant-type items show config editor
 *   5. Edit restaurant config (description, hours, menu sections)
 *   6. Save config
 *
 * Prerequisites: dev stack running (./dev.sh)
 */
import { test, expect, type BrowserContext } from "@playwright/test";
import { ADMIN_URL, BACKEND_URL, getStaffToken, STAFF_EMAIL, STAFF_PASSWORD } from "./helpers";

/**
 * Inject staff authentication by setting the cookie directly.
 * The admin app reads `mystay_staff_token` cookie (httpOnly).
 */
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

/**
 * Navigate to home-carousels and wait for the page to load.
 */
async function goToHomeCarousels(page: import("@playwright/test").Page) {
  await page.goto(`${ADMIN_URL}/home-carousels`, { waitUntil: "networkidle" });
  await expect(page.locator("h1").first()).toContainText("Upselling", { timeout: 15000 });
}

/**
 * Scroll to the culinary section and wait for SEA FU to appear.
 */
async function scrollToCulinary(page: import("@playwright/test").Page) {
  // The culinary section may be below the fold; scroll to it
  const culinaryHeading = page.locator("text=culinary").first();
  await culinaryHeading.scrollIntoViewIfNeeded();
  await expect(culinaryHeading).toBeVisible({ timeout: 5000 });
}

test.describe("Admin: Upselling / Home Carousels", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsStaff(context);
  });

  test("Login page works and redirects to dashboard", async ({ page, context }) => {
    // Clear cookies to test login flow from scratch
    await context.clearCookies();

    await page.goto(`${ADMIN_URL}/login`);

    // The email input has id="email"
    await expect(page.locator("#email")).toBeVisible({ timeout: 10000 });

    // Fill credentials (already prefilled but we fill again to be explicit)
    await page.locator("#email").fill(STAFF_EMAIL);
    await page.locator("#password").fill(STAFF_PASSWORD);

    // Submit
    await page.locator('button:has-text("Sign in")').click();

    // Should redirect to dashboard (root /)
    await page.waitForURL(/\/$/, { timeout: 15000 });
  });

  test("Home carousels page loads with sections", async ({ page }) => {
    await goToHomeCarousels(page);

    // Should show at least one section (tailored is first)
    await expect(page.locator("text=tailored").first()).toBeVisible({ timeout: 5000 });

    // Should also have culinary section (scroll down)
    await scrollToCulinary(page);
  });

  test("Culinary section shows restaurant items with SEA FU", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    // Should show SEA FU as an item label
    const seaFuInput = page.locator('input[value="SEA FU"]').first();
    await seaFuInput.scrollIntoViewIfNeeded();
    await expect(seaFuInput).toBeVisible({ timeout: 5000 });
  });

  test("Restaurant-type items show RestaurantConfigEditor", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    // Should show the restaurant config header (amber colored)
    const configLabel = page.locator("text=Restaurant Menu Config").first();
    await configLabel.scrollIntoViewIfNeeded();
    await expect(configLabel).toBeVisible({ timeout: 5000 });

    // Should show the RestaurantConfigEditor heading
    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();
    await expect(configHeading).toBeVisible({ timeout: 3000 });

    // Should show the save config button
    const saveBtn = page.locator('button:has-text("Save config")').first();
    await saveBtn.scrollIntoViewIfNeeded();
    await expect(saveBtn).toBeVisible();
  });

  test("RestaurantConfigEditor shows existing config fields", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    // Scroll to the config editor
    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();

    // Should show the description field with "seafood"
    const configContainer = configHeading.locator("../..");
    const descriptionField = configContainer.locator("textarea").first();
    await descriptionField.scrollIntoViewIfNeeded();
    await expect(descriptionField).toBeVisible();
    const descValue = await descriptionField.inputValue();
    expect(descValue.toLowerCase()).toContain("seafood");

    // Should show the hours field with "ouvert"
    const hoursLabel = configContainer.locator("text=Hours").first();
    await hoursLabel.scrollIntoViewIfNeeded();
    const hoursInput = hoursLabel.locator("..").locator("input").first();
    await expect(hoursInput).toBeVisible();
    const hoursValue = await hoursInput.inputValue();
    expect(hoursValue.toLowerCase()).toContain("ouvert");
  });

  test("Menu sections are displayed with titles and prices", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    // Scroll to config editor
    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();

    // Should show menu section titles from seed data
    const menuDuJour = page.locator('input[value="Menu du jour"]').first();
    await menuDuJour.scrollIntoViewIfNeeded();
    await expect(menuDuJour).toBeVisible({ timeout: 5000 });

    // Menu du jour should have its price
    const priceInput = page.locator('input[value="32,99 €"]').first();
    await priceInput.scrollIntoViewIfNeeded();
    await expect(priceInput).toBeVisible();

    // Other sections
    const entreesInput = page.locator('input[value="Entrées"]').first();
    await entreesInput.scrollIntoViewIfNeeded();
    await expect(entreesInput).toBeVisible();
  });

  test("Can edit restaurant description", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();
    const configContainer = configHeading.locator("../..");
    const descriptionField = configContainer.locator("textarea").first();
    await descriptionField.scrollIntoViewIfNeeded();

    // Clear and type new description
    const originalValue = await descriptionField.inputValue();
    await descriptionField.fill("Updated test description - premium seafood experience");
    await expect(descriptionField).toHaveValue("Updated test description - premium seafood experience");

    // Restore original value
    await descriptionField.fill(originalValue);
  });

  test("Can add a new menu section", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();
    const configContainer = configHeading.locator("../..");

    // Count existing section title inputs
    const sectionTitleInputs = configContainer.locator(
      'input[placeholder="Section title (e.g. Menu du jour)"]'
    );
    const sectionsBefore = await sectionTitleInputs.count();

    // Click "Add section"
    const addSectionBtn = configContainer.locator('button:has-text("Add section")').first();
    await addSectionBtn.scrollIntoViewIfNeeded();
    await addSectionBtn.click();

    // Should have one more section
    await expect(sectionTitleInputs).toHaveCount(sectionsBefore + 1, { timeout: 3000 });

    // Fill the new section title
    const newSectionInput = sectionTitleInputs.last();
    await newSectionInput.scrollIntoViewIfNeeded();
    await newSectionInput.fill("Spécialités du Chef");
    await expect(newSectionInput).toHaveValue("Spécialités du Chef");
  });

  test("Can add menu items to a section", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();
    const configContainer = configHeading.locator("../..");

    // Click "Item" button on the first menu section card
    const itemBtns = configContainer.locator('button:has-text("Item")');
    const firstItemBtn = itemBtns.first();
    await firstItemBtn.scrollIntoViewIfNeeded();
    await firstItemBtn.click();

    // A new item input should appear
    const itemNameInputs = configContainer.locator('input[placeholder="Item name"]');
    const newItemInput = itemNameInputs.last();
    await newItemInput.scrollIntoViewIfNeeded();
    await expect(newItemInput).toBeVisible();
    await newItemInput.fill("Sashimi platter");

    // Fill price
    const priceInput = newItemInput.locator("..").locator('input[placeholder="Price"]');
    await expect(priceInput).toBeVisible();
    await priceInput.fill("24,00 €");

    await expect(newItemInput).toHaveValue("Sashimi platter");
    await expect(priceInput).toHaveValue("24,00 €");
  });

  test("Can add subsections to a menu section", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();
    const configContainer = configHeading.locator("../..");

    // Click "Subsection" button on the first section
    const subsectionBtn = configContainer.locator('button:has-text("Subsection")').first();
    await subsectionBtn.scrollIntoViewIfNeeded();
    await subsectionBtn.click();

    // New subsection title input should appear
    const subTitleInputs = configContainer.locator('input[placeholder="Subsection title"]');
    const newSubInput = subTitleInputs.last();
    await newSubInput.scrollIntoViewIfNeeded();
    await expect(newSubInput).toBeVisible();
    await newSubInput.fill("Garnitures au choix");
    await expect(newSubInput).toHaveValue("Garnitures au choix");

    // Add an item to the new subsection
    const addItemBtns = configContainer.locator('button:has-text("Add item")');
    const lastAddItemBtn = addItemBtns.last();
    await lastAddItemBtn.scrollIntoViewIfNeeded();
    await lastAddItemBtn.click();

    const itemInputs = configContainer.locator('input[placeholder="Item name"]');
    const newItemInput = itemInputs.last();
    await newItemInput.scrollIntoViewIfNeeded();
    await expect(newItemInput).toBeVisible();
    await newItemInput.fill("Riz basmati");
    await expect(newItemInput).toHaveValue("Riz basmati");
  });

  test("Save config button persists changes (full round-trip)", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    const configHeading = page.locator("text=Restaurant Configuration").first();
    await configHeading.scrollIntoViewIfNeeded();
    const configContainer = configHeading.locator("../..");

    // Edit the description
    const descriptionField = configContainer.locator("textarea").first();
    await descriptionField.scrollIntoViewIfNeeded();
    const originalDesc = await descriptionField.inputValue();
    const testDesc = `E2E test - ${Date.now()}`;
    await descriptionField.fill(testDesc);

    // Click "Save config"
    const saveBtn = configContainer.locator('button:has-text("Save config")').first();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Should show success message
    await expect(
      configContainer.locator("text=Restaurant config saved!").first()
    ).toBeVisible({ timeout: 10000 });

    // Reload the page to verify persistence
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("text=Restaurant Configuration", { timeout: 15000 });

    const reloadedConfigHeading = page.locator("text=Restaurant Configuration").first();
    await reloadedConfigHeading.scrollIntoViewIfNeeded();
    const reloadedContainer = reloadedConfigHeading.locator("../..");
    const reloadedDesc = reloadedContainer.locator("textarea").first();
    await reloadedDesc.scrollIntoViewIfNeeded();
    await expect(reloadedDesc).toHaveValue(testDesc, { timeout: 5000 });

    // Restore original description
    await reloadedDesc.fill(originalDesc);
    const restoreSaveBtn = reloadedContainer.locator('button:has-text("Save config")').first();
    await restoreSaveBtn.scrollIntoViewIfNeeded();
    await restoreSaveBtn.click();
    await expect(
      reloadedContainer.locator("text=Restaurant config saved!").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Item type selector has restaurant option", async ({ page }) => {
    await goToHomeCarousels(page);
    await scrollToCulinary(page);

    // Find type selects on the page
    const typeSelects = page.locator('select[name="type"]');
    const count = await typeSelects.count();
    expect(count).toBeGreaterThan(0);

    // At least one should have value "restaurant" (SEA FU and others)
    let foundRestaurant = false;
    for (let i = 0; i < count; i++) {
      const val = await typeSelects.nth(i).inputValue();
      if (val === "restaurant") {
        foundRestaurant = true;
        break;
      }
    }
    expect(foundRestaurant).toBe(true);
  });

  test("Sidebar navigation includes Upselling link", async ({ page, browserName }, testInfo) => {
    // Sidebar is hidden on mobile viewport
    test.skip(testInfo.project.name === "mobile", "Sidebar not visible on mobile");

    await goToHomeCarousels(page);

    // The sidebar should have an "Upselling" link that is highlighted
    const upsellingLink = page.locator('a[href="/home-carousels"]').first();
    await expect(upsellingLink).toBeVisible({ timeout: 5000 });
    await expect(upsellingLink).toContainText("Upselling");
  });
});

test.describe("Admin: API - Experience Items CRUD", () => {
  let staffToken: string;

  test.beforeAll(async () => {
    staffToken = await getStaffToken();
  });

  test("GET /api/v1/staff/experiences returns sections with restaurant items", async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/staff/experiences`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.sections).toBeDefined();

    const culinary = data.sections.find((s: { slug: string }) => s.slug === "culinary");
    expect(culinary).toBeDefined();

    const seaFu = culinary.items.find((i: { label: string }) => i.label === "SEA FU");
    expect(seaFu).toBeDefined();
    expect(seaFu.type).toBe("restaurant");
    expect(seaFu.restaurantConfig).toBeDefined();
    expect(seaFu.restaurantConfig.menuSections).toBeDefined();
  });

  test("PATCH /api/v1/staff/experiences/items/:id updates restaurant config", async () => {
    // First get current items
    const getRes = await fetch(`${BACKEND_URL}/api/v1/staff/experiences`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const getData = await getRes.json();
    const culinary = getData.sections.find((s: { slug: string }) => s.slug === "culinary");
    const seaFu = culinary.items.find((i: { label: string }) => i.label === "SEA FU");

    // Update the config
    const testTimestamp = `API test ${Date.now()}`;
    const updatedConfig = {
      ...seaFu.restaurantConfig,
      description: testTimestamp,
    };

    const patchRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/experiences/items/${seaFu.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ restaurantConfig: updatedConfig }),
      }
    );
    expect(patchRes.ok).toBe(true);
    const patchData = await patchRes.json();
    expect(patchData.item.restaurantConfig.description).toBe(testTimestamp);

    // Verify by fetching again
    const verifyRes = await fetch(`${BACKEND_URL}/api/v1/staff/experiences`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const verifyData = await verifyRes.json();
    const verifyItem = verifyData.sections
      .find((s: { slug: string }) => s.slug === "culinary")
      .items.find((i: { id: string }) => i.id === seaFu.id);
    expect(verifyItem.restaurantConfig.description).toBe(testTimestamp);

    // Restore original
    await fetch(`${BACKEND_URL}/api/v1/staff/experiences/items/${seaFu.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ restaurantConfig: seaFu.restaurantConfig }),
    });
  });

  test("PATCH /api/v1/staff/experiences/items/:id can change item type", async () => {
    // Get a non-restaurant item to test type change
    const getRes = await fetch(`${BACKEND_URL}/api/v1/staff/experiences`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const getData = await getRes.json();

    // Find any default-type item
    let testItem: { id: string; type: string } | undefined;
    for (const section of getData.sections) {
      const found = section.items.find((i: { type: string }) => i.type === "default");
      if (found) {
        testItem = found;
        break;
      }
    }

    if (!testItem) {
      test.skip();
      return;
    }

    // Change to restaurant type
    const patchRes = await fetch(
      `${BACKEND_URL}/api/v1/staff/experiences/items/${testItem.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ type: "restaurant" }),
      }
    );
    expect(patchRes.ok).toBe(true);
    const patchData = await patchRes.json();
    expect(patchData.item.type).toBe("restaurant");

    // Restore original type
    await fetch(`${BACKEND_URL}/api/v1/staff/experiences/items/${testItem.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ type: testItem.type }),
    });
  });
});
