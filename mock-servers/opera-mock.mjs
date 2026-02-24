/**
 * Opera PMS Mock Server
 * 
 * Simulates Oracle Opera PMS API for development and testing.
 * Provides comprehensive endpoints for:
 * - Reservations (CRUD, arrivals, departures)
 * - Guest profiles
 * - Room inventory and status
 * - Folio/billing
 * - Check-in/check-out
 * 
 * Port: 4010
 */

import { createServer } from "node:http";

const PORT = Number(process.env.OPERA_PORT ?? 4010);
const HOST = process.env.OPERA_HOST ?? "127.0.0.1";

// =============================================================================
// MOCK DATA - Aligned with MyStay seed data
// =============================================================================

function getDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

const TODAY = getDate(0);
const TOMORROW = getDate(1);
const YESTERDAY = getDate(-1);

const data = {
  // Properties (Hotels)
  properties: {
    "FS-PARIS": {
      id: "FS-PARIS",
      code: "FSGV",
      name: "Four Seasons Hotel George V",
      address: "31 Avenue George V",
      city: "Paris",
      country: "France",
      timezone: "Europe/Paris",
      currency: "EUR",
      starRating: 5,
      totalRooms: 244,
      checkInTime: "15:00",
      checkOutTime: "12:00",
      phone: "+33 1 49 52 70 00",
      email: "reservations.paris@fourseasons.com"
    },
    "FS-GENEVA": {
      id: "FS-GENEVA",
      code: "FSGE",
      name: "Four Seasons Hotel des Bergues",
      address: "33 Quai des Bergues",
      city: "Geneva",
      country: "Switzerland",
      timezone: "Europe/Zurich",
      currency: "CHF",
      starRating: 5,
      totalRooms: 81,
      checkInTime: "15:00",
      checkOutTime: "12:00",
      phone: "+41 22 908 70 00",
      email: "reservations.geneva@fourseasons.com"
    }
  },

  // Guest Profiles
  guests: {
    "GUEST-SOPHIE": {
      id: "GUEST-SOPHIE",
      profileId: "PROF-12345",
      firstName: "Sophie",
      lastName: "Martin",
      email: "sophie.martin@email.com",
      phone: "+33 6 12 34 56 78",
      nationality: "FR",
      language: "fr",
      dateOfBirth: "1985-03-15",
      vipCode: "VG", // VIP Gold
      loyaltyNumber: "FS-GOLD-12345",
      preferences: {
        roomType: "suite",
        floorPreference: "high",
        pillow: "soft",
        newspaper: "Le Monde",
        dietary: ["vegetarian"]
      },
      totalStays: 12,
      lastVisit: "2025-11-15"
    },
    "GUEST-JAMES": {
      id: "GUEST-JAMES",
      profileId: "PROF-23456",
      firstName: "James",
      lastName: "Wilson",
      email: "james.wilson@corp.com",
      phone: "+1 212 555 0123",
      nationality: "US",
      language: "en",
      dateOfBirth: "1978-07-22",
      vipCode: "VP", // VIP Platinum
      loyaltyNumber: "FS-PLAT-98765",
      companyName: "Wilson & Associates",
      preferences: {
        roomType: "junior-suite",
        floorPreference: "high",
        pillow: "firm",
        newspaper: "WSJ"
      },
      totalStays: 45,
      lastVisit: "2025-12-01"
    },
    "GUEST-YUKI": {
      id: "GUEST-YUKI",
      profileId: "PROF-34567",
      firstName: "Yuki",
      lastName: "Tanaka",
      email: "yuki.tanaka@example.jp",
      phone: "+81 90 1234 5678",
      nationality: "JP",
      language: "ja",
      dateOfBirth: "1990-11-08",
      vipCode: "VS", // VIP Silver
      loyaltyNumber: "FS-SILV-54321",
      preferences: {
        roomType: "deluxe",
        dietary: ["pescatarian"]
      },
      totalStays: 5,
      lastVisit: "2025-09-20"
    },
    "GUEST-EMMA": {
      id: "GUEST-EMMA",
      profileId: "PROF-45678",
      firstName: "Emma",
      lastName: "Dubois",
      email: "emma.dubois@gmail.com",
      phone: "+33 6 98 76 54 32",
      nationality: "FR",
      language: "fr",
      dateOfBirth: "1995-06-25",
      vipCode: null,
      preferences: {},
      totalStays: 1
    },
    "GUEST-MOHAMMED": {
      id: "GUEST-MOHAMMED",
      profileId: "PROF-56789",
      firstName: "Mohammed",
      lastName: "Al-Rashid",
      email: "m.alrashid@business.ae",
      phone: "+971 50 123 4567",
      nationality: "AE",
      language: "ar",
      dateOfBirth: "1982-01-30",
      vipCode: "VP",
      loyaltyNumber: "FS-PLAT-11111",
      preferences: {
        roomType: "presidential-suite",
        floorPreference: "top",
        dietary: ["halal"]
      },
      totalStays: 28,
      lastVisit: "2025-12-10"
    }
  },

  // Reservations - Aligned with MyStay seed
  reservations: {
    // Sophie Martin - Checked in at Four Seasons Paris
    "RES-SOPHIE-PARIS": {
      id: "RES-SOPHIE-PARIS",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025A1B2C",
      status: "CHECKED_IN",
      source: "DIRECT",
      guestId: "GUEST-SOPHIE",
      guest: {
        firstName: "Sophie",
        lastName: "Martin",
        email: "sophie.martin@email.com",
        phone: "+33 6 12 34 56 78",
        vipCode: "VG"
      },
      arrival: TODAY,
      departure: getDate(3),
      nights: 3,
      roomType: "SUITE",
      roomTypeDescription: "One Bedroom Suite",
      roomNumber: "701",
      rateCode: "RACK",
      rateAmount: 1500,
      currency: "EUR",
      adults: 2,
      children: 0,
      specialRequests: "High floor, quiet room, champagne upon arrival",
      packages: ["BFST", "SPA50"], // Breakfast, Spa Credit
      checkedInAt: new Date().toISOString(),
      createdAt: "2025-01-10T14:30:00Z"
    },
    // James Wilson - Arriving tomorrow
    "RES-JAMES-PARIS": {
      id: "RES-JAMES-PARIS",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025D3E4F",
      status: "CONFIRMED",
      source: "BOOKING.COM",
      guestId: "GUEST-JAMES",
      guest: {
        firstName: "James",
        lastName: "Wilson",
        email: "james.wilson@corp.com",
        phone: "+1 212 555 0123",
        vipCode: "VP"
      },
      arrival: TOMORROW,
      departure: getDate(4),
      nights: 3,
      roomType: "JRSUITE",
      roomTypeDescription: "Junior Suite",
      roomNumber: null,
      rateCode: "OTA",
      rateAmount: 1200,
      currency: "EUR",
      adults: 1,
      children: 0,
      specialRequests: "Late check-in expected (around 10pm)",
      packages: ["BFST"],
      createdAt: "2025-01-12T09:15:00Z"
    },
    // Yuki Tanaka - Arriving today
    "RES-YUKI-PARIS": {
      id: "RES-YUKI-PARIS",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025G5H6I",
      status: "CONFIRMED",
      source: "EXPEDIA",
      guestId: "GUEST-YUKI",
      guest: {
        firstName: "Yuki",
        lastName: "Tanaka",
        email: "yuki.tanaka@example.jp",
        phone: "+81 90 1234 5678",
        vipCode: "VS"
      },
      arrival: TODAY,
      departure: getDate(5),
      nights: 5,
      roomType: "DELUXE",
      roomTypeDescription: "Deluxe Room",
      roomNumber: null,
      rateCode: "OTA",
      rateAmount: 850,
      currency: "EUR",
      adults: 2,
      children: 0,
      specialRequests: "Japanese green tea in room",
      packages: [],
      createdAt: "2025-01-08T16:45:00Z"
    },
    // Emma Dubois - Arriving in 2 days
    "RES-EMMA-PARIS": {
      id: "RES-EMMA-PARIS",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025M9N0P",
      status: "CONFIRMED",
      source: "DIRECT",
      guestId: "GUEST-EMMA",
      guest: {
        firstName: "Emma",
        lastName: "Dubois",
        email: "emma.dubois@gmail.com",
        phone: "+33 6 98 76 54 32"
      },
      arrival: getDate(2),
      departure: getDate(4),
      nights: 2,
      roomType: "SUPERIOR",
      roomTypeDescription: "Superior Room",
      roomNumber: null,
      rateCode: "PROMO",
      rateAmount: 650,
      currency: "EUR",
      adults: 1,
      children: 0,
      specialRequests: "Anniversary celebration",
      packages: ["BFST"],
      createdAt: "2025-01-15T20:30:00Z"
    },
    // Mohammed Al-Rashid - VIP, checked in yesterday
    "RES-MOHAMMED-PARIS": {
      id: "RES-MOHAMMED-PARIS",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025J7K8L",
      status: "CHECKED_IN",
      source: "DIRECT",
      guestId: "GUEST-MOHAMMED",
      guest: {
        firstName: "Mohammed",
        lastName: "Al-Rashid",
        email: "m.alrashid@business.ae",
        phone: "+971 50 123 4567",
        vipCode: "VP"
      },
      arrival: YESTERDAY,
      departure: getDate(2),
      nights: 3,
      roomType: "PRESIDENTIAL",
      roomTypeDescription: "Presidential Suite",
      roomNumber: "PH1",
      rateCode: "RACK",
      rateAmount: 8500,
      currency: "EUR",
      adults: 2,
      children: 2,
      specialRequests: "Halal meals only, connecting rooms for family, personal butler",
      packages: ["BFST", "SPA-UNL", "AIRPORT", "BUTLER"],
      checkedInAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: "2025-01-05T11:00:00Z"
    },
    // Demo stay - linked to S-DEMO in seed.sql
    "RES-DEMO": {
      id: "RES-DEMO",
      propertyId: "FS-PARIS",
      confirmationNumber: "DEMO123456",
      status: "RESERVED",
      source: "DIRECT",
      guestId: "GUEST-DEMO",
      guest: {
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@demo.com",
        phone: "+33 1 23 45 67 89",
        vipLevel: "silver"
      },
      arrival: YESTERDAY,
      departure: getDate(7),
      nights: 8,
      roomType: "DELUXE",
      roomTypeDescription: "Sea View Suite",
      roomNumber: "227",
      rateCode: "BEST-AVAIL",
      rateAmount: 1200,
      currency: "EUR",
      adults: 2,
      children: 1,
      specialRequests: "Late check-out preferred",
      packages: [],
      createdAt: "2025-01-15T10:00:00Z"
    }
  },

  // Rooms
  rooms: {
    // Floor 7 - Suites
    "FS-PARIS-701": { id: "FS-PARIS-701", propertyId: "FS-PARIS", number: "701", type: "SUITE", floor: 7, status: "OCCUPIED", guestId: "GUEST-SOPHIE", features: ["king-bed", "city-view", "balcony", "jacuzzi"], maxOccupancy: 3, sqm: 75 },
    "FS-PARIS-702": { id: "FS-PARIS-702", propertyId: "FS-PARIS", number: "702", type: "SUITE", floor: 7, status: "CLEAN", guestId: null, features: ["king-bed", "garden-view", "balcony"], maxOccupancy: 3, sqm: 70 },
    "FS-PARIS-703": { id: "FS-PARIS-703", propertyId: "FS-PARIS", number: "703", type: "JRSUITE", floor: 7, status: "CLEAN", guestId: null, features: ["king-bed", "city-view"], maxOccupancy: 2, sqm: 55 },
    // Floor 6 - Deluxe
    "FS-PARIS-601": { id: "FS-PARIS-601", propertyId: "FS-PARIS", number: "601", type: "DELUXE", floor: 6, status: "DIRTY", guestId: null, features: ["king-bed", "city-view"], maxOccupancy: 2, sqm: 45 },
    "FS-PARIS-602": { id: "FS-PARIS-602", propertyId: "FS-PARIS", number: "602", type: "DELUXE", floor: 6, status: "CLEAN", guestId: null, features: ["twin-beds", "garden-view"], maxOccupancy: 2, sqm: 45 },
    // Floor 5 - Superior
    "FS-PARIS-501": { id: "FS-PARIS-501", propertyId: "FS-PARIS", number: "501", type: "SUPERIOR", floor: 5, status: "CLEAN", guestId: null, features: ["king-bed", "courtyard-view"], maxOccupancy: 2, sqm: 38 },
    "FS-PARIS-502": { id: "FS-PARIS-502", propertyId: "FS-PARIS", number: "502", type: "SUPERIOR", floor: 5, status: "MAINTENANCE", guestId: null, features: ["twin-beds", "courtyard-view"], maxOccupancy: 2, sqm: 38 },
    // Floor 2 - Deluxe
    "FS-PARIS-227": { id: "FS-PARIS-227", propertyId: "FS-PARIS", number: "227", type: "DELUXE", floor: 2, status: "OCCUPIED", guestId: null, features: ["king-bed", "courtyard-view"], maxOccupancy: 3, sqm: 45 },
    // Penthouse
    "FS-PARIS-PH1": { id: "FS-PARIS-PH1", propertyId: "FS-PARIS", number: "PH1", type: "PRESIDENTIAL", floor: 8, status: "OCCUPIED", guestId: "GUEST-MOHAMMED", features: ["king-bed", "panoramic-view", "terrace", "private-elevator", "dining-room", "kitchen"], maxOccupancy: 6, sqm: 350 }
  },

  // Folios (Billing)
  folios: {
    "RES-SOPHIE-PARIS": {
      reservationId: "RES-SOPHIE-PARIS",
      currency: "EUR",
      charges: [
        { id: "CHG-001", date: TODAY, description: "Room charge - Suite", amount: 1500, category: "ROOM" },
        { id: "CHG-002", date: TODAY, description: "Breakfast - Le Cinq", amount: 95, category: "FB" },
        { id: "CHG-003", date: TODAY, description: "Mini bar", amount: 45, category: "MINIBAR" },
        { id: "CHG-004", date: TODAY, description: "Spa - Deep tissue massage", amount: 220, category: "SPA" }
      ],
      payments: [
        { id: "PAY-001", date: "2025-01-10", description: "Deposit", amount: 1500, method: "CC" }
      ],
      balance: 360
    },
    "RES-MOHAMMED-PARIS": {
      reservationId: "RES-MOHAMMED-PARIS",
      currency: "EUR",
      charges: [
        { id: "CHG-010", date: YESTERDAY, description: "Room charge - Presidential Suite", amount: 8500, category: "ROOM" },
        { id: "CHG-011", date: YESTERDAY, description: "Private dining - 6 guests", amount: 1800, category: "FB" },
        { id: "CHG-012", date: YESTERDAY, description: "In-room massage x2", amount: 600, category: "SPA" },
        { id: "CHG-013", date: TODAY, description: "Room charge - Presidential Suite", amount: 8500, category: "ROOM" },
        { id: "CHG-014", date: TODAY, description: "Breakfast in-room", amount: 380, category: "FB" },
        { id: "CHG-015", date: TODAY, description: "Limousine service", amount: 750, category: "TRANSPORT" }
      ],
      payments: [
        { id: "PAY-010", date: "2025-01-05", description: "Advance payment", amount: 15000, method: "WIRE" }
      ],
      balance: 5530
    },
    "RES-DEMO": {
      reservationId: "RES-DEMO",
      currency: "EUR",
      charges: [
        { id: "CHG-D01", date: YESTERDAY, description: "Forfait 1h spa privé", amount: 55, category: "SPA" },
        { id: "CHG-D02", date: YESTERDAY, description: "Forfait 2h massage relaxation", amount: 135, category: "SPA" },
        { id: "CHG-D03", date: TODAY, description: "Brasserie dinner", amount: 120, category: "FB" },
        { id: "CHG-D04", date: TODAY, description: "Room Service - Breakfast", amount: 65, category: "FB" },
        { id: "CHG-D05", date: TODAY, description: "Minibar", amount: 35, category: "FB" }
      ],
      payments: [],
      balance: 410
    }
  },

  // Room Service Menu
  menu: {
    id: "MENU-FSPARIS",
    name: "In-Room Dining",
    categories: [
      {
        id: "BREAKFAST",
        name: "Breakfast",
        available: "06:30-11:00",
        items: [
          { id: "BF-001", name: "Continental Breakfast", description: "Croissants, pain au chocolat, fresh bread, butter, jam, orange juice, coffee or tea", price: 45, currency: "EUR", tags: ["vegetarian"] },
          { id: "BF-002", name: "American Breakfast", description: "Two eggs any style, bacon or sausage, hash browns, toast, juice, coffee", price: 55, currency: "EUR" },
          { id: "BF-003", name: "Healthy Start", description: "Açaí bowl, fresh fruits, Greek yogurt, granola, green smoothie", price: 42, currency: "EUR", tags: ["vegetarian", "gluten-free"] },
          { id: "BF-004", name: "Eggs Benedict Royale", description: "Poached eggs, smoked salmon, hollandaise, English muffin", price: 48, currency: "EUR" },
          { id: "BF-005", name: "French Toast", description: "Brioche French toast, maple syrup, fresh berries, whipped cream", price: 38, currency: "EUR", tags: ["vegetarian"] }
        ]
      },
      {
        id: "STARTERS",
        name: "Starters & Salads",
        available: "11:00-23:00",
        items: [
          { id: "ST-001", name: "Caesar Salad", description: "Romaine, parmesan, croutons, Caesar dressing", price: 28, currency: "EUR" },
          { id: "ST-002", name: "Burrata Caprese", description: "Fresh burrata, heirloom tomatoes, basil, aged balsamic", price: 32, currency: "EUR", tags: ["vegetarian", "gluten-free"] },
          { id: "ST-003", name: "French Onion Soup", description: "Classic gratinée with Gruyère crouton", price: 24, currency: "EUR" },
          { id: "ST-004", name: "Tuna Tartare", description: "Yellowfin tuna, avocado, sesame, crispy wontons", price: 36, currency: "EUR" }
        ]
      },
      {
        id: "MAINS",
        name: "Main Courses",
        available: "12:00-23:00",
        items: [
          { id: "MC-001", name: "Club Sandwich", description: "Triple-decker, chicken, bacon, egg, fries", price: 38, currency: "EUR" },
          { id: "MC-002", name: "Wagyu Burger", description: "200g Wagyu beef, truffle aioli, aged cheddar, brioche bun", price: 48, currency: "EUR" },
          { id: "MC-003", name: "Grilled Sea Bass", description: "Mediterranean vegetables, olive oil, lemon", price: 52, currency: "EUR", tags: ["gluten-free"] },
          { id: "MC-004", name: "Beef Tenderloin", description: "250g filet, béarnaise, pommes purée, seasonal vegetables", price: 68, currency: "EUR", tags: ["gluten-free"] },
          { id: "MC-005", name: "Truffle Risotto", description: "Carnaroli rice, black truffle, parmesan foam", price: 56, currency: "EUR", tags: ["vegetarian", "gluten-free"] },
          { id: "MC-006", name: "Lobster Linguine", description: "Half Maine lobster, cherry tomatoes, basil, white wine", price: 72, currency: "EUR" }
        ]
      },
      {
        id: "DESSERTS",
        name: "Desserts",
        available: "12:00-23:30",
        items: [
          { id: "DS-001", name: "Chocolate Fondant", description: "Warm chocolate cake, vanilla ice cream", price: 22, currency: "EUR", tags: ["vegetarian"] },
          { id: "DS-002", name: "Crème Brûlée", description: "Classic vanilla crème brûlée", price: 18, currency: "EUR", tags: ["vegetarian", "gluten-free"] },
          { id: "DS-003", name: "Fresh Fruit Platter", description: "Seasonal fruits, passion fruit coulis", price: 24, currency: "EUR", tags: ["vegan", "gluten-free"] },
          { id: "DS-004", name: "Cheese Selection", description: "French artisanal cheeses, honeycomb, walnut bread", price: 32, currency: "EUR", tags: ["vegetarian"] }
        ]
      },
      {
        id: "BEVERAGES",
        name: "Beverages",
        available: "24/7",
        items: [
          { id: "BV-001", name: "Espresso / Double Espresso", price: 8, currency: "EUR", tags: ["vegan"] },
          { id: "BV-002", name: "Cappuccino / Latte", price: 10, currency: "EUR" },
          { id: "BV-003", name: "Selection of Teas", price: 9, currency: "EUR", tags: ["vegan"] },
          { id: "BV-004", name: "Fresh Orange Juice", price: 14, currency: "EUR", tags: ["vegan"] },
          { id: "BV-005", name: "Smoothie", description: "Choice of tropical, berry, or green", price: 16, currency: "EUR", tags: ["vegan"] }
        ]
      }
    ]
  }
};

// =============================================================================
// HTTP UTILITIES
// =============================================================================

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  const raw = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(raw); } catch { return null; }
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(req, res) {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600"
    });
    res.end();
    return;
  }

  console.log(`[Opera PMS] ${req.method} ${url.pathname}`);

  // Health check
  if (url.pathname === "/health") {
    sendJson(res, 200, { status: "ok", service: "opera-mock", timestamp: new Date().toISOString() });
    return;
  }

  // ==========================================================================
  // PROPERTY ENDPOINTS
  // ==========================================================================

  if (req.method === "GET" && url.pathname === "/v1/properties") {
    sendJson(res, 200, { properties: Object.values(data.properties) });
    return;
  }

  const propertyMatch = url.pathname.match(/^\/v1\/properties\/([^/]+)$/);
  if (req.method === "GET" && propertyMatch) {
    const property = data.properties[propertyMatch[1]];
    if (!property) return sendJson(res, 404, { error: "PROPERTY_NOT_FOUND" });
    sendJson(res, 200, { property });
    return;
  }

  // ==========================================================================
  // RESERVATION ENDPOINTS
  // ==========================================================================

  // List/search reservations
  const resListMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations$/);
  if (req.method === "GET" && resListMatch) {
    const resortId = resListMatch[1];
    const confirmationNumber = url.searchParams.get("confirmationNumber");
    const guestEmail = url.searchParams.get("guestEmail");
    const status = url.searchParams.get("status");

    let reservations = Object.values(data.reservations).filter(r => r.propertyId === resortId);

    if (confirmationNumber) {
      reservations = reservations.filter(r => r.confirmationNumber === confirmationNumber);
    }
    if (guestEmail) {
      reservations = reservations.filter(r => r.guest?.email?.toLowerCase() === guestEmail.toLowerCase());
    }
    if (status) {
      reservations = reservations.filter(r => r.status === status);
    }

    sendJson(res, 200, { reservations, count: reservations.length });
    return;
  }

  // Get reservation by ID
  const resDetailMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)$/);
  if (req.method === "GET" && resDetailMatch) {
    const reservation = data.reservations[resDetailMatch[2]];
    if (!reservation) return sendJson(res, 404, { error: "RESERVATION_NOT_FOUND" });
    sendJson(res, 200, { reservation });
    return;
  }

  // Create reservation
  if (req.method === "POST" && resListMatch) {
    const body = await readJson(req);
    const id = `RES-${Date.now()}`;
    const confirmationNumber = body.confirmationNumber ?? `CONF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const reservation = {
      id,
      propertyId: resListMatch[1],
      confirmationNumber,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
      ...body
    };
    
    data.reservations[id] = reservation;
    sendJson(res, 201, { reservation });
    return;
  }

  // Update reservation
  if (req.method === "PATCH" && resDetailMatch) {
    const reservation = data.reservations[resDetailMatch[2]];
    if (!reservation) return sendJson(res, 404, { error: "RESERVATION_NOT_FOUND" });
    
    const body = await readJson(req);
    Object.assign(reservation, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { reservation });
    return;
  }

  // ==========================================================================
  // ARRIVALS / DEPARTURES
  // ==========================================================================

  const arrivalsMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/arrivals$/);
  if (req.method === "GET" && arrivalsMatch) {
    const resortId = arrivalsMatch[1];
    const date = url.searchParams.get("date") ?? TODAY;
    
    const arrivals = Object.values(data.reservations).filter(
      r => r.propertyId === resortId && r.arrival === date && r.status !== "CHECKED_OUT"
    );
    
    sendJson(res, 200, { arrivals, date, count: arrivals.length });
    return;
  }

  const departuresMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/departures$/);
  if (req.method === "GET" && departuresMatch) {
    const resortId = departuresMatch[1];
    const date = url.searchParams.get("date") ?? TODAY;
    
    const departures = Object.values(data.reservations).filter(
      r => r.propertyId === resortId && r.departure === date && r.status === "CHECKED_IN"
    );
    
    sendJson(res, 200, { departures, date, count: departures.length });
    return;
  }

  // ==========================================================================
  // FOLIO / BILLING
  // ==========================================================================

  const folioMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/folios$/);
  if (req.method === "GET" && folioMatch) {
    const folio = data.folios[folioMatch[2]] ?? {
      reservationId: folioMatch[2],
      charges: [],
      payments: [],
      balance: 0,
      currency: "EUR"
    };
    sendJson(res, 200, { folio });
    return;
  }

  const chargeMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/charges$/);
  if (req.method === "POST" && chargeMatch) {
    const resId = chargeMatch[2];
    const body = await readJson(req);
    
    if (!data.folios[resId]) {
      data.folios[resId] = { reservationId: resId, charges: [], payments: [], balance: 0, currency: "EUR" };
    }
    
    const charge = { id: `CHG-${Date.now()}`, date: TODAY, ...body };
    data.folios[resId].charges.push(charge);
    data.folios[resId].balance += charge.amount ?? 0;
    
    sendJson(res, 201, { charge, folio: data.folios[resId] });
    return;
  }

  // ==========================================================================
  // ROOM INVENTORY
  // ==========================================================================

  const roomsMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/rooms$/);
  if (req.method === "GET" && roomsMatch) {
    const resortId = roomsMatch[1];
    const status = url.searchParams.get("status");
    const floor = url.searchParams.get("floor");
    
    let rooms = Object.values(data.rooms).filter(r => r.propertyId === resortId);
    if (status) rooms = rooms.filter(r => r.status === status);
    if (floor) rooms = rooms.filter(r => r.floor === parseInt(floor));
    
    sendJson(res, 200, { rooms, count: rooms.length });
    return;
  }

  const roomMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/rooms\/([^/]+)$/);
  if (req.method === "GET" && roomMatch) {
    const room = Object.values(data.rooms).find(r => r.propertyId === roomMatch[1] && r.number === roomMatch[2]);
    if (!room) return sendJson(res, 404, { error: "ROOM_NOT_FOUND" });
    sendJson(res, 200, { room });
    return;
  }

  if (req.method === "PATCH" && roomMatch) {
    const room = Object.values(data.rooms).find(r => r.propertyId === roomMatch[1] && r.number === roomMatch[2]);
    if (!room) return sendJson(res, 404, { error: "ROOM_NOT_FOUND" });
    
    const body = await readJson(req);
    Object.assign(room, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { room });
    return;
  }

  // ==========================================================================
  // GUEST PROFILES
  // ==========================================================================

  const profilesMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/profiles$/);
  if (req.method === "GET" && profilesMatch) {
    const email = url.searchParams.get("email");
    let profiles = Object.values(data.guests);
    if (email) profiles = profiles.filter(g => g.email?.toLowerCase() === email.toLowerCase());
    sendJson(res, 200, { profiles, count: profiles.length });
    return;
  }

  const profileMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/profiles\/([^/]+)$/);
  if (req.method === "GET" && profileMatch) {
    const profile = data.guests[profileMatch[2]];
    if (!profile) return sendJson(res, 404, { error: "PROFILE_NOT_FOUND" });
    sendJson(res, 200, { profile });
    return;
  }

  if (req.method === "PUT" && profileMatch) {
    const profile = data.guests[profileMatch[2]];
    if (!profile) return sendJson(res, 404, { error: "PROFILE_NOT_FOUND" });
    
    const body = await readJson(req);
    Object.assign(profile, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { profile });
    return;
  }

  // ==========================================================================
  // CHECK-IN / CHECK-OUT
  // ==========================================================================

  const checkinMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/checkin$/);
  if (req.method === "POST" && checkinMatch) {
    const reservation = data.reservations[checkinMatch[2]];
    if (!reservation) return sendJson(res, 404, { error: "RESERVATION_NOT_FOUND" });
    
    const body = await readJson(req) ?? {};
    reservation.status = "CHECKED_IN";
    reservation.checkedInAt = new Date().toISOString();
    reservation.roomNumber = body.roomNumber ?? reservation.roomNumber;
    
    if (reservation.roomNumber) {
      const roomKey = `${reservation.propertyId}-${reservation.roomNumber}`;
      if (data.rooms[roomKey]) {
        data.rooms[roomKey].status = "OCCUPIED";
        data.rooms[roomKey].guestId = reservation.guestId;
      }
    }
    
    sendJson(res, 200, {
      success: true,
      reservation,
      digitalKey: {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        expiresAt: reservation.departure + "T12:00:00Z"
      }
    });
    return;
  }

  const checkoutMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/checkout$/);
  if (req.method === "POST" && checkoutMatch) {
    const reservation = data.reservations[checkoutMatch[2]];
    if (!reservation) return sendJson(res, 404, { error: "RESERVATION_NOT_FOUND" });
    
    reservation.status = "CHECKED_OUT";
    reservation.checkedOutAt = new Date().toISOString();
    
    if (reservation.roomNumber) {
      const roomKey = `${reservation.propertyId}-${reservation.roomNumber}`;
      if (data.rooms[roomKey]) {
        data.rooms[roomKey].status = "DIRTY";
        data.rooms[roomKey].guestId = null;
      }
    }
    
    const folio = data.folios[reservation.id] ?? { balance: 0, charges: [], payments: [] };
    
    sendJson(res, 200, {
      success: true,
      reservation,
      folio,
      invoiceUrl: `/invoices/${reservation.id}.pdf`
    });
    return;
  }

  // ==========================================================================
  // ROOM SERVICE MENU
  // ==========================================================================

  const menuMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/menu$/);
  if (req.method === "GET" && menuMatch) {
    sendJson(res, 200, { menu: data.menu });
    return;
  }

  // ==========================================================================
  // OTA SYNC SIMULATION
  // ==========================================================================

  if (req.method === "POST" && url.pathname === "/v1/sync/reservations") {
    const body = await readJson(req);
    const { source, reservation: resData } = body ?? {};
    
    const id = `RES-SYNC-${Date.now()}`;
    const confirmationNumber = resData?.confirmationNumber ??
      `${(source ?? "OTA").toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const reservation = {
      id,
      propertyId: resData?.propertyId ?? "FS-PARIS",
      confirmationNumber,
      status: "CONFIRMED",
      source: source ?? "direct",
      syncedAt: new Date().toISOString(),
      ...resData
    };
    
    data.reservations[id] = reservation;
    
    sendJson(res, 201, {
      success: true,
      reservation,
      message: `Reservation synced from ${source ?? "direct"}`
    });
    return;
  }

  // Not found
  sendJson(res, 404, { error: "NOT_FOUND", path: url.pathname });
}

// =============================================================================
// START SERVER
// =============================================================================

const server = createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`\n🏨 Opera PMS Mock Server running at http://${HOST}:${PORT}`);
  console.log(`\nProperties: ${Object.keys(data.properties).join(", ")}`);
  console.log(`Reservations: ${Object.keys(data.reservations).length}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /v1/properties`);
  console.log(`  GET  /v1/hotels/:resortId/reservations`);
  console.log(`  GET  /v1/hotels/:resortId/rooms`);
  console.log(`  GET  /v1/hotels/:resortId/arrivals`);
  console.log(`  GET  /v1/hotels/:resortId/departures`);
  console.log(`  GET  /v1/hotels/:resortId/menu`);
  console.log(`  POST /v1/hotels/:resortId/reservations/:id/checkin`);
  console.log(`  POST /v1/sync/reservations`);
  console.log(`\n`);
});
