import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.env.OPERA_MOCK_PORT ?? 4010);
const host = process.env.OPERA_MOCK_HOST ?? "127.0.0.1";
const expectedUser = process.env.OPERA_MOCK_USERNAME ?? "OPERA";
const expectedPass = process.env.OPERA_MOCK_PASSWORD ?? "OPERA";

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

function parseBasicAuth(header) {
  const value = typeof header === "string" ? header : "";
  if (!value.startsWith("Basic ")) return null;
  const encoded = value.slice("Basic ".length).trim();
  if (!encoded) return null;
  let decoded = "";
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
  const [username, password] = decoded.split(":");
  if (!username || password === undefined) return null;
  return { username, password };
}

function requireAuth(req, res) {
  const parsed = parseBasicAuth(req.headers.authorization);
  if (!parsed || parsed.username !== expectedUser || parsed.password !== expectedPass) {
    res.setHeader("WWW-Authenticate", 'Basic realm="opera-mock"');
    sendJson(res, 401, { error: "unauthorized" });
    return null;
  }
  return parsed;
}

function buildReservation(confirmationNumber) {
  if (confirmationNumber === "0123456789") {
    return {
      id: "RES-0123456789",
      confirmationNumber,
      guestName: "Ethel Bracka",
      guestEmail: "ethel@example.com",
      checkInDate: "2025-11-03",
      checkOutDate: "2025-11-12",
      roomType: "Sea View Suite",
      roomNumber: "227",
      status: "confirmed",
      numberOfGuests: 3
    };
  }

  return {
    id: `RES-${confirmationNumber}`,
    confirmationNumber,
    guestName: "John Doe",
    guestEmail: "john.doe@example.com",
    checkInDate: "2026-01-15",
    checkOutDate: "2026-01-20",
    roomType: "Deluxe King",
    roomNumber: "305",
    status: "confirmed",
    numberOfGuests: 2
  };
}

function buildFolio(reservationId) {
  return {
    reservationId,
    charges: [
      { date: "2025-11-03", description: "Room Charge", amount: 1200.0 },
      { date: "2025-11-06", description: "Spa treatment", amount: 55.0 },
      { date: "2025-11-07", description: "Massage package", amount: 135.0 }
    ],
    payments: [{ date: "2025-11-03", description: "Card hold", amount: 500.0 }],
    balance: 890.0,
    currency: "EUR"
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "opera-mock", ts: new Date().toISOString() });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600"
    });
    res.end();
    return;
  }

  // Require auth for Opera endpoints.
  if (segments[0] === "v1") {
    if (!requireAuth(req, res)) return;
  }

  // GET /v1/hotels/:resortId/reservations?confirmationNumber=...
  if (
    req.method === "GET" &&
    segments[0] === "v1" &&
    segments[1] === "hotels" &&
    segments[2] &&
    segments[3] === "reservations" &&
    segments.length === 4
  ) {
    const confirmationNumber = (url.searchParams.get("confirmationNumber") ?? "").trim();
    if (!confirmationNumber) {
      sendJson(res, 400, { error: "missing_confirmationNumber" });
      return;
    }
    sendJson(res, 200, buildReservation(confirmationNumber));
    return;
  }

  // GET /v1/hotels/:resortId/reservations/:reservationId/folios
  if (
    req.method === "GET" &&
    segments[0] === "v1" &&
    segments[1] === "hotels" &&
    segments[2] &&
    segments[3] === "reservations" &&
    segments[4] &&
    segments[5] === "folios" &&
    segments.length === 6
  ) {
    const reservationId = decodeURIComponent(segments[4]);
    sendJson(res, 200, buildFolio(reservationId));
    return;
  }

  // PUT /v1/hotels/:resortId/profiles/:guestId
  if (
    req.method === "PUT" &&
    segments[0] === "v1" &&
    segments[1] === "hotels" &&
    segments[2] &&
    segments[3] === "profiles" &&
    segments[4] &&
    segments.length === 5
  ) {
    const guestId = decodeURIComponent(segments[4]);
    const payload = await readJson(req);
    if (!payload || typeof payload !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }
    sendJson(res, 200, { id: guestId, updatedAt: new Date().toISOString(), requestId: randomUUID(), ...payload });
    return;
  }

  sendJson(res, 404, { error: "not_found" });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`opera-mock listening on http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log(`- Health: http://${host}:${port}/health`);
  // eslint-disable-next-line no-console
  console.log(`- Reservations: GET http://${host}:${port}/v1/hotels/<resortId>/reservations?confirmationNumber=...`);
});

