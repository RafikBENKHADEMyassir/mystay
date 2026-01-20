/**
 * Mock PMS (Property Management System) Server
 * 
 * Simulates a real PMS like Opera, Mews, or Cloudbeds for development and testing.
 * Provides endpoints for:
 * - Reservations lookup and management
 * - Room inventory and status
 * - Guest profiles
 * - Folio/billing
 * - Room service menu
 * - Spa/wellness services
 */

import { createServer } from "node:http";
import { mockData } from "./data.mjs";

const port = Number(process.env.MOCK_PMS_PORT ?? 4010);
const host = process.env.MOCK_PMS_HOST ?? "127.0.0.1";

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
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  
  if (auth.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString();
    const [username, password] = decoded.split(":");
    return { type: "basic", username, password };
  }
  
  if (auth.startsWith("Bearer ")) {
    return { type: "bearer", token: auth.slice(7) };
  }
  
  return null;
}

async function handleRequest(req, res) {
  const url = new URL(req.url ?? "/", `http://${host}:${port}`);
  
  // Handle CORS preflight
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

  console.log(`[Mock PMS] ${req.method} ${url.pathname}`);

  // =====================================================
  // PROPERTY ENDPOINTS
  // =====================================================

  // GET /v1/properties - List all properties
  if (req.method === "GET" && url.pathname === "/v1/properties") {
    sendJson(res, 200, {
      properties: Object.values(mockData.properties)
    });
    return;
  }

  // GET /v1/properties/:propertyId - Get property details
  const propertyMatch = url.pathname.match(/^\/v1\/properties\/([^/]+)$/);
  if (req.method === "GET" && propertyMatch) {
    const propertyId = propertyMatch[1];
    const property = mockData.properties[propertyId];
    if (!property) {
      sendJson(res, 404, { error: "property_not_found" });
      return;
    }
    sendJson(res, 200, { property });
    return;
  }

  // =====================================================
  // RESERVATION ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/reservations - List/search reservations
  const resListMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations$/);
  if (req.method === "GET" && resListMatch) {
    const resortId = resListMatch[1];
    const confirmationNumber = url.searchParams.get("confirmationNumber");
    const guestEmail = url.searchParams.get("guestEmail");
    const status = url.searchParams.get("status");

    let reservations = Object.values(mockData.reservations).filter(
      r => r.propertyId === resortId
    );

    if (confirmationNumber) {
      reservations = reservations.filter(
        r => r.confirmationNumber === confirmationNumber
      );
    }

    if (guestEmail) {
      reservations = reservations.filter(
        r => r.guest?.email?.toLowerCase() === guestEmail.toLowerCase()
      );
    }

    if (status) {
      reservations = reservations.filter(r => r.status === status);
    }

    sendJson(res, 200, { reservations });
    return;
  }

  // GET /v1/hotels/:resortId/reservations/:reservationId - Get reservation details
  const resDetailMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)$/);
  if (req.method === "GET" && resDetailMatch) {
    const reservationId = resDetailMatch[2];
    const reservation = mockData.reservations[reservationId];
    if (!reservation) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }
    sendJson(res, 200, { reservation });
    return;
  }

  // POST /v1/hotels/:resortId/reservations - Create reservation
  const resCreateMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations$/);
  if (req.method === "POST" && resCreateMatch) {
    const resortId = resCreateMatch[1];
    const body = await readJson(req);
    
    const id = `RES-${Date.now()}`;
    const confirmationNumber = `CONF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const reservation = {
      id,
      propertyId: resortId,
      confirmationNumber,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      ...body
    };
    
    mockData.reservations[id] = reservation;
    sendJson(res, 201, { reservation });
    return;
  }

  // PATCH /v1/hotels/:resortId/reservations/:reservationId - Update reservation
  const resUpdateMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)$/);
  if (req.method === "PATCH" && resUpdateMatch) {
    const reservationId = resUpdateMatch[2];
    const reservation = mockData.reservations[reservationId];
    if (!reservation) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }
    
    const body = await readJson(req);
    Object.assign(reservation, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { reservation });
    return;
  }

  // =====================================================
  // FOLIO/BILLING ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/reservations/:reservationId/folios - Get folio
  const folioMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/folios$/);
  if (req.method === "GET" && folioMatch) {
    const reservationId = folioMatch[2];
    const folio = mockData.folios[reservationId] ?? {
      reservationId,
      charges: [],
      payments: [],
      balance: 0,
      currency: "EUR"
    };
    sendJson(res, 200, { folio });
    return;
  }

  // POST /v1/hotels/:resortId/reservations/:reservationId/charges - Add charge
  const chargeMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/charges$/);
  if (req.method === "POST" && chargeMatch) {
    const reservationId = chargeMatch[2];
    const body = await readJson(req);
    
    if (!mockData.folios[reservationId]) {
      mockData.folios[reservationId] = {
        reservationId,
        charges: [],
        payments: [],
        balance: 0,
        currency: "EUR"
      };
    }
    
    const charge = {
      id: `CHG-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      ...body
    };
    
    mockData.folios[reservationId].charges.push(charge);
    mockData.folios[reservationId].balance += charge.amount ?? 0;
    
    sendJson(res, 201, { charge, folio: mockData.folios[reservationId] });
    return;
  }

  // =====================================================
  // GUEST PROFILE ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/profiles - List guest profiles
  const profilesListMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/profiles$/);
  if (req.method === "GET" && profilesListMatch) {
    const email = url.searchParams.get("email");
    let profiles = Object.values(mockData.guests);
    
    if (email) {
      profiles = profiles.filter(g => g.email?.toLowerCase() === email.toLowerCase());
    }
    
    sendJson(res, 200, { profiles });
    return;
  }

  // GET /v1/hotels/:resortId/profiles/:profileId - Get guest profile
  const profileMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/profiles\/([^/]+)$/);
  if (req.method === "GET" && profileMatch) {
    const profileId = profileMatch[2];
    const profile = mockData.guests[profileId];
    if (!profile) {
      sendJson(res, 404, { error: "profile_not_found" });
      return;
    }
    sendJson(res, 200, { profile });
    return;
  }

  // PUT /v1/hotels/:resortId/profiles/:profileId - Update guest profile
  if (req.method === "PUT" && profileMatch) {
    const profileId = profileMatch[2];
    const profile = mockData.guests[profileId];
    if (!profile) {
      sendJson(res, 404, { error: "profile_not_found" });
      return;
    }
    
    const body = await readJson(req);
    Object.assign(profile, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { profile });
    return;
  }

  // =====================================================
  // ROOM INVENTORY ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/rooms - List rooms
  const roomsMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/rooms$/);
  if (req.method === "GET" && roomsMatch) {
    const resortId = roomsMatch[1];
    const status = url.searchParams.get("status");
    const floor = url.searchParams.get("floor");
    
    let rooms = Object.values(mockData.rooms).filter(r => r.propertyId === resortId);
    
    if (status) {
      rooms = rooms.filter(r => r.status === status);
    }
    if (floor) {
      rooms = rooms.filter(r => r.floor === parseInt(floor));
    }
    
    sendJson(res, 200, { rooms });
    return;
  }

  // GET /v1/hotels/:resortId/rooms/:roomNumber - Get room details
  const roomMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/rooms\/([^/]+)$/);
  if (req.method === "GET" && roomMatch) {
    const resortId = roomMatch[1];
    const roomNumber = roomMatch[2];
    const room = Object.values(mockData.rooms).find(
      r => r.propertyId === resortId && r.number === roomNumber
    );
    if (!room) {
      sendJson(res, 404, { error: "room_not_found" });
      return;
    }
    sendJson(res, 200, { room });
    return;
  }

  // PATCH /v1/hotels/:resortId/rooms/:roomNumber - Update room status
  if (req.method === "PATCH" && roomMatch) {
    const resortId = roomMatch[1];
    const roomNumber = roomMatch[2];
    const room = Object.values(mockData.rooms).find(
      r => r.propertyId === resortId && r.number === roomNumber
    );
    if (!room) {
      sendJson(res, 404, { error: "room_not_found" });
      return;
    }
    
    const body = await readJson(req);
    Object.assign(room, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { room });
    return;
  }

  // =====================================================
  // ARRIVALS/DEPARTURES ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/arrivals - Today's arrivals
  const arrivalsMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/arrivals$/);
  if (req.method === "GET" && arrivalsMatch) {
    const resortId = arrivalsMatch[1];
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    
    const arrivals = Object.values(mockData.reservations).filter(
      r => r.propertyId === resortId && r.checkInDate === date && r.status !== "checked_out"
    );
    
    sendJson(res, 200, { arrivals, date });
    return;
  }

  // GET /v1/hotels/:resortId/departures - Today's departures
  const departuresMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/departures$/);
  if (req.method === "GET" && departuresMatch) {
    const resortId = departuresMatch[1];
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    
    const departures = Object.values(mockData.reservations).filter(
      r => r.propertyId === resortId && r.checkOutDate === date && r.status === "checked_in"
    );
    
    sendJson(res, 200, { departures, date });
    return;
  }

  // =====================================================
  // ROOM SERVICE MENU ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/menu - Get room service menu
  const menuMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/menu$/);
  if (req.method === "GET" && menuMatch) {
    const resortId = menuMatch[1];
    const menu = mockData.menus[resortId] ?? mockData.menus.default;
    sendJson(res, 200, { menu });
    return;
  }

  // =====================================================
  // SPA/WELLNESS ENDPOINTS
  // =====================================================

  // GET /v1/hotels/:resortId/spa/services - Get spa services
  const spaServicesMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/spa\/services$/);
  if (req.method === "GET" && spaServicesMatch) {
    const resortId = spaServicesMatch[1];
    const services = mockData.spaServices[resortId] ?? mockData.spaServices.default;
    sendJson(res, 200, { services });
    return;
  }

  // GET /v1/hotels/:resortId/spa/availability - Get spa availability
  const spaAvailMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/spa\/availability$/);
  if (req.method === "GET" && spaAvailMatch) {
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const serviceId = url.searchParams.get("serviceId");
    
    // Generate mock availability slots
    const slots = [];
    const baseDate = new Date(date);
    for (let hour = 9; hour <= 19; hour++) {
      const available = Math.random() > 0.3; // 70% availability
      if (available) {
        slots.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          available: true,
          practitioner: ["Marie", "Jean", "Sophie", "Pierre"][Math.floor(Math.random() * 4)]
        });
      }
    }
    
    sendJson(res, 200, { date, serviceId, slots });
    return;
  }

  // =====================================================
  // CHECK-IN/OUT ENDPOINTS
  // =====================================================

  // POST /v1/hotels/:resortId/reservations/:reservationId/checkin - Check in guest
  const checkinMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/checkin$/);
  if (req.method === "POST" && checkinMatch) {
    const reservationId = checkinMatch[2];
    const reservation = mockData.reservations[reservationId];
    if (!reservation) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }
    
    const body = await readJson(req);
    reservation.status = "checked_in";
    reservation.checkedInAt = new Date().toISOString();
    reservation.roomNumber = body.roomNumber ?? reservation.roomNumber;
    
    sendJson(res, 200, { 
      success: true, 
      reservation,
      digitalKey: {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        expiresAt: reservation.checkOutDate + "T12:00:00Z"
      }
    });
    return;
  }

  // POST /v1/hotels/:resortId/reservations/:reservationId/checkout - Check out guest
  const checkoutMatch = url.pathname.match(/^\/v1\/hotels\/([^/]+)\/reservations\/([^/]+)\/checkout$/);
  if (req.method === "POST" && checkoutMatch) {
    const reservationId = checkoutMatch[2];
    const reservation = mockData.reservations[reservationId];
    if (!reservation) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }
    
    reservation.status = "checked_out";
    reservation.checkedOutAt = new Date().toISOString();
    
    const folio = mockData.folios[reservationId] ?? { balance: 0, charges: [], payments: [] };
    
    sendJson(res, 200, { 
      success: true, 
      reservation,
      folio,
      invoiceUrl: `/invoices/${reservationId}.pdf`
    });
    return;
  }

  // =====================================================
  // SYNC/WEBHOOK SIMULATION
  // =====================================================

  // POST /v1/sync/reservations - Simulate reservation sync from OTA
  if (req.method === "POST" && url.pathname === "/v1/sync/reservations") {
    const body = await readJson(req);
    const { source, reservation: resData } = body ?? {};
    
    const id = `RES-SYNC-${Date.now()}`;
    const confirmationNumber = resData?.confirmationNumber ?? 
      `${source?.toUpperCase() ?? "OTA"}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const reservation = {
      id,
      propertyId: resData?.propertyId ?? "FS-DEMO",
      confirmationNumber,
      status: "confirmed",
      source: source ?? "direct",
      syncedAt: new Date().toISOString(),
      ...resData
    };
    
    mockData.reservations[id] = reservation;
    
    sendJson(res, 201, { 
      success: true, 
      reservation,
      message: `Reservation synced from ${source ?? "direct"}`
    });
    return;
  }

  // Not found
  sendJson(res, 404, { error: "not_found", path: url.pathname });
}

const server = createServer(handleRequest);

server.listen(port, host, () => {
  console.log(`\n🏨 Mock PMS Server running at http://${host}:${port}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /v1/properties`);
  console.log(`  GET  /v1/hotels/:resortId/reservations?confirmationNumber=...`);
  console.log(`  GET  /v1/hotels/:resortId/rooms`);
  console.log(`  GET  /v1/hotels/:resortId/arrivals`);
  console.log(`  GET  /v1/hotels/:resortId/departures`);
  console.log(`  GET  /v1/hotels/:resortId/menu`);
  console.log(`  GET  /v1/hotels/:resortId/spa/services`);
  console.log(`  POST /v1/hotels/:resortId/reservations/:id/checkin`);
  console.log(`  POST /v1/sync/reservations`);
  console.log(`\n`);
});
