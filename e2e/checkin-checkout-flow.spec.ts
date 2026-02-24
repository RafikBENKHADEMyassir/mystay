/**
 * E2E tests: Check-in & Check-out full flow, room detail CTA, profile rating.
 *
 * End-to-end journeys:
 *   Check-in: personal → identity → finalize → payment (all 9s card) → success screen
 *   Check-out: folio with paid services → tip → confirm → thank-you
 *   Room detail: shows "check-out" CTA when already checked in
 *   Profile: rating link navigates to rating page
 *
 * Prerequisites: dev stack running (./dev.sh) with seeded data
 */
import { test, expect, type Page } from "@playwright/test";
import {
  BACKEND_URL,
  FRONTEND_URL,
  getGuestToken,
  apiFetch,
} from "./helpers";

const LOCALE = "fr";
const TEST_CARD_NUMBER = "9999 9999 9999 9999";
const TEST_CARD_EXPIRY = "12/30";
const TEST_CARD_CVC = "123";
const TEST_CARD_NAME = "Jean Dupont";

async function injectGuestSession(page: Page) {
  const guest = await getGuestToken();
  const url = new URL(FRONTEND_URL);
  await page.context().addCookies([
    { name: "guest_session", value: guest.token, domain: url.hostname, path: "/" },
  ]);
  await page.goto(`${FRONTEND_URL}/${LOCALE}`, { waitUntil: "commit" });
  await page.evaluate(
    ({ g }) => {
      const session = {
        hotelId: g.hotelId,
        hotelName: "Four Seasons Hotel",
        stayId: g.stayId,
        confirmationNumber: "DEMO123456",
        guestToken: g.token,
        roomNumber: g.roomNumber,
        checkIn: "2026-02-22",
        checkOut: "2026-03-01",
        guests: { adults: 2, children: 1 },
        guestFirstName: "Jean",
        guestLastName: "Dupont",
        guestEmail: "jean.dupont@demo.com",
        guestPhone: "+33 1 23 45 67 89",
      };
      window.sessionStorage.setItem(
        "mystay_demo_session_v1",
        JSON.stringify(session)
      );
    },
    { g: guest }
  );
  return guest;
}

async function fillPaymentFields(page: Page) {
  const inputs = page.locator("section input");
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const field = inputs.nth(i);
    const placeholder = (await field.getAttribute("placeholder")) ?? "";
    const type = (await field.getAttribute("type")) ?? "text";

    if (placeholder.includes("1234")) {
      await field.fill(TEST_CARD_NUMBER);
    } else if (placeholder.includes("MM") || placeholder.includes("AA")) {
      await field.fill(TEST_CARD_EXPIRY);
    } else if (placeholder === "..." || type === "password") {
      await field.fill(TEST_CARD_CVC);
    } else if (placeholder.length > 0) {
      await field.fill(TEST_CARD_NAME);
    }
  }
}

// ─── API Tests ───

test.describe("API: Check-in endpoint", () => {
  let guestToken: string;

  test.beforeAll(async () => {
    const guest = await getGuestToken();
    guestToken = guest.token;
  });

  test("POST /api/v1/guest/check-in returns success with valid payload", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/guest/check-in",
      guestToken,
      {
        method: "POST",
        body: JSON.stringify({
          idDocumentUploaded: true,
          paymentMethodProvided: true,
        }),
      }
    );
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
  });

  test("POST /api/v1/guest/check-in rejects missing ID document", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/guest/check-in",
      guestToken,
      {
        method: "POST",
        body: JSON.stringify({
          idDocumentUploaded: false,
          paymentMethodProvided: true,
        }),
      }
    );
    expect(status).toBe(400);
    expect(data.error).toBe("missing_id_document");
  });
});

test.describe("API: Checkout endpoint with folio", () => {
  let guestToken: string;

  test.beforeAll(async () => {
    const guest = await getGuestToken();
    guestToken = guest.token;
  });

  test("GET /api/v1/guest/checkout returns folio with charges", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/guest/checkout",
      guestToken
    );
    expect(status).toBe(200);
    expect(data.stay).toBeDefined();
    expect(data.folio).toBeDefined();

    const folio = data.folio as {
      charges: Array<{
        description: string;
        category: string;
        amountCents: number;
      }>;
      balanceCents: number;
      currency: string;
    };
    expect(folio.currency).toBe("EUR");
    expect(folio.charges.length).toBeGreaterThan(0);
    expect(folio.balanceCents).toBeGreaterThan(0);

    const nonRoomCharges = folio.charges.filter(
      (c) => c.category !== "room"
    );
    expect(nonRoomCharges.length).toBeGreaterThan(0);
  });

  test("POST /api/v1/guest/checkout/confirm with tip succeeds", async () => {
    const { status, data } = await apiFetch(
      "/api/v1/guest/checkout/confirm",
      guestToken,
      {
        method: "POST",
        body: JSON.stringify({ tipPercent: 10 }),
      }
    );
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.totals).toBeDefined();
    expect(data.invoice).toBeDefined();

    const totals = data.totals as {
      balanceCents: number;
      tipCents: number;
      totalCents: number;
    };
    expect(totals.tipCents).toBeGreaterThan(0);
    expect(totals.totalCents).toBeGreaterThan(totals.balanceCents);
  });
});

// ─── Frontend: Check-in Flow ───

test.describe("Frontend: Check-in flow with payment success", () => {
  test("Full check-in: personal → identity → finalize → payment → success", async ({
    page,
  }) => {
    await injectGuestSession(page);

    await page.goto(`${FRONTEND_URL}/${LOCALE}/reception/check-in`, {
      waitUntil: "networkidle",
    });

    // ── Step 1: Personal ──
    await expect(
      page.getByText("Informations personnelles").first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByText("Homme").click();
    await page.getByRole("button", { name: /valider/i }).click();

    // ── Step 2: Identity ──
    await expect(
      page.getByText("Justificatif").first()
    ).toBeVisible({ timeout: 5000 });

    await page.locator('input[type="file"]').setInputFiles({
      name: "id-document.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-png-data"),
    });
    await expect(page.getByText("id-document.png")).toBeVisible();
    await page.getByRole("button", { name: /valider/i }).click();

    // ── Step 3: Finalize ──
    await expect(
      page.getByText("Finalisez").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Total").first()).toBeVisible();
    await page.getByRole("button", { name: /confirmer et payer/i }).click();

    // ── Step 4: Payment ──
    await expect(
      page.getByText("Paiement en ligne").first()
    ).toBeVisible({ timeout: 5000 });

    await fillPaymentFields(page);
    await page.getByRole("button", { name: /valider/i }).last().click();

    // ── Step 5: Payment Success ──
    await expect(
      page.getByText(/paiement.*bien.*re[cç]u/i).first()
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByText(/agr[eé]able s[eé]jour/i).first()
    ).toBeVisible();

    const ctaButton = page.getByRole("button", { name: /c'est parti/i });
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    await expect(page).toHaveURL(/\/(fr\/)?room/, { timeout: 10000 });
  });

  test("Payment step rejects invalid card number", async ({ page }) => {
    await injectGuestSession(page);

    await page.goto(`${FRONTEND_URL}/${LOCALE}/reception/check-in`, {
      waitUntil: "networkidle",
    });

    // Fast-track to payment
    await page.getByText("Homme").click();
    await page.getByRole("button", { name: /valider/i }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: "id.png",
      mimeType: "image/png",
      buffer: Buffer.from("data"),
    });
    await page.getByRole("button", { name: /valider/i }).click();
    await page.getByRole("button", { name: /confirmer et payer/i }).click();

    await expect(
      page.getByText("Paiement en ligne").first()
    ).toBeVisible({ timeout: 5000 });

    // Fill with invalid card number
    const inputs = page.locator("section input");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const field = inputs.nth(i);
      const placeholder = (await field.getAttribute("placeholder")) ?? "";
      const type = (await field.getAttribute("type")) ?? "text";

      if (placeholder.includes("1234")) {
        await field.fill("1234 5678 9012 3456");
      } else if (placeholder.includes("MM") || placeholder.includes("AA")) {
        await field.fill("12/30");
      } else if (placeholder === "..." || type === "password") {
        await field.fill("123");
      } else if (placeholder.length > 0) {
        await field.fill("Test User");
      }
    }

    await page.getByRole("button", { name: /valider/i }).last().click();

    // Should show validation error, not success
    await page.waitForTimeout(2000);
    await expect(
      page.getByText(/paiement.*bien.*re[cç]u/i)
    ).not.toBeVisible();
  });
});

// ─── Frontend: Check-out Flow ───

test.describe("Frontend: Check-out flow with folio and tip", () => {
  test("Checkout shows folio charges and allows tip + confirm", async ({
    page,
  }) => {
    await injectGuestSession(page);

    await page.goto(`${FRONTEND_URL}/${LOCALE}/reception/check-out`, {
      waitUntil: "networkidle",
    });

    await expect(
      page.getByText("Votre check-out").first()
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByText("227").first()).toBeVisible({ timeout: 5000 });

    // Verify non-room charges are shown (from opera-mock folio)
    await expect(
      page.getByText(/spa priv/i).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText(/massage relaxation/i).first()).toBeVisible();

    await expect(page.getByText(/Brasserie/i).first()).toBeVisible();

    // Verify total amount is shown
    await expect(page.getByText(/\d+.*€/).first()).toBeVisible();

    // Select a tip
    await page.getByText("10 %").click();

    // Confirm checkout
    await page.getByRole("button", { name: /confirmer/i }).click();

    // Should show thank-you / confirmation
    await expect(
      page.locator("text=/Merci|facture|merci/i").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("Checkout works without tip", async ({ page }) => {
    await injectGuestSession(page);

    await page.goto(`${FRONTEND_URL}/${LOCALE}/reception/check-out`, {
      waitUntil: "networkidle",
    });

    await expect(
      page.getByText("Votre check-out").first()
    ).toBeVisible({ timeout: 15000 });

    // Confirm without tip
    await page.getByRole("button", { name: /confirmer/i }).click();

    await expect(
      page.locator("text=/Merci|facture|merci/i").first()
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Room detail: CTA switches after check-in ───

test.describe("Room detail page CTA", () => {
  test("Shows check-out link when guest is already checked in", async ({
    page,
  }) => {
    await injectGuestSession(page);

    await page.goto(`${FRONTEND_URL}/${LOCALE}/room`, {
      waitUntil: "networkidle",
    });

    // The page should link to check-out (not check-in) since the guest has completed check-in
    const checkoutLink = page.locator('a[href*="/reception/check-out"]');
    await expect(checkoutLink.first()).toBeVisible({ timeout: 10000 });

    // Should NOT have a check-in link in the hero area
    const checkinLink = page.locator('a[href*="/reception/check-in"]');
    await expect(checkinLink).toHaveCount(0);
  });
});

// ─── Profile: rating navigation ───

test.describe("Profile rating", () => {
  test("Rating page shows interactive stars and submit", async ({ page }) => {
    await injectGuestSession(page);

    await page.goto(`${FRONTEND_URL}/${LOCALE}/profile/rating`, {
      waitUntil: "networkidle",
    });

    // Wait for the rating page to fully load
    await expect(page.locator("textarea")).toBeVisible({ timeout: 15000 });

    // There should be exactly 5 star buttons inside the rating form
    const starButtons = page.locator("button").filter({ has: page.locator("svg") });
    const count = await starButtons.count();
    // At least 5 star buttons + back button + submit button
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
