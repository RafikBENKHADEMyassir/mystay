/**
 * SpaBooker Mock Server
 * 
 * Simulates a spa/wellness booking system API.
 * Provides endpoints for:
 * - Spa services catalog
 * - Availability checking
 * - Appointment booking
 * - Practitioner management
 * 
 * Port: 4011
 */

import { createServer } from "node:http";

const PORT = Number(process.env.SPABOOKER_PORT ?? 4011);
const HOST = process.env.SPABOOKER_HOST ?? "127.0.0.1";

// =============================================================================
// MOCK DATA
// =============================================================================

function getDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

const TODAY = getDate(0);
const TOMORROW = getDate(1);

const data = {
  // Spa locations (aligned with MyStay hotels)
  locations: {
    "FS-PARIS": {
      id: "FS-PARIS",
      name: "Le Spa - Four Seasons George V",
      address: "31 Avenue George V, Paris",
      phone: "+33 1 49 52 70 10",
      email: "spa.paris@fourseasons.com",
      hours: { open: "08:00", close: "21:00" },
      timezone: "Europe/Paris",
      facilities: [
        { name: "Swimming Pool", description: "15m indoor heated pool", included: true },
        { name: "Hammam", description: "Traditional steam bath", included: true },
        { name: "Sauna", description: "Finnish dry sauna", included: true },
        { name: "Fitness Center", description: "State-of-the-art equipment", included: true },
        { name: "Relaxation Lounge", description: "With tea service", included: true }
      ]
    },
    "FS-GENEVA": {
      id: "FS-GENEVA",
      name: "Le Spa - Four Seasons des Bergues",
      address: "33 Quai des Bergues, Geneva",
      phone: "+41 22 908 70 10",
      email: "spa.geneva@fourseasons.com",
      hours: { open: "08:00", close: "20:00" },
      timezone: "Europe/Zurich",
      facilities: [
        { name: "Swimming Pool", description: "Indoor pool with lake views", included: true },
        { name: "Steam Room", description: "Aromatic steam room", included: true },
        { name: "Sauna", description: "Finnish dry sauna", included: true },
        { name: "Fitness Center", description: "Technogym equipment", included: true }
      ]
    }
  },

  // Spa services catalog
  services: {
    "FS-PARIS": {
      categories: [
        {
          id: "CAT-MASSAGE",
          name: "Massages",
          description: "Therapeutic and relaxation massages",
          items: [
            {
              id: "SPA-001",
              name: "Swedish Relaxation Massage",
              description: "Classic relaxation massage with medium pressure to ease tension and promote well-being",
              duration: 60,
              priceCents: 18000,
              currency: "EUR"
            },
            {
              id: "SPA-002",
              name: "Deep Tissue Massage",
              description: "Therapeutic massage targeting muscle tension and chronic pain areas",
              duration: 60,
              priceCents: 22000,
              currency: "EUR"
            },
            {
              id: "SPA-003",
              name: "Hot Stone Therapy",
              description: "Heated basalt stones combined with massage techniques for deep relaxation",
              duration: 90,
              priceCents: 28000,
              currency: "EUR"
            },
            {
              id: "SPA-004",
              name: "Couples Massage",
              description: "Side-by-side massage for two in our luxurious couple's suite",
              duration: 60,
              priceCents: 38000,
              currency: "EUR"
            },
            {
              id: "SPA-005",
              name: "Aromatherapy Journey",
              description: "Custom essential oil blend with full body massage tailored to your needs",
              duration: 75,
              priceCents: 24000,
              currency: "EUR"
            }
          ]
        },
        {
          id: "CAT-FACIAL",
          name: "Facials",
          description: "Rejuvenating facial treatments",
          items: [
            {
              id: "SPA-010",
              name: "Signature Facial",
              description: "Customized facial treatment tailored to your specific skin type and concerns",
              duration: 60,
              priceCents: 19500,
              currency: "EUR"
            },
            {
              id: "SPA-011",
              name: "Anti-Aging Treatment",
              description: "Advanced treatment with collagen-boosting technology and luxury serums",
              duration: 90,
              priceCents: 29500,
              currency: "EUR"
            },
            {
              id: "SPA-012",
              name: "Hydrating Facial",
              description: "Deep hydration for dry or dehydrated skin using marine extracts",
              duration: 60,
              priceCents: 17500,
              currency: "EUR"
            },
            {
              id: "SPA-013",
              name: "Men's Facial",
              description: "Tailored treatment addressing men's specific skincare needs",
              duration: 45,
              priceCents: 15000,
              currency: "EUR"
            }
          ]
        },
        {
          id: "CAT-BODY",
          name: "Body Treatments",
          description: "Luxurious body treatments",
          items: [
            {
              id: "SPA-020",
              name: "Body Scrub & Wrap",
              description: "Exfoliation followed by a nourishing body wrap to revitalize your skin",
              duration: 90,
              priceCents: 25000,
              currency: "EUR"
            },
            {
              id: "SPA-021",
              name: "Detox Treatment",
              description: "Stimulating treatment designed to eliminate toxins and boost circulation",
              duration: 60,
              priceCents: 19500,
              currency: "EUR"
            },
            {
              id: "SPA-022",
              name: "After-Sun Recovery",
              description: "Cooling and hydrating treatment for sun-exposed skin",
              duration: 45,
              priceCents: 14500,
              currency: "EUR"
            }
          ]
        },
        {
          id: "CAT-PACKAGES",
          name: "Spa Journeys",
          description: "Complete spa experiences",
          items: [
            {
              id: "SPA-030",
              name: "Half-Day Retreat",
              description: "3-hour experience including massage, facial, and light healthy lunch",
              duration: 180,
              priceCents: 45000,
              currency: "EUR"
            },
            {
              id: "SPA-031",
              name: "Ultimate Relaxation",
              description: "Full day spa access with signature treatments, meals, and champagne",
              duration: 360,
              priceCents: 75000,
              currency: "EUR"
            },
            {
              id: "SPA-032",
              name: "Romantic Escape",
              description: "Couple's experience with champagne, side-by-side massage, and private suite",
              duration: 150,
              priceCents: 65000,
              currency: "EUR"
            }
          ]
        },
        {
          id: "CAT-WELLNESS",
          name: "Wellness",
          description: "Fitness and wellness services",
          items: [
            {
              id: "SPA-040",
              name: "Private Yoga Session",
              description: "One-on-one yoga instruction customized to your level and goals",
              duration: 60,
              priceCents: 15000,
              currency: "EUR"
            },
            {
              id: "SPA-041",
              name: "Personal Training",
              description: "Customized workout with certified trainer using our state-of-the-art equipment",
              duration: 60,
              priceCents: 16000,
              currency: "EUR"
            },
            {
              id: "SPA-042",
              name: "Meditation Session",
              description: "Guided meditation for stress relief and mental clarity",
              duration: 45,
              priceCents: 12000,
              currency: "EUR"
            }
          ]
        }
      ]
    },
    "FS-GENEVA": {
      categories: [
        {
          id: "CAT-MASSAGE",
          name: "Massages",
          items: [
            { id: "SPA-G001", name: "Swiss Alpine Massage", description: "Invigorating massage with Swiss botanical oils", duration: 60, priceCents: 20000, currency: "CHF" },
            { id: "SPA-G002", name: "Hot Stone Therapy", description: "Heated stones for deep muscle relaxation", duration: 90, priceCents: 30000, currency: "CHF" },
            { id: "SPA-G003", name: "Couples Massage", description: "Side-by-side massage in our couple's suite", duration: 60, priceCents: 40000, currency: "CHF" }
          ]
        },
        {
          id: "CAT-FACIAL",
          name: "Facials",
          items: [
            { id: "SPA-G010", name: "Swiss Glacier Facial", description: "Cooling, rejuvenating facial with glacial extracts", duration: 60, priceCents: 21000, currency: "CHF" },
            { id: "SPA-G011", name: "Anti-Aging Excellence", description: "Advanced anti-aging treatment with Swiss precision", duration: 90, priceCents: 32000, currency: "CHF" }
          ]
        }
      ]
    }
  },

  // Practitioners
  practitioners: {
    "FS-PARIS": [
      { id: "PRAC-001", name: "Marie Lefèvre", specialties: ["massage", "body"], languages: ["fr", "en"], rating: 4.9 },
      { id: "PRAC-002", name: "Jean-Pierre Moreau", specialties: ["massage", "wellness"], languages: ["fr", "en", "de"], rating: 4.8 },
      { id: "PRAC-003", name: "Sophie Bernard", specialties: ["facial", "body"], languages: ["fr", "en"], rating: 4.9 },
      { id: "PRAC-004", name: "Pierre Dubois", specialties: ["massage"], languages: ["fr", "en", "es"], rating: 4.7 },
      { id: "PRAC-005", name: "Amélie Martin", specialties: ["wellness", "facial"], languages: ["fr", "en"], rating: 5.0 },
      { id: "PRAC-006", name: "Thomas Petit", specialties: ["wellness"], languages: ["fr", "en"], rating: 4.8 }
    ],
    "FS-GENEVA": [
      { id: "PRAC-G01", name: "Anna Schmidt", specialties: ["massage", "body"], languages: ["de", "en", "fr"], rating: 4.9 },
      { id: "PRAC-G02", name: "Marc Weber", specialties: ["massage", "wellness"], languages: ["de", "fr", "en"], rating: 4.8 },
      { id: "PRAC-G03", name: "Elena Rossi", specialties: ["facial"], languages: ["it", "en", "fr"], rating: 4.9 }
    ]
  },

  // Appointments (sample bookings)
  appointments: {
    "APT-001": {
      id: "APT-001",
      locationId: "FS-PARIS",
      serviceId: "SPA-004",
      practitionerId: "PRAC-001",
      guestEmail: "sophie.martin@email.com",
      guestName: "Sophie Martin",
      roomNumber: "701",
      date: TOMORROW,
      time: "15:00",
      duration: 60,
      status: "confirmed",
      notes: "Anniversary celebration",
      createdAt: TODAY
    }
  }
};

// =============================================================================
// UTILITIES
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

function generateSlots(date, serviceId, locationId) {
  const location = data.locations[locationId];
  if (!location) return [];
  
  const openHour = parseInt(location.hours.open.split(":")[0]);
  const closeHour = parseInt(location.hours.close.split(":")[0]);
  const practitioners = data.practitioners[locationId] ?? [];
  
  const slots = [];
  for (let hour = openHour; hour < closeHour; hour++) {
    // Randomly mark some slots as unavailable
    const available = Math.random() > 0.3;
    if (available) {
      const practitioner = practitioners[Math.floor(Math.random() * practitioners.length)];
      slots.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        available: true,
        practitioner: practitioner?.name ?? "Available"
      });
      // Also add :30 slots for some hours
      if (Math.random() > 0.5) {
        slots.push({
          time: `${hour.toString().padStart(2, "0")}:30`,
          available: true,
          practitioner: practitioner?.name ?? "Available"
        });
      }
    }
  }
  
  return slots;
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

  console.log(`[SpaBooker] ${req.method} ${url.pathname}`);

  // Health check
  if (url.pathname === "/health") {
    sendJson(res, 200, { status: "ok", service: "spabooker-mock", timestamp: new Date().toISOString() });
    return;
  }

  // ==========================================================================
  // LOCATION ENDPOINTS
  // ==========================================================================

  if (req.method === "GET" && url.pathname === "/v1/locations") {
    sendJson(res, 200, { locations: Object.values(data.locations) });
    return;
  }

  const locationMatch = url.pathname.match(/^\/v1\/locations\/([^/]+)$/);
  if (req.method === "GET" && locationMatch) {
    const location = data.locations[locationMatch[1]];
    if (!location) return sendJson(res, 404, { error: "LOCATION_NOT_FOUND" });
    sendJson(res, 200, { location });
    return;
  }

  // ==========================================================================
  // SPA SERVICES
  // ==========================================================================

  // Also support /v1/hotels/:siteId/spa/services pattern (Opera style)
  const spaServicesMatch = url.pathname.match(/^\/v1\/(?:hotels|locations)\/([^/]+)\/(?:spa\/)?services$/);
  if (req.method === "GET" && spaServicesMatch) {
    const locationId = spaServicesMatch[1];
    const services = data.services[locationId];
    if (!services) {
      // Return default Paris services if location not found
      sendJson(res, 200, { services: data.services["FS-PARIS"] ?? { categories: [] } });
      return;
    }
    sendJson(res, 200, { services });
    return;
  }

  // ==========================================================================
  // AVAILABILITY
  // ==========================================================================

  const availabilityMatch = url.pathname.match(/^\/v1\/(?:hotels|locations)\/([^/]+)\/(?:spa\/)?availability$/);
  if (req.method === "GET" && availabilityMatch) {
    const locationId = availabilityMatch[1];
    const date = url.searchParams.get("date") ?? TODAY;
    const serviceId = url.searchParams.get("serviceId");
    
    const slots = generateSlots(date, serviceId, locationId);
    
    sendJson(res, 200, { 
      locationId, 
      date, 
      serviceId, 
      slots,
      timezone: data.locations[locationId]?.timezone ?? "Europe/Paris"
    });
    return;
  }

  // ==========================================================================
  // PRACTITIONERS
  // ==========================================================================

  const practitionersMatch = url.pathname.match(/^\/v1\/locations\/([^/]+)\/practitioners$/);
  if (req.method === "GET" && practitionersMatch) {
    const locationId = practitionersMatch[1];
    const practitioners = data.practitioners[locationId] ?? [];
    sendJson(res, 200, { practitioners });
    return;
  }

  // ==========================================================================
  // APPOINTMENTS
  // ==========================================================================

  // List appointments
  if (req.method === "GET" && url.pathname === "/v1/appointments") {
    const guestEmail = url.searchParams.get("guestEmail");
    const locationId = url.searchParams.get("locationId");
    const date = url.searchParams.get("date");
    
    let appointments = Object.values(data.appointments);
    
    if (guestEmail) {
      appointments = appointments.filter(a => a.guestEmail?.toLowerCase() === guestEmail.toLowerCase());
    }
    if (locationId) {
      appointments = appointments.filter(a => a.locationId === locationId);
    }
    if (date) {
      appointments = appointments.filter(a => a.date === date);
    }
    
    sendJson(res, 200, { appointments, count: appointments.length });
    return;
  }

  // Create appointment
  if (req.method === "POST" && url.pathname === "/v1/appointments") {
    const body = await readJson(req);
    
    const id = `APT-${Date.now()}`;
    const appointment = {
      id,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      ...body
    };
    
    data.appointments[id] = appointment;
    
    sendJson(res, 201, { 
      appointment,
      message: "Appointment booked successfully. Please arrive 15 minutes early."
    });
    return;
  }

  // Get appointment
  const appointmentMatch = url.pathname.match(/^\/v1\/appointments\/([^/]+)$/);
  if (req.method === "GET" && appointmentMatch) {
    const appointment = data.appointments[appointmentMatch[1]];
    if (!appointment) return sendJson(res, 404, { error: "APPOINTMENT_NOT_FOUND" });
    sendJson(res, 200, { appointment });
    return;
  }

  // Update appointment (reschedule)
  if (req.method === "PATCH" && appointmentMatch) {
    const appointment = data.appointments[appointmentMatch[1]];
    if (!appointment) return sendJson(res, 404, { error: "APPOINTMENT_NOT_FOUND" });
    
    const body = await readJson(req);
    Object.assign(appointment, body, { updatedAt: new Date().toISOString() });
    sendJson(res, 200, { appointment });
    return;
  }

  // Cancel appointment
  if (req.method === "DELETE" && appointmentMatch) {
    const appointment = data.appointments[appointmentMatch[1]];
    if (!appointment) return sendJson(res, 404, { error: "APPOINTMENT_NOT_FOUND" });
    
    appointment.status = "cancelled";
    appointment.cancelledAt = new Date().toISOString();
    
    sendJson(res, 200, { 
      success: true,
      appointment,
      message: "Appointment cancelled successfully."
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
  console.log(`\n💆 SpaBooker Mock Server running at http://${HOST}:${PORT}`);
  console.log(`\nLocations: ${Object.keys(data.locations).join(", ")}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /v1/locations`);
  console.log(`  GET  /v1/locations/:id/services`);
  console.log(`  GET  /v1/locations/:id/availability?date=YYYY-MM-DD&serviceId=...`);
  console.log(`  GET  /v1/locations/:id/practitioners`);
  console.log(`  GET  /v1/appointments`);
  console.log(`  POST /v1/appointments`);
  console.log(`\n`);
});
