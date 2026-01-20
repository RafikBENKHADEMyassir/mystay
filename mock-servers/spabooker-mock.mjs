import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.env.SPABOOKER_MOCK_PORT ?? 4011);
const host = process.env.SPABOOKER_MOCK_HOST ?? "127.0.0.1";
const expectedApiKey = process.env.SPABOOKER_MOCK_API_KEY ?? "SPA_API_KEY";

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function requireBearer(req, res) {
  const auth = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const prefix = "Bearer ";
  if (!auth.startsWith(prefix) || auth.slice(prefix.length).trim() !== expectedApiKey) {
    sendJson(res, 401, { error: "unauthorized" });
    return false;
  }
  return true;
}

const services = [
  {
    id: "SV-PRIV-SPA-1H",
    name: "Forfait 1 h au spa privé",
    description: "Accès spa privé + serviettes + thé.",
    duration: 60,
    price: 55.0,
    category: "spa"
  },
  {
    id: "SV-MASSAGE-2H",
    name: "Forfait 2 h massage et instant relaxation",
    description: "Massage complet + aromathérapie.",
    duration: 120,
    price: 135.0,
    category: "massage"
  },
  {
    id: "SV-GYM-PT-1H",
    name: "Coaching sportif 1 h",
    description: "Session personnalisée en salle de sport.",
    duration: 60,
    price: 85.0,
    category: "gym"
  }
];

const staff = [
  {
    id: "ST-0001",
    name: "Mohamed",
    bio: "Spécialiste massage et relaxation.",
    image_url: null,
    specialties: ["massage", "spa"]
  },
  {
    id: "ST-0002",
    name: "Julia",
    bio: "Coach sportif certifié.",
    image_url: null,
    specialties: ["gym"]
  }
];

/** @type {Map<string, any>} */
const bookings = new Map();

function listSlots(date, duration) {
  const slots = [];
  const startHour = 9;
  const endHour = 18;
  const minutesStep = duration >= 90 ? 90 : 60;

  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += minutesStep) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }

  return { date, slots };
}

function findService(serviceId) {
  return services.find((s) => s.id === serviceId) ?? null;
}

function findStaff(staffId) {
  return staff.find((s) => s.id === staffId) ?? null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "spabooker-mock", ts: new Date().toISOString() });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600"
    });
    res.end();
    return;
  }

  // Require bearer token for SpaBooker v3 endpoints.
  if (segments[0] === "v3") {
    if (!requireBearer(req, res)) return;
  }

  // GET /v3/sites/:siteId/services?category=...
  if (req.method === "GET" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "services" && segments.length === 4) {
    const category = (url.searchParams.get("category") ?? "").trim();
    const items = category ? services.filter((s) => s.category === category) : services;
    sendJson(res, 200, { services: items });
    return;
  }

  // GET /v3/sites/:siteId/staff?service_id=...
  if (req.method === "GET" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "staff" && segments.length === 4) {
    const serviceId = (url.searchParams.get("service_id") ?? "").trim();
    const service = serviceId ? findService(serviceId) : null;
    const items = service ? staff.filter((s) => s.specialties.includes(service.category)) : staff;
    sendJson(res, 200, { staff: items });
    return;
  }

  // GET /v3/sites/:siteId/availability?service_id=...&date=YYYY-MM-DD&duration=...&staff_id=...
  if (req.method === "GET" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "availability" && segments.length === 4) {
    const serviceId = (url.searchParams.get("service_id") ?? "").trim();
    const date = (url.searchParams.get("date") ?? "").trim();
    const duration = Number(url.searchParams.get("duration") ?? 60);
    const staffId = (url.searchParams.get("staff_id") ?? "").trim();

    if (!serviceId || !date) {
      sendJson(res, 400, { error: "missing_fields", required: ["service_id", "date"] });
      return;
    }

    const service = findService(serviceId);
    if (!service) {
      sendJson(res, 404, { error: "service_not_found" });
      return;
    }

    if (staffId) {
      const practitioner = findStaff(staffId);
      if (!practitioner) {
        sendJson(res, 404, { error: "staff_not_found" });
        return;
      }
    }

    sendJson(res, 200, listSlots(date, Number.isFinite(duration) && duration > 0 ? duration : service.duration));
    return;
  }

  // POST /v3/sites/:siteId/appointments
  if (req.method === "POST" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "appointments" && segments.length === 4) {
    const payload = await readJson(req);
    if (!payload || typeof payload !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const serviceId = String(payload.service_id ?? "").trim();
    const staffId = String(payload.staff_id ?? "").trim();
    const date = String(payload.date ?? "").trim();
    const time = String(payload.time ?? "").trim();
    const client = payload.client && typeof payload.client === "object" ? payload.client : null;

    if (!serviceId || !staffId || !date || !time || !client) {
      sendJson(res, 400, { error: "missing_fields", required: ["service_id", "staff_id", "date", "time", "client"] });
      return;
    }

    const service = findService(serviceId);
    const practitioner = findStaff(staffId);
    if (!service) {
      sendJson(res, 404, { error: "service_not_found" });
      return;
    }
    if (!practitioner) {
      sendJson(res, 404, { error: "staff_not_found" });
      return;
    }

    const bookingId = `APT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const confirmation = `SB-${randomUUID().slice(0, 6).toUpperCase()}`;

    const booking = {
      id: bookingId,
      confirmation,
      status: "confirmed",
      service_id: service.id,
      service_name: service.name,
      staff_id: practitioner.id,
      staff_name: practitioner.name,
      date,
      time,
      duration: service.duration,
      client: {
        name: String(client.name ?? "").trim() || "Guest",
        email: String(client.email ?? "").trim() || null,
        phone: String(client.phone ?? "").trim() || null
      },
      notes: String(payload.notes ?? "").trim() || ""
    };

    bookings.set(bookingId, booking);
    sendJson(res, 201, booking);
    return;
  }

  // GET /v3/sites/:siteId/appointments/:bookingId
  if (req.method === "GET" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "appointments" && segments[4] && segments.length === 5) {
    const bookingId = decodeURIComponent(segments[4]);
    const booking = bookings.get(bookingId);
    if (!booking) {
      sendJson(res, 404, { error: "booking_not_found" });
      return;
    }
    sendJson(res, 200, booking);
    return;
  }

  // PATCH /v3/sites/:siteId/appointments/:bookingId
  if (req.method === "PATCH" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "appointments" && segments[4] && segments.length === 5) {
    const bookingId = decodeURIComponent(segments[4]);
    const existing = bookings.get(bookingId);
    if (!existing) {
      sendJson(res, 404, { error: "booking_not_found" });
      return;
    }

    const updates = await readJson(req);
    if (!updates || typeof updates !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const next = { ...existing };
    if (typeof updates.date === "string" && updates.date.trim()) next.date = updates.date.trim();
    if (typeof updates.time === "string" && updates.time.trim()) next.time = updates.time.trim();
    if (typeof updates.staff_id === "string" && updates.staff_id.trim()) {
      const practitioner = findStaff(updates.staff_id.trim());
      if (!practitioner) {
        sendJson(res, 404, { error: "staff_not_found" });
        return;
      }
      next.staff_id = practitioner.id;
      next.staff_name = practitioner.name;
    }
    if (typeof updates.notes === "string") next.notes = updates.notes.trim();
    next.status = "confirmed";
    bookings.set(bookingId, next);
    sendJson(res, 200, next);
    return;
  }

  // DELETE /v3/sites/:siteId/appointments/:bookingId
  if (req.method === "DELETE" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "appointments" && segments[4] && segments.length === 5) {
    const bookingId = decodeURIComponent(segments[4]);
    const existing = bookings.get(bookingId);
    if (!existing) {
      sendJson(res, 404, { error: "booking_not_found" });
      return;
    }
    bookings.delete(bookingId);
    sendJson(res, 200, { success: true, bookingId });
    return;
  }

  // GET /v3/sites/:siteId/staff/:staffId/schedule?start_date=...&end_date=...
  if (req.method === "GET" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "staff" && segments[4] && segments[5] === "schedule" && segments.length === 6) {
    const staffId = decodeURIComponent(segments[4]);
    const startDate = (url.searchParams.get("start_date") ?? "").trim();
    const endDate = (url.searchParams.get("end_date") ?? "").trim();
    if (!findStaff(staffId)) {
      sendJson(res, 404, { error: "staff_not_found" });
      return;
    }
    sendJson(res, 200, {
      staff_id: staffId,
      start_date: startDate,
      end_date: endDate,
      appointments: Array.from(bookings.values()).filter((b) => b.staff_id === staffId)
    });
    return;
  }

  // POST /v3/sites/:siteId/feedback
  if (req.method === "POST" && segments[0] === "v3" && segments[1] === "sites" && segments[2] && segments[3] === "feedback" && segments.length === 4) {
    const payload = await readJson(req);
    if (!payload || typeof payload !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }
    sendJson(res, 201, { success: true, receivedAt: new Date().toISOString(), ...payload });
    return;
  }

  sendJson(res, 404, { error: "not_found" });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`spabooker-mock listening on http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log(`- Health: http://${host}:${port}/health`);
  // eslint-disable-next-line no-console
  console.log(`- Base URL (for config): http://${host}:${port}/v3`);
});

