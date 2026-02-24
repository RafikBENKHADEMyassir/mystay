import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { hashPassword, verifyPassword } from "./auth/password.mjs";
import { signToken, verifyToken } from "./auth/token.mjs";
import { query } from "./db/postgres.mjs";
import { resolveGuestContent } from "./guest-content/default-content.mjs";
import {
  getHotelById,
  getHotelIntegrations,
  updateHotelDigitalKeyIntegration,
  updateHotelPmsIntegration,
  updateHotelSpaIntegration
} from "./integrations/hotel-integrations.mjs";
import { IntegrationManager } from "./integrations/integration-manager.mjs";
import {
  digitalKeyProviderConfigTemplates,
  digitalKeyProviders,
  pmsProviderConfigTemplates,
  pmsProviders,
  spaProviderConfigTemplates,
  spaProviders
} from "./integrations/options.mjs";
import {
  emailProviderConfigTemplates,
  emailProviders,
  pushProviderConfigTemplates,
  pushProviders,
  smsProviderConfigTemplates,
  smsProviders
} from "./notifications/options.mjs";
import {
  getHotelNotifications,
  updateHotelEmailNotifications,
  updateHotelPushNotifications,
  updateHotelSmsNotifications
} from "./notifications/hotel-notifications.mjs";
import { emitRealtimeEvent, ensureRealtimeListener, subscribeMessages } from "./realtime.mjs";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, status, body, { contentType = "text/plain; charset=utf-8", headers = {} } = {}) {
  const buffer = Buffer.from(body ?? "", "utf8");
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": buffer.length,
    ...headers
  });
  res.end(buffer);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : "*";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "600");
  if (allowOrigin !== "*") res.setHeader("Vary", "Origin");
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

function addEqualsFilter(where, params, column, value) {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (!normalized) return;
  params.push(normalized);
  where.push(`${column} = $${params.length}`);
}

function parseIsoDate(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== normalized) return null;
  return normalized;
}

function parsePositiveInt(value, fallback) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const asInt = Math.floor(parsed);
  if (asInt <= 0) return fallback;
  return asInt;
}

function normalizeText(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || null;
}

function normalizeEmail(value) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return raw || null;
}

function normalizeDateLike(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const date = raw.slice(0, 10);
  return parseIsoDate(date);
}

function isPgRelationMissing(error) {
  if (!error || typeof error !== "object") return false;
  const code = typeof error.code === "string" ? error.code : "";
  return code === "42P01";
}

async function getGuestContentOverride(hotelId) {
  try {
    const rows = await query(`SELECT content FROM guest_content_configs WHERE hotel_id = $1 LIMIT 1`, [hotelId]);
    const content = rows[0]?.content;
    return content && typeof content === "object" && !Array.isArray(content) ? content : null;
  } catch (error) {
    if (isPgRelationMissing(error)) return null;
    throw error;
  }
}

function toAmountCents(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

async function resolveGuestIdByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const guestRows = await query(`SELECT id FROM guests WHERE LOWER(email) = $1 LIMIT 1`, [normalized]);
  return typeof guestRows[0]?.id === "string" && guestRows[0].id.trim() ? guestRows[0].id.trim() : null;
}

async function upsertStayFromPmsReservation(hotelId, reservation) {
  if (!reservation || typeof reservation !== "object") throw new Error("invalid_reservation");

  const confirmationNumber = normalizeText(reservation.confirmationNumber);
  if (!confirmationNumber) throw new Error("missing_confirmation_number");

  const checkInDate = normalizeDateLike(reservation.checkInDate);
  const checkOutDate = normalizeDateLike(reservation.checkOutDate);
  if (!checkInDate || !checkOutDate) throw new Error("invalid_stay_dates");

  const pmsReservationId = normalizeText(reservation.id);
  const pmsStatus = normalizeText(reservation.status);

  const guestFirstName = normalizeText(reservation.guestFirstName);
  const guestLastName = normalizeText(reservation.guestLastName);
  const guestEmail = normalizeEmail(reservation.guestEmail);
  const guestPhone = normalizeText(reservation.guestPhone);

  const roomNumber = normalizeText(reservation.roomNumber);
  const adults = typeof reservation.adults === "number" && reservation.adults > 0 ? Math.floor(reservation.adults) : 1;
  const children = typeof reservation.children === "number" && reservation.children >= 0 ? Math.floor(reservation.children) : 0;

  const linkedGuestId = await resolveGuestIdByEmail(guestEmail);

  const stayId = `S-${randomUUID().slice(0, 8).toUpperCase()}`;

  const rows = await query(
    `
      INSERT INTO stays (
        id,
        hotel_id,
        guest_id,
        confirmation_number,
        pms_reservation_id,
        pms_status,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        room_number,
        check_in,
        check_out,
        adults,
        children,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::date, $13::date, $14, $15, NOW(), NOW())
      ON CONFLICT (confirmation_number) DO UPDATE
      SET
        guest_id = COALESCE(stays.guest_id, EXCLUDED.guest_id),
        pms_reservation_id = COALESCE(NULLIF(EXCLUDED.pms_reservation_id, ''), stays.pms_reservation_id),
        pms_status = COALESCE(NULLIF(EXCLUDED.pms_status, ''), stays.pms_status),
        guest_first_name = COALESCE(NULLIF(EXCLUDED.guest_first_name, ''), stays.guest_first_name),
        guest_last_name = COALESCE(NULLIF(EXCLUDED.guest_last_name, ''), stays.guest_last_name),
        guest_email = COALESCE(NULLIF(EXCLUDED.guest_email, ''), stays.guest_email),
        guest_phone = COALESCE(NULLIF(EXCLUDED.guest_phone, ''), stays.guest_phone),
        room_number = COALESCE(EXCLUDED.room_number, stays.room_number),
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        adults = EXCLUDED.adults,
        children = EXCLUDED.children,
        updated_at = NOW()
      WHERE stays.hotel_id = EXCLUDED.hotel_id
      RETURNING
        id,
        hotel_id AS "hotelId",
        guest_id AS "guestId",
        confirmation_number AS "confirmationNumber",
        pms_reservation_id AS "pmsReservationId",
        pms_status AS "pmsStatus"
    `,
    [
      stayId,
      hotelId,
      linkedGuestId,
      confirmationNumber,
      pmsReservationId,
      pmsStatus,
      guestFirstName,
      guestLastName,
      guestEmail,
      guestPhone,
      roomNumber,
      checkInDate,
      checkOutDate,
      adults,
      children
    ]
  );

  if (rows.length === 0) {
    throw new Error("stay_upsert_conflict");
  }

  return rows[0];
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  if (!/[",\n\r]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

function getRequestToken(req, url) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const tokenParam = url.searchParams.get("token");
  if (tokenParam) return tokenParam.trim();

  return null;
}

function parsePrincipal(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  if (payload.typ === "guest") {
    // Support both old format (hotelId + stayId required) and new format (guestId with optional hotelId/stayId)
    const guestId = typeof payload.guestId === "string" ? payload.guestId.trim() : "";
    const hotelId = typeof payload.hotelId === "string" ? payload.hotelId.trim() : null;
    const stayId = typeof payload.stayId === "string" ? payload.stayId.trim() : null;

    // New format: guestId is always required for authenticated guests
    if (guestId) {
      return {
        typ: "guest",
        guestId,
        hotelId,
        stayId,
        email: typeof payload.email === "string" ? payload.email : null,
        firstName: typeof payload.firstName === "string" ? payload.firstName : null,
        lastName: typeof payload.lastName === "string" ? payload.lastName : null
      };
    }

    // Old format: hotelId + stayId required (for backward compatibility with confirmation lookup)
    if (hotelId && stayId) {
      return { typ: "guest", guestId: null, hotelId, stayId };
    }

    return null;
  }

  if (payload.typ === "staff") {
    const hotelId = typeof payload.hotelId === "string" ? payload.hotelId.trim() : "";
    if (!hotelId) return null;

    const staffUserId = typeof payload.staffUserId === "string" ? payload.staffUserId.trim() : "";
    const role = typeof payload.role === "string" ? payload.role.trim() : "";
    if (!staffUserId || !role) return null;

    const departments = Array.isArray(payload.departments)
      ? payload.departments.filter((dept) => typeof dept === "string").map((dept) => dept.trim()).filter(Boolean)
      : [];

    return {
      typ: "staff",
      hotelId,
      staffUserId,
      role,
      departments,
      email: typeof payload.email === "string" ? payload.email : null,
      displayName: typeof payload.displayName === "string" ? payload.displayName : null
    };
  }

  if (payload.typ === "platform_admin") {
    const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!sub) return null;

    return {
      typ: "platform_admin",
      sub,
      email: typeof payload.email === "string" ? payload.email : null,
      displayName: typeof payload.displayName === "string" ? payload.displayName : null
    };
  }

  return null;
}

function getPrincipal(req, url) {
  const token = getRequestToken(req, url);
  if (!token) return { principal: null, error: null };

  try {
    const payload = verifyToken(token);
    const principal = parsePrincipal(payload);
    if (!principal) return { principal: null, error: "invalid_token" };
    return { principal, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_token";
    return { principal: null, error: message === "token_expired" ? "token_expired" : "invalid_token" };
  }
}

function requirePrincipal(req, res, url, allowedTypes) {
  const { principal, error } = getPrincipal(req, url);
  if (error) {
    sendJson(res, 401, { error });
    return null;
  }

  if (!principal) {
    sendJson(res, 401, { error: "unauthorized" });
    return null;
  }

  if (!allowedTypes.includes(principal.typ)) {
    sendJson(res, 403, { error: "forbidden" });
    return null;
  }

  return principal;
}

function requireStaffRole(res, principal, allowedRoles) {
  if (principal.typ !== "staff") {
    sendJson(res, 403, { error: "forbidden" });
    return false;
  }

  if (!allowedRoles.includes(principal.role)) {
    sendJson(res, 403, { error: "forbidden" });
    return false;
  }

  return true;
}

function isDepartmentAllowed(principal, department) {
  if (!principal || principal.typ !== "staff") return false;
  if (principal.role === "admin" || principal.role === "manager") return true;
  if (!Array.isArray(principal.departments) || principal.departments.length === 0) return false;
  return principal.departments.includes(department);
}

function getGuestDisplayName(principal) {
  if (!principal || principal.typ !== "guest") return null;
  const firstName = typeof principal.firstName === "string" ? principal.firstName.trim() : "";
  const lastName = typeof principal.lastName === "string" ? principal.lastName.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  const email = typeof principal.email === "string" ? principal.email.trim() : "";
  return email || null;
}

async function listStaffNotificationTargets({ hotelId, department }) {
  const rows = await query(
    `
      SELECT
        id,
        email,
        display_name AS "displayName",
        role,
        departments
      FROM staff_users
      WHERE
        hotel_id = $1
        AND (
          role = 'admin'
          OR departments @> ARRAY[$2]::text[]
        )
    `,
    [hotelId, department]
  );

  return rows
    .map((row) => ({
      id: row.id,
      email: typeof row.email === "string" ? row.email.trim() : "",
      displayName: typeof row.displayName === "string" ? row.displayName.trim() : null
    }))
    .filter((row) => row.id && row.email);
}

async function listStaffNotificationTargetsByIds({ hotelId, staffUserIds }) {
  const ids = Array.isArray(staffUserIds)
    ? staffUserIds.filter((id) => typeof id === "string").map((id) => id.trim()).filter(Boolean)
    : [];
  if (ids.length === 0) return [];

  const rows = await query(
    `
      SELECT
        id,
        email,
        display_name AS "displayName"
      FROM staff_users
      WHERE hotel_id = $1 AND id = ANY($2::text[])
    `,
    [hotelId, Array.from(new Set(ids))]
  );

  return rows
    .map((row) => ({
      id: row.id,
      email: typeof row.email === "string" ? row.email.trim() : "",
      displayName: typeof row.displayName === "string" ? row.displayName.trim() : null
    }))
    .filter((row) => row.id && row.email);
}

async function pickDefaultThreadAssignee({ hotelId, department }) {
  const normalizedHotelId = typeof hotelId === "string" ? hotelId.trim() : "";
  const requestedDepartment = typeof department === "string" ? department.trim() : "";
  const normalizedDepartment = requestedDepartment ? requestedDepartment.replace(/_/g, "-") : "";

  if (!normalizedHotelId || !normalizedDepartment) return null;

  const rows = await query(
    `
      SELECT id
      FROM staff_users
      WHERE
        hotel_id = $1
        AND (
          departments @> ARRAY[$2]::text[]
          OR role IN ('manager', 'admin')
        )
      ORDER BY
        CASE
          WHEN departments @> ARRAY[$2]::text[] AND role = 'staff' THEN 1
          WHEN departments @> ARRAY[$2]::text[] AND role = 'manager' THEN 2
          WHEN departments @> ARRAY[$2]::text[] AND role = 'admin' THEN 3
          WHEN role = 'manager' THEN 4
          WHEN role = 'admin' THEN 5
          ELSE 6
        END,
        created_at ASC
      LIMIT 1
    `,
    [normalizedHotelId, normalizedDepartment]
  );

  return rows[0]?.id ?? null;
}

async function enqueueEmailOutbox({ hotelId, toAddress, subject, bodyText, payload }) {
  const settings = await getHotelNotifications(hotelId);
  const provider = settings.email.provider;
  if (!provider || provider === "none") return null;

  const id = `N-${randomUUID().slice(0, 8).toUpperCase()}`;
  const payloadJson = payload ? JSON.stringify(payload) : "{}";

  const rows = await query(
    `
      INSERT INTO notification_outbox (
        id,
        hotel_id,
        channel,
        provider,
        to_address,
        subject,
        body_text,
        payload,
        status,
        attempts,
        next_attempt_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'email', $3, $4, $5, $6, $7::jsonb, 'pending', 0, NOW(), NOW(), NOW())
      RETURNING
        id,
        hotel_id AS "hotelId",
        channel,
        provider,
        to_address AS "toAddress",
        status,
        created_at AS "createdAt"
    `,
    [id, hotelId, provider, toAddress, subject || null, bodyText || "", payloadJson]
  );

  return rows[0] ?? null;
}

const server = createServer((req, res) => {
  Promise.resolve(handleRequest(req, res)).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      setCors(req, res);
      sendJson(res, 500, { error: "internal_error" });
    } else {
      res.end();
    }
  });
});

async function handleRequest(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/") {
    sendJson(res, 200, {
      ok: true,
      service: "mystay-backend",
      docs: {
        health: "/health",
        staysLookup: "/api/v1/stays/lookup?confirmation=0123456789",
        tickets: "/api/v1/tickets",
        threads: "/api/v1/threads",
        events: "/api/v1/events",
        invoices: "/api/v1/invoices"
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "mystay-backend", time: new Date().toISOString() });
    return;
  }

  // Serve static files from /uploads
  if (req.method === "GET" && url.pathname.startsWith("/uploads/")) {
    const backendDir = join(fileURLToPath(import.meta.url), "../..");
    const uploadsDir = join(backendDir, "public", "uploads");
    const filename = url.pathname.substring("/uploads/".length);
    const filepath = join(uploadsDir, filename);

    // Security: prevent path traversal
    if (!filepath.startsWith(uploadsDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (!existsSync(filepath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = extname(filepath).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml"
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    createReadStream(filepath).pipe(res);
    return;
  }

  // Upload endpoint
  if (req.method === "POST" && url.pathname === "/api/v1/upload") {
    try {
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("multipart/form-data")) {
        sendJson(res, 400, { error: "Content-Type must be multipart/form-data" });
        return;
      }

      const boundary = contentType.split("boundary=")[1];
      if (!boundary) {
        sendJson(res, 400, { error: "Missing boundary in Content-Type" });
        return;
      }

      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Parse multipart form data
      const boundaryBuffer = Buffer.from(`--${boundary}`);
      const parts = [];
      let start = 0;
      while (true) {
        const pos = buffer.indexOf(boundaryBuffer, start);
        if (pos === -1) break;
        if (start > 0) {
          parts.push(buffer.slice(start, pos));
        }
        start = pos + boundaryBuffer.length;
      }

      // Find file part
      let fileData = null;
      let filename = null;
      for (const part of parts) {
        const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
        if (headerEnd === -1) continue;

        const headers = part.slice(0, headerEnd).toString();
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
          fileData = part.slice(headerEnd + 4, part.length - 2); // Remove \r\n at end
          break;
        }
      }

      if (!fileData || !filename) {
        sendJson(res, 400, { error: "No file provided" });
        return;
      }

      // Validate file size (5MB max)
      if (fileData.length > 5 * 1024 * 1024) {
        sendJson(res, 400, { error: "File too large. Maximum size is 5MB." });
        return;
      }

      // Validate file type
      const ext = extname(filename).toLowerCase();
      const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
      if (!allowedExts.includes(ext)) {
        sendJson(res, 400, { error: "Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed." });
        return;
      }

      // Save file
      const backendDir = join(fileURLToPath(import.meta.url), "../..");
      const uploadsDir = join(backendDir, "public", "uploads");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const newFilename = `${timestamp}-${safeFilename}`;
      const filepath = join(uploadsDir, newFilename);

      await writeFile(filepath, fileData);

      const url = `/uploads/${newFilename}`;
      sendJson(res, 200, { url });
      return;
    } catch (error) {
      console.error("Upload error:", error);
      sendJson(res, 500, { error: "Failed to upload file" });
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/api/v1/auth/staff/login") {
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      sendJson(res, 400, { error: "missing_fields", required: ["email", "password"] });
      return;
    }

    const users = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          email,
          display_name AS "displayName",
          role,
          departments,
          password_hash AS "passwordHash"
        FROM staff_users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    const user = users[0];
    if (!user) {
      sendJson(res, 401, { error: "invalid_credentials" });
      return;
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      sendJson(res, 401, { error: "invalid_credentials" });
      return;
    }

    const token = signToken(
      {
        typ: "staff",
        staffUserId: user.id,
        hotelId: user.hotelId,
        role: user.role,
        departments: Array.isArray(user.departments) ? user.departments : [],
        email: user.email,
        displayName: user.displayName
      },
      { expiresInSeconds: 60 * 60 * 12 }
    );

    sendJson(res, 200, {
      token,
      user: {
        id: user.id,
        hotelId: user.hotelId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        departments: Array.isArray(user.departments) ? user.departments : []
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/v1/auth/me") {
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;
    sendJson(res, 200, { principal });
    return;
  }

  // POST /api/v1/auth/guest/signup - Create a new guest account
  if (req.method === "POST" && url.pathname === "/api/v1/auth/guest/signup") {
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;

    if (!email || !password || !firstName || !lastName) {
      sendJson(res, 400, { error: "missing_fields", required: ["email", "password", "firstName", "lastName"] });
      return;
    }

    if (password.length < 6) {
      sendJson(res, 400, { error: "password_too_short", minLength: 6 });
      return;
    }

    // Check if email already exists
    const existingGuest = await query(`SELECT id FROM guests WHERE email = $1 LIMIT 1`, [email]);
    if (existingGuest[0]) {
      sendJson(res, 409, { error: "email_already_exists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const guestId = `G-${randomUUID().slice(0, 8).toUpperCase()}`;
    const emailVerificationToken = randomUUID();
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `
        INSERT INTO guests (
          id,
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          email_verification_token,
          email_verification_expires_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `,
      [guestId, email, passwordHash, firstName, lastName, phone, emailVerificationToken, emailVerificationExpiresAt]
    );

    // Create a token for the guest (without hotel/stay scope - explore mode)
    const token = signToken(
      {
        typ: "guest",
        guestId,
        email,
        firstName,
        lastName,
        hotelId: null,
        stayId: null
      },
      { expiresInSeconds: 60 * 60 * 24 * 7 } // 7 days
    );

    // TODO: Send verification email
    // For now, we'll auto-verify for development
    await query(`UPDATE guests SET email_verified = true WHERE id = $1`, [guestId]);

    sendJson(res, 201, {
      token,
      guest: {
        id: guestId,
        email,
        firstName,
        lastName,
        phone,
        emailVerified: true
      }
    });
    return;
  }

  // POST /api/v1/auth/guest/login - Login with email and password
  if (req.method === "POST" && url.pathname === "/api/v1/auth/guest/login") {
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      sendJson(res, 400, { error: "missing_fields", required: ["email", "password"] });
      return;
    }

    const guests = await query(
      `
        SELECT
          id,
          email,
          password_hash AS "passwordHash",
          first_name AS "firstName",
          last_name AS "lastName",
          phone,
          email_verified AS "emailVerified",
          id_document_verified AS "idDocumentVerified",
          payment_method_id AS "paymentMethodId"
        FROM guests
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    const guest = guests[0];
    if (!guest) {
      sendJson(res, 401, { error: "invalid_credentials" });
      return;
    }

    const ok = await verifyPassword(password, guest.passwordHash);
    if (!ok) {
      sendJson(res, 401, { error: "invalid_credentials" });
      return;
    }

    // Check if guest has any active reservation
    const stayRows = await query(
      `
        SELECT
          s.id AS "stayId",
          s.hotel_id AS "hotelId",
          s.confirmation_number AS "confirmationNumber",
          s.room_number AS "roomNumber",
          s.check_in AS "checkIn",
          s.check_out AS "checkOut",
          s.adults,
          s.children,
          h.name AS "hotelName"
        FROM stays s
        JOIN hotels h ON h.id = s.hotel_id
        WHERE s.guest_id = $1
        AND s.check_out >= CURRENT_DATE
        ORDER BY s.check_in ASC
        LIMIT 1
      `,
      [guest.id]
    );

    const activeStay = stayRows[0] ?? null;

    const token = signToken(
      {
        typ: "guest",
        guestId: guest.id,
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        hotelId: activeStay?.hotelId ?? null,
        stayId: activeStay?.stayId ?? null
      },
      { expiresInSeconds: 60 * 60 * 24 * 7 } // 7 days
    );

    sendJson(res, 200, {
      token,
      guest: {
        id: guest.id,
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone,
        emailVerified: guest.emailVerified,
        idDocumentVerified: guest.idDocumentVerified,
        hasPaymentMethod: !!guest.paymentMethodId
      },
      stay: activeStay
        ? {
            id: activeStay.stayId,
            hotelId: activeStay.hotelId,
            hotelName: activeStay.hotelName,
            confirmationNumber: activeStay.confirmationNumber,
            roomNumber: activeStay.roomNumber,
            checkIn: activeStay.checkIn,
            checkOut: activeStay.checkOut,
            guests: { adults: activeStay.adults, children: activeStay.children }
          }
        : null
    });
    return;
  }

  // POST /api/v1/auth/guest/link-reservation - Link a reservation to the guest account
  if (req.method === "POST" && url.pathname === "/api/v1/auth/guest/link-reservation") {
    const { principal, error } = getPrincipal(req, url);
    if (error) {
      sendJson(res, 401, { error });
      return;
    }
    if (!principal || principal.typ !== "guest") {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const confirmationNumber = typeof body.confirmationNumber === "string" ? body.confirmationNumber.trim() : "";
    if (!confirmationNumber) {
      sendJson(res, 400, { error: "missing_fields", required: ["confirmationNumber"] });
      return;
    }

    // Look up the stay
    const stayRows = await query(
      `
        SELECT
          s.id AS "stayId",
          s.hotel_id AS "hotelId",
          s.guest_id AS "guestId",
          s.confirmation_number AS "confirmationNumber",
          s.room_number AS "roomNumber",
          s.check_in AS "checkIn",
          s.check_out AS "checkOut",
          s.adults,
          s.children,
          h.name AS "hotelName"
        FROM stays s
        JOIN hotels h ON h.id = s.hotel_id
        WHERE s.confirmation_number = $1
        LIMIT 1
      `,
      [confirmationNumber]
    );

    let stay = stayRows[0] ?? null;

    // If stay doesn't exist, try to locate it via PMS and upsert into cache
    if (!stay) {
      const hotels = await query(`SELECT id FROM hotels ORDER BY name ASC LIMIT 50`);
      let matchedHotelId = null;
      let matchedReservation = null;

      for (const hotel of hotels) {
        const hotelId = typeof hotel?.id === "string" ? hotel.id.trim() : "";
        if (!hotelId) continue;
        try {
          const integrations = await getHotelIntegrations(hotelId);
          const integrationManager = new IntegrationManager(integrations);
          const reservation = await integrationManager.getPMS().getReservation(confirmationNumber);
          if (reservation) {
            matchedHotelId = hotelId;
            matchedReservation = reservation;
            break;
          }
        } catch {
          // Ignore PMS errors for individual hotels; try the next one.
        }
      }

      if (!matchedHotelId || !matchedReservation) {
        sendJson(res, 404, { error: "stay_not_found" });
        return;
      }

      try {
        await upsertStayFromPmsReservation(matchedHotelId, matchedReservation);
      } catch (error) {
        console.error("stay_upsert_failed", error);
        sendJson(res, 502, { error: "pms_sync_failed" });
        return;
      }

      const refreshedRows = await query(
        `
          SELECT
            s.id AS "stayId",
            s.hotel_id AS "hotelId",
            s.guest_id AS "guestId",
            s.confirmation_number AS "confirmationNumber",
            s.room_number AS "roomNumber",
            s.check_in AS "checkIn",
            s.check_out AS "checkOut",
            s.adults,
            s.children,
            h.name AS "hotelName"
          FROM stays s
          JOIN hotels h ON h.id = s.hotel_id
          WHERE s.confirmation_number = $1
          LIMIT 1
        `,
        [confirmationNumber]
      );
      stay = refreshedRows[0] ?? null;
    }

    if (!stay) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    // Stay exists - check if already linked to another guest
    if (stay.guestId && stay.guestId !== principal.guestId) {
      sendJson(res, 409, { error: "reservation_already_linked" });
      return;
    }

    // Link to this guest
    if (!stay.guestId) {
      await query(`UPDATE stays SET guest_id = $1, updated_at = NOW() WHERE id = $2`, [principal.guestId, stay.stayId]);
      stay.guestId = principal.guestId;
    }

    // Generate a new token with the hotel/stay context
    const token = signToken(
      {
        typ: "guest",
        guestId: principal.guestId,
        email: principal.email,
        firstName: principal.firstName,
        lastName: principal.lastName,
        hotelId: stay.hotelId,
        stayId: stay.stayId
      },
      { expiresInSeconds: 60 * 60 * 24 * 7 } // 7 days
    );

    sendJson(res, 200, {
      token,
      stay: {
        id: stay.stayId,
        hotelId: stay.hotelId,
        hotelName: stay.hotelName,
        confirmationNumber: stay.confirmationNumber,
        roomNumber: stay.roomNumber,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: { adults: stay.adults, children: stay.children }
      }
    });
    return;
  }

  // GET /api/v1/hotels/public - List all hotels (public endpoint for explore mode)
  if (req.method === "GET" && url.pathname === "/api/v1/hotels/public") {
    const hotelRows = await query(
      `
        SELECT
          id,
          name,
          description,
          logo_url AS "logoUrl",
          cover_image_url AS "coverImageUrl",
          primary_color AS "primaryColor",
          secondary_color AS "secondaryColor",
          city,
          country,
          star_rating AS "starRating",
          amenities,
          created_at AS "createdAt"
        FROM hotels
        WHERE is_active = true
        ORDER BY name ASC
        LIMIT 100
      `
    );

    sendJson(res, 200, { items: hotelRows });
    return;
  }

  // =====================================================
  // PUBLIC: PAY BY LINK
  // =====================================================

  // GET /api/v1/public/payment-links/:token - Fetch payment link details (public)
  const publicPaymentLinkMatch = url.pathname.match(/^\/api\/v1\/public\/payment-links\/([^/]+)$/);
  if (req.method === "GET" && publicPaymentLinkMatch) {
    const token = decodeURIComponent(publicPaymentLinkMatch[1]);
    if (!token) {
      sendJson(res, 400, { error: "missing_token" });
      return;
    }

    const rows = await query(
      `
        SELECT
          pl.id,
          pl.hotel_id AS "hotelId",
          h.name AS "hotelName",
          pl.amount_cents AS "amountCents",
          pl.currency,
          pl.reason_text AS "reasonText",
          pl.payment_status AS "paymentStatus",
          pl.expires_at AS "expiresAt",
          pl.created_at AS "createdAt"
        FROM payment_links pl
        JOIN hotels h ON h.id = pl.hotel_id
        WHERE pl.public_token = $1
        LIMIT 1
      `,
      [token]
    );

    const row = rows[0] ?? null;
    if (!row) {
      sendJson(res, 404, { error: "payment_link_not_found" });
      return;
    }

    const now = new Date();
    const isExpired = row.paymentStatus !== "paid" && row.expiresAt && new Date(row.expiresAt).getTime() <= now.getTime();
    const paymentStatus = isExpired ? "expired" : row.paymentStatus;

    sendJson(res, 200, {
      id: row.id,
      hotel: { id: row.hotelId, name: row.hotelName },
      amountCents: row.amountCents,
      currency: row.currency,
      reasonText: row.reasonText,
      paymentStatus,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt
    });
    return;
  }

  // POST /api/v1/public/payment-links/:token/pay - Simulate payment completion (public)
  const publicPaymentLinkPayMatch = url.pathname.match(/^\/api\/v1\/public\/payment-links\/([^/]+)\/pay$/);
  if (req.method === "POST" && publicPaymentLinkPayMatch) {
    const token = decodeURIComponent(publicPaymentLinkPayMatch[1]);
    if (!token) {
      sendJson(res, 400, { error: "missing_token" });
      return;
    }

    const rows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          payment_status AS "paymentStatus",
          expires_at AS "expiresAt"
        FROM payment_links
        WHERE public_token = $1
        LIMIT 1
      `,
      [token]
    );

    const row = rows[0] ?? null;
    if (!row) {
      sendJson(res, 404, { error: "payment_link_not_found" });
      return;
    }

    const now = new Date();
    const isExpired =
      row.paymentStatus !== "paid" && row.expiresAt && new Date(row.expiresAt).getTime() <= now.getTime();
    if (isExpired || row.paymentStatus === "expired") {
      sendJson(res, 400, { error: "payment_link_expired" });
      return;
    }

    if (row.paymentStatus === "paid") {
      sendJson(res, 200, { ok: true, status: "paid" });
      return;
    }

    await query(
      `
        UPDATE payment_links
        SET payment_status = 'paid', paid_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `,
      [row.id]
    );

    sendJson(res, 200, { ok: true, status: "paid" });
    return;
  }

	  if (req.method === "GET" && url.pathname === "/api/v1/realtime/messages") {
	    const threadId = url.searchParams.get("threadId")?.trim();
        const requestedDepartments = url.searchParams.getAll("departments").map((d) => d.trim()).filter(Boolean);
        if (url.searchParams.has("departments")) {
            url.searchParams.get("departments").split(",").forEach(d => {
                const t = d.trim();
                if(t && !requestedDepartments.includes(t)) requestedDepartments.push(t);
            });
        }

    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    if (principal.typ === "guest" && (!principal.hotelId || !principal.stayId)) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

        if (threadId) {
	    const scopeRows = await query(
	      `
	        SELECT
	          hotel_id AS "hotelId",
	          stay_id AS "stayId",
	          department
	        FROM threads
	        WHERE id = $1
	        LIMIT 1
	      `,
	      [threadId]
	    );

    const scope = scopeRows[0];
    if (!scope) {
      sendJson(res, 404, { error: "thread_not_found" });
      return;
    }

    if (principal.typ === "guest" && scope.stayId !== principal.stayId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
	    if (principal.typ === "staff" && scope.hotelId !== principal.hotelId) {
	      sendJson(res, 403, { error: "forbidden" });
	      return;
	    }
	    if (principal.typ === "staff" && !isDepartmentAllowed(principal, scope.department)) {
	      sendJson(res, 403, { error: "forbidden" });
	      return;
	    }
        }

    try {
      await ensureRealtimeListener();
    } catch {
      sendJson(res, 500, { error: "realtime_unavailable" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write(": connected\n\n");
    res.flushHeaders?.();

    const requestedHotelId = url.searchParams.get("hotelId")?.trim();

    const unsubscribe = subscribeMessages({ 
        res, 
        threadId: threadId || undefined,
        hotelId: principal.hotelId || requestedHotelId,
        stayId: principal.typ === "guest" ? principal.stayId : undefined,
        departments: requestedDepartments.length ? requestedDepartments : undefined
    });
    
    req.on("close", () => {
      unsubscribe();
    });
	    return;
	  }

  // GET /api/v1/realtime/stay - SSE endpoint for guest stay-level events (messages, threads)
  if (req.method === "GET" && url.pathname === "/api/v1/realtime/stay") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    if (!principal.hotelId || !principal.stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    try {
      await ensureRealtimeListener();
    } catch {
      sendJson(res, 500, { error: "realtime_unavailable" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write(": connected\n\n");
    res.flushHeaders?.();

    const unsubscribe = subscribeMessages({ res, hotelId: principal.hotelId, stayId: principal.stayId });
    req.on("close", () => {
      unsubscribe();
    });
    return;
  }

	  if (req.method === "GET" && url.pathname === "/api/v1/realtime/hotel") {
	    const principal = requirePrincipal(req, res, url, ["staff"]);
	    if (!principal) return;
	    if (
	      principal.role !== "admin" &&
	      principal.role !== "manager" &&
	      (!Array.isArray(principal.departments) || principal.departments.length === 0)
	    ) {
	      sendJson(res, 403, { error: "forbidden" });
	      return;
	    }

    try {
      await ensureRealtimeListener();
    } catch {
      sendJson(res, 500, { error: "realtime_unavailable" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write(": connected\n\n");
    res.flushHeaders?.();

	    const unsubscribe = subscribeMessages({
	      res,
	      hotelId: principal.hotelId,
	      departments: principal.role === "admin" || principal.role === "manager" ? null : principal.departments
	    });
	    req.on("close", () => {
	      unsubscribe();
	    });
	    return;
	  }

  // GET /api/v1/realtime/orders - SSE endpoint for order/ticket status updates
  if (req.method === "GET" && url.pathname === "/api/v1/realtime/orders") {
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const ticketId = url.searchParams.get("ticketId")?.trim();
    if (!ticketId) {
      sendJson(res, 400, { error: "missing_ticket_id" });
      return;
    }

    // Verify access to the ticket
    const ticketRows = await query(
      `
        SELECT hotel_id AS "hotelId", stay_id AS "stayId", department
        FROM tickets
        WHERE id = $1
        LIMIT 1
      `,
      [ticketId]
    );

    const ticket = ticketRows[0];
    if (!ticket) {
      sendJson(res, 404, { error: "ticket_not_found" });
      return;
    }

    if (ticket.hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    if (principal.typ === "guest" && ticket.stayId !== principal.stayId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    if (principal.typ === "staff" && !isDepartmentAllowed(principal, ticket.department)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    try {
      await ensureRealtimeListener();
    } catch {
      sendJson(res, 500, { error: "realtime_unavailable" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write(": connected\n\n");
    res.flushHeaders?.();

    const unsubscribe = subscribeMessages({
      res,
      ticketId,
      hotelId: ticket.hotelId,
      departments: null // Allow all events for this specific ticket
    });

    req.on("close", () => {
      unsubscribe();
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/v1/integrations/options") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    sendJson(res, 200, {
      pms: { providers: pmsProviders, configTemplates: pmsProviderConfigTemplates },
      digitalKey: { providers: digitalKeyProviders, configTemplates: digitalKeyProviderConfigTemplates },
      spa: { providers: spaProviders, configTemplates: spaProviderConfigTemplates },
      notifications: {
        email: { providers: emailProviders, configTemplates: emailProviderConfigTemplates },
        sms: { providers: smsProviders, configTemplates: smsProviderConfigTemplates },
        push: { providers: pushProviders, configTemplates: pushProviderConfigTemplates }
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/v1/hotels") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const hotel = await getHotelById(principal.hotelId);
    sendJson(res, 200, { items: hotel ? [hotel] : [] });
    return;
  }

  // =====================================================
  // PLATFORM ADMIN ENDPOINTS
  // =====================================================

  // POST /api/v1/auth/platform/login - Platform admin login
  if (req.method === "POST" && url.pathname === "/api/v1/auth/platform/login") {
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      sendJson(res, 400, { error: "missing_fields", required: ["email", "password"] });
      return;
    }

    const admins = await query(
      `
        SELECT
          id,
          email,
          display_name AS "displayName",
          password_hash AS "passwordHash"
        FROM platform_admins
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    const admin = admins[0];
    if (!admin) {
      sendJson(res, 401, { error: "invalid_credentials" });
      return;
    }

    const passwordValid = await verifyPassword(password, admin.passwordHash);
    if (!passwordValid) {
      sendJson(res, 401, { error: "invalid_credentials" });
      return;
    }

    const token = await signToken({
      typ: "platform_admin",
      sub: admin.id,
      email: admin.email,
      displayName: admin.displayName
    });

    sendJson(res, 200, {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName
      }
    });
    return;
  }

  // GET /api/v1/admin/hotels - List all hotels (platform admin only)
  if (req.method === "GET" && url.pathname === "/api/v1/admin/hotels") {
    const principal = requirePrincipal(req, res, url, ["platform_admin"]);
    if (!principal) return;

    const hotels = await query(
      `
        SELECT
          id,
          name,
          description,
          logo_url AS "logoUrl",
          cover_image_url AS "coverImageUrl",
          primary_color AS "primaryColor",
          secondary_color AS "secondaryColor",
          address,
          city,
          country,
          phone,
          email,
          website,
          timezone,
          currency,
          star_rating AS "starRating",
          amenities,
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM hotels
        ORDER BY name ASC
      `
    );

    sendJson(res, 200, { items: hotels });
    return;
  }

  // POST /api/v1/admin/hotels - Create a new hotel (platform admin only)
  if (req.method === "POST" && url.pathname === "/api/v1/admin/hotels") {
    const principal = requirePrincipal(req, res, url, ["platform_admin"]);
    if (!principal) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      sendJson(res, 400, { error: "missing_fields", required: ["name"] });
      return;
    }

    const hotelId = randomUUID();
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : null;
    const coverImageUrl = typeof body.coverImageUrl === "string" ? body.coverImageUrl.trim() : null;
    const primaryColor = typeof body.primaryColor === "string" ? body.primaryColor.trim() : "#1a1a2e";
    const secondaryColor = typeof body.secondaryColor === "string" ? body.secondaryColor.trim() : "#f5a623";
    const address = typeof body.address === "string" ? body.address.trim() : null;
    const city = typeof body.city === "string" ? body.city.trim() : null;
    const country = typeof body.country === "string" ? body.country.trim() : null;
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const email = typeof body.email === "string" ? body.email.trim() : null;
    const website = typeof body.website === "string" ? body.website.trim() : null;
    const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "Europe/Paris";
    const currency = typeof body.currency === "string" ? body.currency.trim() : "EUR";
    const starRating = typeof body.starRating === "number" ? body.starRating : null;
    const amenities = Array.isArray(body.amenities) ? body.amenities : [];

    await query(
      `
        INSERT INTO hotels (
          id, name, description, logo_url, cover_image_url,
          primary_color, secondary_color, address, city, country,
          phone, email, website, timezone, currency,
          star_rating, amenities, is_active
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, true
        )
      `,
      [
        hotelId, name, description, logoUrl, coverImageUrl,
        primaryColor, secondaryColor, address, city, country,
        phone, email, website, timezone, currency,
        starRating, amenities
      ]
    );

    // Create default integrations
    await query(
      `INSERT INTO hotel_integrations (hotel_id) VALUES ($1)`,
      [hotelId]
    );
    await query(
      `INSERT INTO hotel_notifications (hotel_id) VALUES ($1)`,
      [hotelId]
    );

    sendJson(res, 201, {
      hotel: {
        id: hotelId,
        name,
        description,
        logoUrl,
        coverImageUrl,
        primaryColor,
        secondaryColor,
        address,
        city,
        country,
        phone,
        email,
        website,
        timezone,
        currency,
        starRating,
        amenities,
        isActive: true
      }
    });
    return;
  }

  // GET /api/v1/admin/hotels/:hotelId - Get hotel details (platform admin)
  if (req.method === "GET" && url.pathname.match(/^\/api\/v1\/admin\/hotels\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["platform_admin"]);
    if (!principal) return;

    const hotelId = url.pathname.split("/").pop();

    const hotels = await query(
      `
        SELECT
          id,
          name,
          description,
          logo_url AS "logoUrl",
          cover_image_url AS "coverImageUrl",
          primary_color AS "primaryColor",
          secondary_color AS "secondaryColor",
          address,
          city,
          country,
          phone,
          email,
          website,
          timezone,
          currency,
          star_rating AS "starRating",
          amenities,
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM hotels
        WHERE id = $1
        LIMIT 1
      `,
      [hotelId]
    );

    if (hotels.length === 0) {
      sendJson(res, 404, { error: "hotel_not_found" });
      return;
    }

    sendJson(res, 200, { hotel: hotels[0] });
    return;
  }

  // PATCH /api/v1/admin/hotels/:hotelId - Update hotel (platform admin)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/admin\/hotels\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["platform_admin"]);
    if (!principal) return;

    const hotelId = url.pathname.split("/").pop();
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [hotelId];

    const fields = [
      ["name", "name"],
      ["description", "description"],
      ["logoUrl", "logo_url"],
      ["coverImageUrl", "cover_image_url"],
      ["primaryColor", "primary_color"],
      ["secondaryColor", "secondary_color"],
      ["address", "address"],
      ["city", "city"],
      ["country", "country"],
      ["phone", "phone"],
      ["email", "email"],
      ["website", "website"],
      ["timezone", "timezone"],
      ["currency", "currency"],
      ["starRating", "star_rating"],
      ["amenities", "amenities"],
      ["isActive", "is_active"]
    ];

    for (const [jsField, dbField] of fields) {
      if (body[jsField] !== undefined) {
        params.push(body[jsField]);
        updates.push(`${dbField} = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    params.push(new Date().toISOString());
    updates.push(`updated_at = $${params.length}`);

    await query(
      `UPDATE hotels SET ${updates.join(", ")} WHERE id = $1`,
      params
    );

    sendJson(res, 200, { success: true });
    return;
  }

  // =====================================================
  // PMS SYNC MONITORING (platform admin)
  // =====================================================

  // GET /api/v1/admin/hotels/:hotelId/pms-sync - PMS sync status + recent runs
  if (req.method === "GET" && url.pathname.match(/^\/api\/v1\/admin\/hotels\/[^/]+\/pms-sync$/)) {
    const principal = requirePrincipal(req, res, url, ["platform_admin"]);
    if (!principal) return;

    const hotelId = url.pathname.split("/")[5];

    const hotels = await query(`SELECT id, name FROM hotels WHERE id = $1 LIMIT 1`, [hotelId]);
    const hotel = hotels[0] ?? null;
    if (!hotel) {
      sendJson(res, 404, { error: "hotel_not_found" });
      return;
    }

    const latestRows = await query(
      `
        SELECT
          id,
          status,
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          summary,
          error_message AS "errorMessage",
          error_details AS "errorDetails"
        FROM pms_sync_runs
        WHERE hotel_id = $1
        ORDER BY started_at DESC
        LIMIT 1
      `,
      [hotelId]
    );

    const runs = await query(
      `
        SELECT
          id,
          status,
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          summary,
          error_message AS "errorMessage"
        FROM pms_sync_runs
        WHERE hotel_id = $1
        ORDER BY started_at DESC
        LIMIT 25
      `,
      [hotelId]
    );

    sendJson(res, 200, {
      hotel: { id: hotel.id, name: hotel.name },
      latest: latestRows[0] ?? null,
      runs
    });
    return;
  }

  // POST /api/v1/admin/hotels/:hotelId/pms-sync/run - Trigger a PMS sync job
  if (req.method === "POST" && url.pathname.match(/^\/api\/v1\/admin\/hotels\/[^/]+\/pms-sync\/run$/)) {
    const principal = requirePrincipal(req, res, url, ["platform_admin"]);
    if (!principal) return;

    const hotelId = url.pathname.split("/")[5];

    const hotels = await query(`SELECT id, name FROM hotels WHERE id = $1 LIMIT 1`, [hotelId]);
    const hotel = hotels[0] ?? null;
    if (!hotel) {
      sendJson(res, 404, { error: "hotel_not_found" });
      return;
    }

    const runId = `PS-${randomUUID().slice(0, 8).toUpperCase()}`;
    const startedAtIso = new Date().toISOString();

    await query(
      `
        INSERT INTO pms_sync_runs (id, hotel_id, status, started_at, summary)
        VALUES ($1, $2, 'running', NOW(), $3::jsonb)
      `,
      [runId, hotelId, JSON.stringify({ triggeredAt: startedAtIso, triggeredBy: principal.sub })]
    );

    let status = "ok";
    let errorMessage = null;
    let errorDetails = null;
    let summary = { triggeredAt: startedAtIso, triggeredBy: principal.sub };

    try {
      const integrations = await getHotelIntegrations(hotelId);
      const provider = integrations?.pms?.provider ?? null;
      const config = integrations?.pms?.config ?? {};

      if (!provider || provider === "none") {
        throw new Error("pms_not_configured");
      }

      if (!config?.baseUrl || !config?.resortId) {
        throw new Error("pms_missing_config");
      }

      const integrationManager = new IntegrationManager(integrations);
      const pms = integrationManager.getPMS();

      const connection = await pms.testConnection();
      if (!connection?.connected) {
        const reason = typeof connection?.error === "string" ? connection.error : "connection_failed";
        throw new Error(`pms_connection_failed:${reason}`);
      }

      const today = new Date().toISOString().slice(0, 10);

      const [arrivals, departures] = await Promise.all([
        pms.getArrivals(today),
        pms.getDepartures(today)
      ]);

      const reservationMap = new Map();
      for (const reservation of [...(arrivals ?? []), ...(departures ?? [])]) {
        const confirmationNumber =
          typeof reservation?.confirmationNumber === "string" ? reservation.confirmationNumber.trim() : "";
        if (!confirmationNumber) continue;
        reservationMap.set(confirmationNumber, reservation);
      }

      let processed = 0;
      let linkedGuests = 0;

      for (const reservation of reservationMap.values()) {
        const normalized = pms.normalizeReservation(reservation, provider);
        try {
          const stay = await upsertStayFromPmsReservation(hotelId, normalized);
          processed += 1;
          if (stay.guestId) linkedGuests += 1;
        } catch (error) {
          console.error("pms_sync_upsert_failed", error);
        }
      }

      summary = {
        ...summary,
        provider,
        resortId: config.resortId,
        baseUrl: config.baseUrl,
        connection,
        fetchedAt: new Date().toISOString(),
        fetched: { arrivals: Array.isArray(arrivals) ? arrivals.length : 0, departures: Array.isArray(departures) ? departures.length : 0 },
        upserted: { stays: processed, linkedGuests }
      };
    } catch (error) {
      status = "error";
      errorMessage = error instanceof Error ? error.message : "sync_failed";
      errorDetails = error instanceof Error ? error.stack ?? error.message : String(error);
      summary = { ...summary, error: errorMessage };
    }

    await query(
      `
        UPDATE pms_sync_runs
        SET status = $1, finished_at = NOW(), summary = $2::jsonb, error_message = $3, error_details = $4
        WHERE id = $5 AND hotel_id = $6
      `,
      [status, JSON.stringify(summary), errorMessage, errorDetails, runId, hotelId]
    );

    sendJson(res, 200, { ok: status === "ok", runId, status, summary, error: errorMessage });
    return;
  }

  // =====================================================
  // HOTEL STAFF MANAGEMENT ENDPOINTS
  // =====================================================

  // GET /api/v1/hotels/:hotelId/staff - List staff for a hotel
  if (req.method === "GET" && url.pathname.match(/^\/api\/v1\/hotels\/[^/]+\/staff$/)) {
    const principal = requirePrincipal(req, res, url, ["staff", "platform_admin"]);
    if (!principal) return;

    const hotelId = url.pathname.split("/")[4];

    // Staff can only see their own hotel's staff
    if (principal.typ === "staff" && principal.hotelId !== hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    // Only admin/manager can see staff list
    if (principal.typ === "staff" && !["admin", "manager"].includes(principal.role)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const staff = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          email,
          display_name AS "displayName",
          role,
          departments,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM staff_users
        WHERE hotel_id = $1
        ORDER BY display_name ASC, email ASC
      `,
      [hotelId]
    );

    sendJson(res, 200, { items: staff });
    return;
  }

  // POST /api/v1/hotels/:hotelId/staff - Create staff member
  if (req.method === "POST" && url.pathname.match(/^\/api\/v1\/hotels\/[^/]+\/staff$/)) {
    const principal = requirePrincipal(req, res, url, ["staff", "platform_admin"]);
    if (!principal) return;

    const hotelId = url.pathname.split("/")[4];

    // Staff can only create for their own hotel
    if (principal.typ === "staff" && principal.hotelId !== hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    // Only admin can create staff
    if (principal.typ === "staff" && principal.role !== "admin") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : null;
    const role = typeof body.role === "string" ? body.role.trim() : "staff";
    const departments = Array.isArray(body.departments) ? body.departments : [];

    if (!email || !password) {
      sendJson(res, 400, { error: "missing_fields", required: ["email", "password"] });
      return;
    }

    if (!["admin", "manager", "staff"].includes(role)) {
      sendJson(res, 400, { error: "invalid_role", allowed: ["admin", "manager", "staff"] });
      return;
    }

    // Check if email already exists
    const existing = await query(
      `SELECT id FROM staff_users WHERE email = $1`,
      [email]
    );

    if (existing.length > 0) {
      sendJson(res, 409, { error: "email_already_exists" });
      return;
    }

    const staffId = randomUUID();
    const passwordHash = await hashPassword(password);

    await query(
      `
        INSERT INTO staff_users (
          id, hotel_id, email, display_name, role, departments, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [staffId, hotelId, email, displayName, role, departments, passwordHash]
    );

    sendJson(res, 201, {
      staff: {
        id: staffId,
        hotelId,
        email,
        displayName,
        role,
        departments
      }
    });
    return;
  }

  // PATCH /api/v1/hotels/:hotelId/staff/:staffId - Update staff member
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/hotels\/[^/]+\/staff\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff", "platform_admin"]);
    if (!principal) return;

    const pathParts = url.pathname.split("/");
    const hotelId = pathParts[4];
    const staffId = pathParts[6];

    // Staff can only update their own hotel's staff
    if (principal.typ === "staff" && principal.hotelId !== hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    // Only admin can update staff
    if (principal.typ === "staff" && principal.role !== "admin") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [staffId, hotelId];

    if (typeof body.displayName === "string") {
      params.push(body.displayName.trim());
      updates.push(`display_name = $${params.length}`);
    }

    if (typeof body.role === "string") {
      const role = body.role.trim();
      if (!["admin", "manager", "staff"].includes(role)) {
        sendJson(res, 400, { error: "invalid_role", allowed: ["admin", "manager", "staff"] });
        return;
      }
      params.push(role);
      updates.push(`role = $${params.length}`);
    }

    if (Array.isArray(body.departments)) {
      params.push(body.departments);
      updates.push(`departments = $${params.length}`);
    }

    if (typeof body.password === "string" && body.password.length >= 6) {
      const passwordHash = await hashPassword(body.password);
      params.push(passwordHash);
      updates.push(`password_hash = $${params.length}`);
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    params.push(new Date().toISOString());
    updates.push(`updated_at = $${params.length}`);

    const result = await query(
      `UPDATE staff_users SET ${updates.join(", ")} WHERE id = $1 AND hotel_id = $2`,
      params
    );

    sendJson(res, 200, { success: true });
    return;
  }

  // DELETE /api/v1/hotels/:hotelId/staff/:staffId - Delete staff member
  if (req.method === "DELETE" && url.pathname.match(/^\/api\/v1\/hotels\/[^/]+\/staff\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff", "platform_admin"]);
    if (!principal) return;

    const pathParts = url.pathname.split("/");
    const hotelId = pathParts[4];
    const staffId = pathParts[6];

    // Staff can only delete from their own hotel
    if (principal.typ === "staff" && principal.hotelId !== hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    // Only admin can delete staff
    if (principal.typ === "staff" && principal.role !== "admin") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    // Cannot delete self
    if (principal.typ === "staff" && principal.sub === staffId) {
      sendJson(res, 400, { error: "cannot_delete_self" });
      return;
    }

    await query(
      `DELETE FROM staff_users WHERE id = $1 AND hotel_id = $2`,
      [staffId, hotelId]
    );

    sendJson(res, 200, { success: true });
    return;
  }

  // GET /api/v1/hotels/me/settings - Get current hotel settings (for hotel admin/manager)
  if (req.method === "GET" && url.pathname === "/api/v1/hotels/me/settings") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    if (!["admin", "manager"].includes(principal.role)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const hotels = await query(
      `
        SELECT
          id,
          name,
          description,
          logo_url AS "logoUrl",
          cover_image_url AS "coverImageUrl",
          primary_color AS "primaryColor",
          secondary_color AS "secondaryColor",
          address,
          city,
          country,
          phone,
          email,
          website,
          timezone,
          currency,
          star_rating AS "starRating",
          amenities,
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM hotels
        WHERE id = $1
        LIMIT 1
      `,
      [principal.hotelId]
    );

    if (hotels.length === 0) {
      sendJson(res, 404, { error: "hotel_not_found" });
      return;
    }

    sendJson(res, 200, { hotel: hotels[0] });
    return;
  }

  // PATCH /api/v1/hotels/me/settings - Update current hotel settings (for hotel admin)
  if (req.method === "PATCH" && url.pathname === "/api/v1/hotels/me/settings") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    if (principal.role !== "admin" && principal.role !== "manager") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [principal.hotelId];

    const fields = [
      ["name", "name"],
      ["description", "description"],
      ["logoUrl", "logo_url"],
      ["coverImageUrl", "cover_image_url"],
      ["primaryColor", "primary_color"],
      ["secondaryColor", "secondary_color"],
      ["address", "address"],
      ["city", "city"],
      ["country", "country"],
      ["phone", "phone"],
      ["email", "email"],
      ["website", "website"],
      ["timezone", "timezone"],
      ["currency", "currency"],
      ["starRating", "star_rating"],
      ["amenities", "amenities"]
    ];

    for (const [jsField, dbField] of fields) {
      if (body[jsField] !== undefined) {
        params.push(body[jsField]);
        updates.push(`${dbField} = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    params.push(new Date().toISOString());
    updates.push(`updated_at = $${params.length}`);

    await query(
      `UPDATE hotels SET ${updates.join(", ")} WHERE id = $1`,
      params
    );

    sendJson(res, 200, { success: true });
    return;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] === "api" && segments[1] === "v1" && segments[2] === "tickets" && segments[3]) {
    const ticketId = decodeURIComponent(segments[3]);

    if (req.method === "GET" && segments.length === 4) {
      const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
      if (!principal) return;

      const rows = await query(
        `
          SELECT
            t.id,
            t.hotel_id AS "hotelId",
            t.stay_id AS "stayId",
            t.room_number AS "roomNumber",
            t.department,
            t.status,
            t.title,
            t.assigned_staff_user_id AS "assignedStaffUserId",
            su.display_name AS "assignedStaffUserDisplayName",
            su.email AS "assignedStaffUserEmail",
            t.payload,
            t.created_at AS "createdAt",
            t.updated_at AS "updatedAt"
          FROM tickets t
          LEFT JOIN staff_users su ON su.id = t.assigned_staff_user_id
          WHERE t.id = $1
          LIMIT 1
        `,
        [ticketId]
      );

      const ticket = rows[0];
      if (!ticket) {
        sendJson(res, 404, { error: "ticket_not_found" });
        return;
      }

      if (ticket.hotelId !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (principal.typ === "guest" && ticket.stayId !== principal.stayId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (principal.typ === "staff" && !isDepartmentAllowed(principal, ticket.department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      const assignedStaffUserId = ticket.assignedStaffUserId ?? null;
      sendJson(res, 200, {
        ...ticket,
        assignedStaffUser: assignedStaffUserId
          ? {
              id: assignedStaffUserId,
              displayName: ticket.assignedStaffUserDisplayName ?? null,
              email: ticket.assignedStaffUserEmail ?? null
            }
          : null
      });
      return;
    }

    if (req.method === "PATCH" && segments.length === 4) {
      const principal = requirePrincipal(req, res, url, ["staff"]);
      if (!principal) return;
      if (!requireStaffRole(res, principal, ["staff", "admin", "manager"])) return;

      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const allowedStatuses = ["pending", "in_progress", "resolved"];
      const nextStatus = typeof body.status === "string" ? body.status.trim() : null;
      const assignedToProvided = Object.prototype.hasOwnProperty.call(body, "assignedTo");
      const rawAssignedTo = assignedToProvided ? body.assignedTo : undefined;

      if (nextStatus !== null && !allowedStatuses.includes(nextStatus)) {
        sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
        return;
      }

      if (nextStatus === null && !assignedToProvided) {
        sendJson(res, 400, { error: "missing_fields", required: ["status and/or assignedTo"] });
        return;
      }

      const scopeRows = await query(
        `
          SELECT
            hotel_id AS "hotelId",
            department,
            room_number AS "roomNumber",
            assigned_staff_user_id AS "assignedStaffUserId",
            status,
            title
          FROM tickets
          WHERE id = $1
          LIMIT 1
        `,
        [ticketId]
      );

      const scope = scopeRows[0];
      if (!scope) {
        sendJson(res, 404, { error: "ticket_not_found" });
        return;
      }

      if (scope.hotelId !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (!isDepartmentAllowed(principal, scope.department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      let nextAssignedStaffUserId = scope.assignedStaffUserId ?? null;
      if (assignedToProvided) {
        if (rawAssignedTo === null) {
          nextAssignedStaffUserId = null;
        } else if (typeof rawAssignedTo === "string") {
          const trimmed = rawAssignedTo.trim();
          if (!trimmed) nextAssignedStaffUserId = null;
	          else if (trimmed === "me") nextAssignedStaffUserId = principal.staffUserId;
	          else if (trimmed === principal.staffUserId) nextAssignedStaffUserId = principal.staffUserId;
	          else {
	            if (principal.role !== "admin" && principal.role !== "manager") {
	              sendJson(res, 403, { error: "forbidden" });
	              return;
	            }

            const exists = await query(
              `SELECT id FROM staff_users WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
              [trimmed, principal.hotelId]
            );
            if (!exists[0]) {
              sendJson(res, 400, { error: "invalid_assigned_to" });
              return;
            }
            nextAssignedStaffUserId = trimmed;
          }
        } else {
          sendJson(res, 400, { error: "invalid_assigned_to" });
          return;
        }
      }

	      if (assignedToProvided && principal.role !== "admin" && principal.role !== "manager") {
	        const currentAssignedStaffUserId = scope.assignedStaffUserId ?? null;
	        const isAssignSelf = nextAssignedStaffUserId === principal.staffUserId;
	        const isUnassign = nextAssignedStaffUserId === null;

        if (isAssignSelf && currentAssignedStaffUserId && currentAssignedStaffUserId !== principal.staffUserId) {
          sendJson(res, 403, { error: "already_assigned" });
          return;
        }

        if (isUnassign && currentAssignedStaffUserId && currentAssignedStaffUserId !== principal.staffUserId) {
          sendJson(res, 403, { error: "already_assigned" });
          return;
        }
      }

      const set = [];
      const params = [];
      if (nextStatus !== null) {
        params.push(nextStatus);
        set.push(`status = $${params.length}`);
      }
      if (assignedToProvided) {
        params.push(nextAssignedStaffUserId);
        set.push(`assigned_staff_user_id = $${params.length}`);
      }
      params.push(ticketId);

      const updatedRows = await query(
        `
          UPDATE tickets
          SET ${set.join(", ")}, updated_at = NOW()
          WHERE id = $${params.length}
          RETURNING
            id,
            hotel_id AS "hotelId",
            stay_id AS "stayId",
            room_number AS "roomNumber",
            department,
            status,
            title,
            assigned_staff_user_id AS "assignedStaffUserId",
            payload,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        params
      );

      const updated = updatedRows[0];
      try {
        await emitRealtimeEvent({
          type: "ticket_updated",
          hotelId: updated.hotelId,
          ticketId: updated.id,
          stayId: updated.stayId,
          roomNumber: updated.roomNumber,
          department: updated.department,
          status: updated.status,
          assignedStaffUserId: updated.assignedStaffUserId ?? null,
          updatedAt: updated.updatedAt
        });
      } catch (error) {
        console.error("realtime_emit_failed", error);
      }

      try {
        const statusChanged = nextStatus !== null && scope.status !== updated.status;
        const assignmentChanged =
          assignedToProvided && (scope.assignedStaffUserId ?? null) !== (updated.assignedStaffUserId ?? null);

        if (statusChanged || assignmentChanged) {
          const targetStaffUserIds = [];
          if (updated.assignedStaffUserId && (statusChanged || assignmentChanged)) {
            targetStaffUserIds.push(updated.assignedStaffUserId);
          }

          const recipients =
            targetStaffUserIds.length > 0
              ? await listStaffNotificationTargetsByIds({
                  hotelId: principal.hotelId,
                  staffUserIds: targetStaffUserIds
                })
              : await listStaffNotificationTargets({
                  hotelId: principal.hotelId,
                  department: updated.department
                });

          const filtered = recipients.filter((recipient) => recipient.id !== principal.staffUserId);
          const subject = `Ticket updated • ${updated.department} • ${updated.id}`;
          const bodyText = [
            "Ticket updated.",
            "",
            scope.title ? `Title: ${scope.title}` : `Ticket: ${updated.id}`,
            `Room: ${updated.roomNumber ?? scope.roomNumber ?? "—"}`,
            `Department: ${updated.department}`,
            statusChanged ? `Status: ${scope.status} → ${updated.status}` : `Status: ${updated.status}`,
            assignmentChanged
              ? `Assignee: ${(scope.assignedStaffUserId ?? "unassigned") || "unassigned"} → ${(updated.assignedStaffUserId ?? "unassigned") || "unassigned"}`
              : `Assignee: ${updated.assignedStaffUserId ?? "unassigned"}`
          ].join("\n");

          for (const recipient of filtered) {
            await enqueueEmailOutbox({
              hotelId: principal.hotelId,
              toAddress: recipient.email,
              subject,
              bodyText,
              payload: {
                type: "ticket_updated",
                ticketId: updated.id,
                department: updated.department,
                status: updated.status
              }
            });
          }
        }
      } catch (error) {
        console.error("notification_enqueue_failed", error);
      }

      // When a restaurant booking ticket is resolved, send confirmation to guest and update event
      try {
        const ticketPayload = typeof updated.payload === "object" ? updated.payload : {};
        const statusChangedForConfirm = nextStatus !== null && scope.status !== updated.status;
        if (
          statusChangedForConfirm &&
          updated.status === "resolved" &&
          ticketPayload.type === "restaurant_booking" &&
          updated.stayId
        ) {
          const restaurantName = ticketPayload.restaurantName || "the restaurant";
          const date = ticketPayload.date || "";
          const time = ticketPayload.time || "";
          const guests = ticketPayload.guests || "";

          // Find the guest thread for restaurants
          const threadRows = await query(
            `SELECT id FROM threads WHERE stay_id = $1 AND department = 'restaurants' LIMIT 1`,
            [updated.stayId]
          );
          const threadId = threadRows[0]?.id;

          if (threadId) {
            const confirmMsg = `Your reservation at ${restaurantName} on ${date} at ${time} for ${guests} guest${guests > 1 ? "s" : ""} has been confirmed. We look forward to welcoming you!`;
            const msgId = `M-${randomUUID().slice(0, 8).toUpperCase()}`;

            await query(
              `INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
               VALUES ($1, $2, 'staff', $3, $4, $5::jsonb, NOW())`,
              [
                msgId,
                threadId,
                principal.displayName || "Restaurant",
                confirmMsg,
                JSON.stringify({ type: "restaurant_booking_confirmed", ticketId: updated.id })
              ]
            );

            await query(
              `UPDATE threads SET updated_at = NOW() WHERE id = $1`,
              [threadId]
            );

            try {
              await emitRealtimeEvent({
                type: "message_created",
                hotelId: updated.hotelId,
                threadId,
                stayId: updated.stayId,
                messageId: msgId,
                department: "restaurants"
              });
            } catch { /* non-critical */ }
          }

          // Update event status from pending to confirmed
          if (ticketPayload.eventId) {
            await query(
              `UPDATE events SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
              [ticketPayload.eventId]
            );
          }
          // Always also try the metadata-based lookup as fallback
          await query(
            `UPDATE events SET status = 'confirmed', updated_at = NOW()
             WHERE stay_id = $1 AND type = 'restaurant' AND status = 'pending'
             AND metadata->>'ticketId' = $2`,
            [updated.stayId, updated.id]
          );
        }
      } catch (error) {
        console.error("restaurant_confirmation_failed", error);
      }

      sendJson(res, 200, updated);
      return;
    }

    if (segments[4] === "notes" && segments.length === 5) {
      const principal = requirePrincipal(req, res, url, ["staff"]);
      if (!principal) return;
      if (!requireStaffRole(res, principal, ["staff", "admin"])) return;

      const scopeRows = await query(
        `
          SELECT
            hotel_id AS "hotelId",
            department,
            assigned_staff_user_id AS "assignedStaffUserId"
          FROM tickets
          WHERE id = $1
          LIMIT 1
        `,
        [ticketId]
      );

      const scope = scopeRows[0];
      if (!scope) {
        sendJson(res, 404, { error: "ticket_not_found" });
        return;
      }
      if (scope.hotelId !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }
      if (!isDepartmentAllowed(principal, scope.department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (req.method === "GET") {
        const items = await query(
          `
            SELECT
              id,
              hotel_id AS "hotelId",
              target_type AS "targetType",
              target_id AS "targetId",
              department,
              author_staff_user_id AS "authorStaffUserId",
              author_name AS "authorName",
              body_text AS "bodyText",
              created_at AS "createdAt"
            FROM internal_notes
            WHERE hotel_id = $1 AND target_type = 'ticket' AND target_id = $2
            ORDER BY created_at DESC
            LIMIT 100
          `,
          [principal.hotelId, ticketId]
        );

        sendJson(res, 200, { items });
        return;
      }

      if (req.method === "POST") {
        const body = await readJson(req);
        if (!body || typeof body !== "object") {
          sendJson(res, 400, { error: "invalid_json" });
          return;
        }

        const bodyText = typeof body.bodyText === "string" ? body.bodyText.trim() : "";
        if (!bodyText) {
          sendJson(res, 400, { error: "missing_fields", required: ["bodyText"] });
          return;
        }

        const authorName = principal.displayName ?? principal.email ?? "Staff";
        const id = `IN-${randomUUID().slice(0, 8).toUpperCase()}`;
        const rows = await query(
          `
            INSERT INTO internal_notes (
              id,
              hotel_id,
              target_type,
              target_id,
              department,
              author_staff_user_id,
              author_name,
              body_text,
              created_at
            )
            VALUES ($1, $2, 'ticket', $3, $4, $5, $6, $7, NOW())
            RETURNING
              id,
              hotel_id AS "hotelId",
              target_type AS "targetType",
              target_id AS "targetId",
              department,
              author_staff_user_id AS "authorStaffUserId",
              author_name AS "authorName",
              body_text AS "bodyText",
              created_at AS "createdAt"
          `,
          [id, principal.hotelId, ticketId, scope.department, principal.staffUserId, authorName, bodyText]
        );

        const note = rows[0];
        try {
          await emitRealtimeEvent({
            type: "ticket_note_created",
            hotelId: principal.hotelId,
            ticketId,
            department: scope.department,
            noteId: note.id
          });
        } catch (error) {
          console.error("realtime_emit_failed", error);
        }

        try {
          if (scope.assignedStaffUserId && scope.assignedStaffUserId !== principal.staffUserId) {
            const recipients = await listStaffNotificationTargetsByIds({
              hotelId: principal.hotelId,
              staffUserIds: [scope.assignedStaffUserId]
            });
            for (const recipient of recipients) {
              await enqueueEmailOutbox({
                hotelId: principal.hotelId,
                toAddress: recipient.email,
                subject: `Internal note • Ticket ${ticketId}`,
                bodyText: `A new internal note was added.\n\nTicket: ${ticketId}\nDepartment: ${scope.department}\n\n${bodyText}`,
                payload: { type: "ticket_note_created", ticketId, department: scope.department }
              });
            }
          }
        } catch (error) {
          console.error("notification_enqueue_failed", error);
        }

        sendJson(res, 201, note);
        return;
      }
    }

    sendJson(res, 404, { error: "not_found" });
    return;
  }

  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] !== "room-images" &&
    segments[4] !== "experiences" &&
    segments[4] !== "guest-content" &&
    segments[4] !== "useful-informations" &&
    segments[4] !== "cleaning"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const hotel = await getHotelById(hotelId);
    if (!hotel) {
      sendJson(res, 404, { error: "hotel_not_found" });
      return;
    }

    if (req.method === "GET" && segments.length === 4) {
      sendJson(res, 200, hotel);
      return;
    }

    if (segments[4] === "integrations") {
      if (!requireStaffRole(res, principal, ["admin", "manager"])) return;
      if (req.method === "GET" && segments.length === 5) {
        const integrations = await getHotelIntegrations(hotelId);
        sendJson(res, 200, integrations);
        return;
      }

      if (req.method === "PATCH" && segments.length === 6) {
        const kind = segments[5];
        const body = await readJson(req);
        if (!body || typeof body !== "object") {
          sendJson(res, 400, { error: "invalid_json" });
          return;
        }

        const provider = typeof body.provider === "string" ? body.provider.trim() : undefined;
        const payload = {
          hotelId,
          provider: provider ? provider : undefined,
          config: body.config,
          configPatch: body.configPatch
        };

        try {
          if (kind === "pms") {
            const result = await updateHotelPmsIntegration(payload);
            sendJson(res, 200, result);
            return;
          }
          if (kind === "digital-key") {
            const result = await updateHotelDigitalKeyIntegration(payload);
            sendJson(res, 200, result);
            return;
          }
          if (kind === "spa") {
            const result = await updateHotelSpaIntegration(payload);
            sendJson(res, 200, result);
            return;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (
            message === "invalid_pms_provider" ||
            message === "invalid_pms_config" ||
            message === "invalid_digital_key_provider" ||
            message === "invalid_digital_key_config" ||
            message === "invalid_spa_provider" ||
            message === "invalid_spa_config"
          ) {
            sendJson(res, 400, { error: message });
            return;
          }
          throw error;
        }
      }
    }

    if (segments[4] === "notifications") {
      if (!requireStaffRole(res, principal, ["admin", "manager"])) return;
      if (req.method === "GET" && segments.length === 5) {
        const notifications = await getHotelNotifications(hotelId);
        sendJson(res, 200, notifications);
        return;
      }

      if (req.method === "POST" && segments.length === 6 && segments[5] === "test") {
        const body = await readJson(req);
        if (!body || typeof body !== "object") {
          sendJson(res, 400, { error: "invalid_json" });
          return;
        }

        const channel = typeof body.channel === "string" ? body.channel.trim() : "";
        const toAddress = typeof body.toAddress === "string" ? body.toAddress.trim() : "";
        const subject = typeof body.subject === "string" ? body.subject.trim() : "";
        const bodyText = typeof body.bodyText === "string" ? body.bodyText.trim() : "";
        const payloadJson = body.payload ? JSON.stringify(body.payload) : "{}";

        if (!channel || !toAddress || !bodyText) {
          sendJson(res, 400, { error: "missing_fields", required: ["channel", "toAddress", "bodyText"] });
          return;
        }

        if (channel !== "email" && channel !== "sms" && channel !== "push") {
          sendJson(res, 400, { error: "invalid_channel" });
          return;
        }

        const settings = await getHotelNotifications(hotelId);
        const provider = settings[channel].provider;
        if (!provider || provider === "none") {
          sendJson(res, 400, { error: "notifications_disabled" });
          return;
        }

        const id = `IN-${randomUUID().slice(0, 8).toUpperCase()}`;
        const rows = await query(
          `
            INSERT INTO notification_outbox (
              id,
              hotel_id,
              channel,
              provider,
              to_address,
              subject,
              body_text,
              payload,
              status,
              attempts,
              next_attempt_at,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'pending', 0, NOW(), NOW(), NOW())
            RETURNING
              id,
              hotel_id AS "hotelId",
              channel,
              provider,
              to_address AS "toAddress",
              status,
              created_at AS "createdAt"
          `,
          [id, hotelId, channel, provider, toAddress, subject || null, bodyText, payloadJson]
        );

        sendJson(res, 201, rows[0]);
        return;
      }

      if (req.method === "PATCH" && segments.length === 6) {
        const channel = segments[5];
        const body = await readJson(req);
        if (!body || typeof body !== "object") {
          sendJson(res, 400, { error: "invalid_json" });
          return;
        }

        const provider = typeof body.provider === "string" ? body.provider.trim() : undefined;
        const payload = {
          hotelId,
          provider: provider ? provider : undefined,
          config: body.config,
          configPatch: body.configPatch
        };

        try {
          if (channel === "email") {
            const result = await updateHotelEmailNotifications(payload);
            sendJson(res, 200, result);
            return;
          }
          if (channel === "sms") {
            const result = await updateHotelSmsNotifications(payload);
            sendJson(res, 200, result);
            return;
          }
          if (channel === "push") {
            const result = await updateHotelPushNotifications(payload);
            sendJson(res, 200, result);
            return;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (
            message === "invalid_email_provider" ||
            message === "invalid_email_config" ||
            message === "invalid_sms_provider" ||
            message === "invalid_sms_config" ||
            message === "invalid_push_provider" ||
            message === "invalid_push_config"
          ) {
            sendJson(res, 400, { error: message });
            return;
          }
          throw error;
        }

        sendJson(res, 404, { error: "not_found" });
        return;
      }
    }
  }

  if (req.method === "GET" && url.pathname === "/api/v1/stays/lookup") {
    const confirmation = url.searchParams.get("confirmation");
    if (!confirmation) {
      sendJson(res, 400, { error: "missing_confirmation" });
      return;
    }

    const trimmedConfirmation = confirmation.trim();
    const stayRows = await query(
      `
        SELECT
          s.id AS stay_id,
          s.confirmation_number,
          s.room_number,
          s.check_in,
          s.check_out,
          s.adults,
          s.children,
          h.id AS hotel_id,
          h.name AS hotel_name
        FROM stays s
        JOIN hotels h ON h.id = s.hotel_id
        WHERE s.confirmation_number = $1
        LIMIT 1
      `,
      [trimmedConfirmation]
    );

    let stayRow = stayRows[0] ?? null;

    const requestedHotelId = url.searchParams.get("hotelId");
    const trimmedHotelId = typeof requestedHotelId === "string" ? requestedHotelId.trim() : "";

    let hotelId = stayRow?.hotel_id ?? trimmedHotelId;
    if (!hotelId) {
      const hotels = await query(`SELECT id FROM hotels ORDER BY name ASC LIMIT 2`);
      if (hotels.length === 1 && typeof hotels[0]?.id === "string" && hotels[0].id.trim()) {
        hotelId = hotels[0].id.trim();
      } else {
        sendJson(res, 400, { error: "missing_hotelId" });
        return;
      }
    }

    const hotel = stayRow ? { id: stayRow.hotel_id, name: stayRow.hotel_name } : await getHotelById(hotelId);
    if (!hotel) {
      sendJson(res, 404, { error: "hotel_not_found" });
      return;
    }

    const integrations = await getHotelIntegrations(hotelId);
    const integrationManager = new IntegrationManager(integrations);

    let reservation = null;
    try {
      reservation = await integrationManager.getPMS().getReservation(trimmedConfirmation);
    } catch (error) {
      console.error("pms_lookup_failed", error);
      if (!stayRow) {
        sendJson(res, 503, { error: "pms_unavailable" });
        return;
      }
    }

    const checkIn = typeof reservation?.checkInDate === "string" ? reservation.checkInDate.trim() : "";
    const checkOut = typeof reservation?.checkOutDate === "string" ? reservation.checkOutDate.trim() : "";

    if (reservation && checkIn && checkOut) {
      try {
        await upsertStayFromPmsReservation(hotelId, reservation);
      } catch (error) {
        console.error("stay_upsert_failed", error);
        if (!stayRow) {
          sendJson(res, 502, { error: "pms_sync_failed" });
          return;
        }
      }

      const refreshed = await query(
        `
          SELECT
            s.id AS stay_id,
            s.confirmation_number,
            s.room_number,
            s.check_in,
            s.check_out,
            s.adults,
            s.children,
            h.id AS hotel_id,
            h.name AS hotel_name
          FROM stays s
          JOIN hotels h ON h.id = s.hotel_id
          WHERE s.confirmation_number = $1
          LIMIT 1
        `,
        [trimmedConfirmation]
      );
      stayRow = refreshed[0] ?? stayRow;
    }

    if (!stayRow) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    const token = signToken(
      { typ: "guest", hotelId: stayRow.hotel_id, stayId: stayRow.stay_id },
      { expiresInSeconds: 60 * 60 * 24 * 7 }
    );

    sendJson(res, 200, {
      token,
      hotel: { id: stayRow.hotel_id, name: stayRow.hotel_name },
      stay: {
        id: stayRow.stay_id,
        confirmationNumber: stayRow.confirmation_number,
        roomNumber: stayRow.room_number,
        checkIn: stayRow.check_in,
        checkOut: stayRow.check_out,
        guests: { adults: stayRow.adults, children: stayRow.children }
      }
    });
    return;
  }

  // =====================================================
  // GUEST: STAY OVERVIEW, CHECK-IN, CHECK-OUT (AeroGuest-inspired)
  // =====================================================

  // GET /api/v1/guest/overview - Fetch hotel + stay snapshot for the guest
  if (req.method === "GET" && url.pathname === "/api/v1/guest/overview") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    if (!principal.hotelId || !principal.stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    const stayRows = await query(
      `
        SELECT
          s.id AS "stayId",
          s.hotel_id AS "hotelId",
          s.guest_id AS "guestId",
          s.confirmation_number AS "confirmationNumber",
          s.room_number AS "roomNumber",
          s.check_in AS "checkIn",
          s.check_out AS "checkOut",
          s.adults,
          s.children,
          s.pms_reservation_id AS "pmsReservationId",
          s.pms_status AS "pmsStatus",
          s.guest_first_name AS "stayGuestFirstName",
          s.guest_last_name AS "stayGuestLastName",
          s.guest_email AS "stayGuestEmail",
          s.guest_phone AS "stayGuestPhone",
          h.name AS "hotelName",
          h.logo_url AS "logoUrl",
          h.cover_image_url AS "coverImageUrl",
          h.primary_color AS "primaryColor",
          h.secondary_color AS "secondaryColor",
          h.city,
          h.country,
          h.currency
        FROM stays s
        JOIN hotels h ON h.id = s.hotel_id
        WHERE s.id = $1 AND s.hotel_id = $2
        LIMIT 1
      `,
      [principal.stayId, principal.hotelId]
    );

    const stay = stayRows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    const guestId = typeof stay.guestId === "string" && stay.guestId.trim() ? stay.guestId.trim() : null;
    const guestRows = guestId
      ? await query(
          `
            SELECT
              id,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              phone,
              email_verified AS "emailVerified",
              id_document_verified AS "idDocumentVerified",
              payment_method_id AS "paymentMethodId"
            FROM guests
            WHERE id = $1
            LIMIT 1
          `,
          [guestId]
        )
      : [];

    const guest = guestRows[0]
      ? {
          id: guestRows[0].id,
          firstName: guestRows[0].firstName,
          lastName: guestRows[0].lastName,
          email: guestRows[0].email,
          phone: guestRows[0].phone,
          emailVerified: guestRows[0].emailVerified,
          idDocumentVerified: guestRows[0].idDocumentVerified,
          hasPaymentMethod: !!guestRows[0].paymentMethodId
        }
      : {
          id: null,
          firstName: stay.stayGuestFirstName,
          lastName: stay.stayGuestLastName,
          email: stay.stayGuestEmail,
          phone: stay.stayGuestPhone,
          emailVerified: null,
          idDocumentVerified: null,
          hasPaymentMethod: null
        };

    sendJson(res, 200, {
      hotel: {
        id: stay.hotelId,
        name: stay.hotelName,
        logoUrl: stay.logoUrl,
        coverImageUrl: stay.coverImageUrl,
        primaryColor: stay.primaryColor,
        secondaryColor: stay.secondaryColor,
        city: stay.city,
        country: stay.country,
        currency: stay.currency
      },
      stay: {
        id: stay.stayId,
        confirmationNumber: stay.confirmationNumber,
        roomNumber: stay.roomNumber,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: { adults: stay.adults, children: stay.children },
        pmsReservationId: stay.pmsReservationId,
        pmsStatus: stay.pmsStatus
      },
      guest
    });
    return;
  }

  // GET/PATCH /api/v1/guest/profile - Fetch/update guest profile settings
  if (url.pathname === "/api/v1/guest/profile") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    const guestIdFromToken =
      typeof principal.guestId === "string" && principal.guestId.trim() ? principal.guestId.trim() : null;

    let resolvedGuestId = guestIdFromToken;
    if (!resolvedGuestId && principal.hotelId && principal.stayId) {
      const stayRows = await query(
        `
          SELECT guest_id AS "guestId"
          FROM stays
          WHERE id = $1 AND hotel_id = $2
          LIMIT 1
        `,
        [principal.stayId, principal.hotelId]
      );
      resolvedGuestId =
        typeof stayRows[0]?.guestId === "string" && stayRows[0].guestId.trim()
          ? stayRows[0].guestId.trim()
          : null;
    }

    if (!resolvedGuestId) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    if (req.method === "GET") {
      const profileRows = await query(
        `
          SELECT
            g.id,
            g.first_name AS "firstName",
            g.last_name AS "lastName",
            g.email,
            g.phone,
            g.email_verified AS "emailVerified",
            g.id_document_verified AS "idDocumentVerified",
            g.payment_method_id AS "paymentMethodId",
            g.updated_at AS "updatedAt",
            s.room_number AS "roomNumber",
            s.confirmation_number AS "confirmationNumber",
            h.currency AS currency
          FROM guests g
          LEFT JOIN stays s
            ON s.id = $2
            AND ($3::text IS NULL OR s.hotel_id = $3)
          LEFT JOIN hotels h
            ON h.id = COALESCE($3, s.hotel_id)
          WHERE g.id = $1
          LIMIT 1
        `,
        [resolvedGuestId, principal.stayId ?? null, principal.hotelId ?? null]
      );

      const row = profileRows[0] ?? null;
      if (!row) {
        sendJson(res, 404, { error: "guest_not_found" });
        return;
      }

      sendJson(res, 200, {
        guest: {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          emailVerified: Boolean(row.emailVerified),
          idDocumentVerified: Boolean(row.idDocumentVerified),
          hasPaymentMethod: Boolean(row.paymentMethodId),
          updatedAt: row.updatedAt
        },
        stay: {
          roomNumber: row.roomNumber ?? null,
          confirmationNumber: row.confirmationNumber ?? null
        },
        hotel: {
          currency: row.currency ?? "EUR"
        }
      });
      return;
    }

    if (req.method === "PATCH") {
      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const updates = [];
      const params = [];

      if (Object.prototype.hasOwnProperty.call(body, "firstName")) {
        const firstName = normalizeText(body.firstName);
        if (!firstName) {
          sendJson(res, 400, { error: "invalid_first_name" });
          return;
        }
        params.push(firstName);
        updates.push(`first_name = $${params.length}`);
      }

      if (Object.prototype.hasOwnProperty.call(body, "lastName")) {
        const lastName = normalizeText(body.lastName);
        if (!lastName) {
          sendJson(res, 400, { error: "invalid_last_name" });
          return;
        }
        params.push(lastName);
        updates.push(`last_name = $${params.length}`);
      }

      if (Object.prototype.hasOwnProperty.call(body, "email")) {
        const email = normalizeEmail(body.email);
        const validEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!validEmail) {
          sendJson(res, 400, { error: "invalid_email" });
          return;
        }
        params.push(email);
        updates.push(`email = $${params.length}`);
      }

      if (Object.prototype.hasOwnProperty.call(body, "phone")) {
        const phone = normalizeText(body.phone);
        params.push(phone);
        updates.push(`phone = $${params.length}`);
      }

      if (!updates.length) {
        sendJson(res, 400, { error: "no_changes" });
        return;
      }

      params.push(resolvedGuestId);
      const guestIdParam = params.length;

      try {
        const rows = await query(
          `
            UPDATE guests
            SET
              ${updates.join(",\n              ")},
              updated_at = NOW()
            WHERE id = $${guestIdParam}
            RETURNING
              id,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              phone,
              email_verified AS "emailVerified",
              id_document_verified AS "idDocumentVerified",
              payment_method_id AS "paymentMethodId",
              updated_at AS "updatedAt"
          `,
          params
        );

        const row = rows[0] ?? null;
        if (!row) {
          sendJson(res, 404, { error: "guest_not_found" });
          return;
        }

        sendJson(res, 200, {
          guest: {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            emailVerified: Boolean(row.emailVerified),
            idDocumentVerified: Boolean(row.idDocumentVerified),
            hasPaymentMethod: Boolean(row.paymentMethodId),
            updatedAt: row.updatedAt
          }
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "23505") {
          sendJson(res, 409, { error: "email_already_exists" });
          return;
        }
        throw error;
      }
      return;
    }
  }

  // GET /api/v1/guest/unread - Unread counters for guest messaging
  if (req.method === "GET" && url.pathname === "/api/v1/guest/unread") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    if (!principal.hotelId || !principal.stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    const rows = await query(
      `
        SELECT COUNT(*)::int AS count
        FROM threads t
        LEFT JOIN LATERAL (
          SELECT MAX(created_at) AS last_staff_message_at
          FROM messages m
          WHERE m.thread_id = t.id AND m.sender_type = 'staff'
        ) lm ON true
        WHERE t.hotel_id = $1
          AND t.stay_id = $2
          AND t.status <> 'archived'
          AND lm.last_staff_message_at IS NOT NULL
          AND (t.guest_last_read_at IS NULL OR lm.last_staff_message_at > t.guest_last_read_at)
      `,
      [principal.hotelId, principal.stayId]
    );

    const unreadThreads = typeof rows[0]?.count === "number" ? rows[0].count : 0;
    sendJson(res, 200, { unreadThreads });
    return;
  }

  // POST /api/v1/guest/check-in - Update guest profile + trigger PMS check-in
  if (req.method === "POST" && url.pathname === "/api/v1/guest/check-in") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    if (!principal.hotelId || !principal.stayId) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
    const phone = phoneRaw ? phoneRaw.replace(/[^\d+]/g, "") : null;
    const roomNumber = typeof body.roomNumber === "string" ? body.roomNumber.trim() : null;

    const idDocumentUploaded = Boolean(body.idDocumentUploaded);
    const paymentMethodProvided = Boolean(body.paymentMethodProvided);

    if (!idDocumentUploaded) {
      sendJson(res, 400, { error: "missing_id_document" });
      return;
    }

    if (!paymentMethodProvided) {
      sendJson(res, 400, { error: "missing_payment_method" });
      return;
    }

    const stayRows = await query(
      `
        SELECT
          id AS "stayId",
          confirmation_number AS "confirmationNumber",
          pms_reservation_id AS "pmsReservationId",
          guest_id AS "guestId"
        FROM stays
        WHERE id = $1 AND hotel_id = $2
        LIMIT 1
      `,
      [principal.stayId, principal.hotelId]
    );

    const stay = stayRows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    const integrations = await getHotelIntegrations(principal.hotelId);
    const integrationManager = new IntegrationManager(integrations);
    const pms = integrationManager.getPMS();

    let pmsReservationId = normalizeText(stay.pmsReservationId);
    if (!pmsReservationId) {
      try {
        const reservation = await pms.getReservation(stay.confirmationNumber);
        if (!reservation) {
          sendJson(res, 404, { error: "reservation_not_found" });
          return;
        }
        await upsertStayFromPmsReservation(principal.hotelId, reservation);
        pmsReservationId = normalizeText(reservation.id);
      } catch (error) {
        console.error("pms_lookup_failed", error);
        sendJson(res, 502, { error: "pms_unavailable" });
        return;
      }
    }

    let checkinResult;
    try {
      checkinResult = await pms.checkIn(pmsReservationId, roomNumber ? { roomNumber } : {});
    } catch (error) {
      console.error("pms_checkin_failed", error);
      sendJson(res, 502, { error: "pms_checkin_failed" });
      return;
    }

    try {
      const normalized = pms.normalizeReservation(checkinResult?.reservation ?? {}, pms.provider);
      await upsertStayFromPmsReservation(principal.hotelId, normalized);
    } catch (error) {
      console.error("stay_upsert_failed", error);
    }

    const paymentMethodId = paymentMethodProvided ? `pm_demo_${randomUUID().replace(/-/g, "").slice(0, 12)}` : null;
    const resolvedGuestId = principal.guestId || stay.guestId;

    if (resolvedGuestId) {
      await query(
        `
          UPDATE guests
          SET
            first_name = CASE WHEN $1 <> '' THEN $1 ELSE first_name END,
            last_name = CASE WHEN $2 <> '' THEN $2 ELSE last_name END,
            phone = COALESCE($3, phone),
            id_document_url = CASE WHEN $4::boolean THEN COALESCE(id_document_url, 'demo://id-document') ELSE id_document_url END,
            id_document_verified = CASE WHEN $4::boolean THEN true ELSE id_document_verified END,
            payment_method_id = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE payment_method_id END,
            payment_provider = CASE WHEN $5::text IS NOT NULL THEN 'demo' ELSE payment_provider END,
            updated_at = NOW()
          WHERE id = $6
        `,
        [firstName, lastName, phone, idDocumentUploaded, paymentMethodId, resolvedGuestId]
      );
    }

    sendJson(res, 200, {
      ok: true,
      digitalKey: checkinResult?.digitalKey ?? null
    });
    return;
  }

  // GET /api/v1/guest/checkout - Preview checkout folio + totals
  if (req.method === "GET" && url.pathname === "/api/v1/guest/checkout") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    if (!principal.hotelId || !principal.stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    const stayRows = await query(
      `
        SELECT
          id AS "stayId",
          confirmation_number AS "confirmationNumber",
          room_number AS "roomNumber",
          check_in AS "checkIn",
          check_out AS "checkOut",
          pms_reservation_id AS "pmsReservationId"
        FROM stays
        WHERE id = $1 AND hotel_id = $2
        LIMIT 1
      `,
      [principal.stayId, principal.hotelId]
    );

    const stay = stayRows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    const integrations = await getHotelIntegrations(principal.hotelId);
    const integrationManager = new IntegrationManager(integrations);
    const pms = integrationManager.getPMS();

    let pmsReservationId = normalizeText(stay.pmsReservationId);
    if (!pmsReservationId) {
      try {
        const reservation = await pms.getReservation(stay.confirmationNumber);
        if (!reservation) {
          sendJson(res, 404, { error: "reservation_not_found" });
          return;
        }
        await upsertStayFromPmsReservation(principal.hotelId, reservation);
        pmsReservationId = normalizeText(reservation.id);
      } catch (error) {
        console.error("pms_lookup_failed", error);
        sendJson(res, 502, { error: "pms_unavailable" });
        return;
      }
    }

    let folio;
    try {
      folio = await pms.getFolio(pmsReservationId);
    } catch (error) {
      console.error("pms_folio_failed", error);
      sendJson(res, 502, { error: "pms_unavailable" });
      return;
    }

    const charges = Array.isArray(folio?.charges) ? folio.charges : [];
    const payments = Array.isArray(folio?.payments) ? folio.payments : [];

    sendJson(res, 200, {
      stay: {
        id: stay.stayId,
        confirmationNumber: stay.confirmationNumber,
        roomNumber: stay.roomNumber,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut
      },
      folio: {
        reservationId: folio?.reservationId ?? null,
        currency: typeof folio?.currency === "string" ? folio.currency : "EUR",
        balanceCents: toAmountCents(Number(folio?.balance ?? 0)),
        charges: charges.map((charge) => ({
          id: charge.id,
          date: charge.date,
          description: charge.description,
          category: charge.category ?? null,
          amountCents: toAmountCents(Number(charge.amount ?? 0))
        })),
        payments: payments.map((payment) => ({
          id: payment.id,
          date: payment.date,
          description: payment.description,
          method: payment.method ?? null,
          amountCents: toAmountCents(Number(payment.amount ?? 0))
        }))
      }
    });
    return;
  }

  // POST /api/v1/guest/checkout/confirm - Pay (demo) + trigger PMS checkout + create invoice
  if (req.method === "POST" && url.pathname === "/api/v1/guest/checkout/confirm") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    if (!principal.hotelId || !principal.stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const tipPercent = typeof body.tipPercent === "number" && Number.isFinite(body.tipPercent) ? body.tipPercent : null;
    const tipAmountCents =
      typeof body.tipAmountCents === "number" && Number.isFinite(body.tipAmountCents) ? Math.floor(body.tipAmountCents) : null;

    if (tipPercent !== null && (tipPercent < 0 || tipPercent > 50)) {
      sendJson(res, 400, { error: "invalid_tip_percent" });
      return;
    }

    if (tipAmountCents !== null && tipAmountCents < 0) {
      sendJson(res, 400, { error: "invalid_tip_amount" });
      return;
    }

    const stayRows = await query(
      `
        SELECT
          id AS "stayId",
          confirmation_number AS "confirmationNumber",
          pms_reservation_id AS "pmsReservationId"
        FROM stays
        WHERE id = $1 AND hotel_id = $2
        LIMIT 1
      `,
      [principal.stayId, principal.hotelId]
    );

    const stay = stayRows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    const integrations = await getHotelIntegrations(principal.hotelId);
    const integrationManager = new IntegrationManager(integrations);
    const pms = integrationManager.getPMS();

    let pmsReservationId = normalizeText(stay.pmsReservationId);
    if (!pmsReservationId) {
      try {
        const reservation = await pms.getReservation(stay.confirmationNumber);
        if (!reservation) {
          sendJson(res, 404, { error: "reservation_not_found" });
          return;
        }
        await upsertStayFromPmsReservation(principal.hotelId, reservation);
        pmsReservationId = normalizeText(reservation.id);
      } catch (error) {
        console.error("pms_lookup_failed", error);
        sendJson(res, 502, { error: "pms_unavailable" });
        return;
      }
    }

    let folio;
    try {
      folio = await pms.getFolio(pmsReservationId);
    } catch (error) {
      console.error("pms_folio_failed", error);
      sendJson(res, 502, { error: "pms_unavailable" });
      return;
    }

    const balanceCents = toAmountCents(Number(folio?.balance ?? 0));
    const computedTipCents =
      tipAmountCents !== null
        ? tipAmountCents
        : tipPercent !== null
          ? Math.round((balanceCents * tipPercent) / 100)
          : 0;

    const totalCents = balanceCents + computedTipCents;
    const currency = typeof folio?.currency === "string" ? folio.currency : "EUR";

    let checkoutResult;
    try {
      checkoutResult = await pms.checkOut(pmsReservationId);
    } catch (error) {
      console.error("pms_checkout_failed", error);
      sendJson(res, 502, { error: "pms_checkout_failed" });
      return;
    }

    try {
      const normalized = pms.normalizeReservation(checkoutResult?.reservation ?? {}, pms.provider);
      await upsertStayFromPmsReservation(principal.hotelId, normalized);
    } catch (error) {
      console.error("stay_upsert_failed", error);
    }

    const invoiceId = `INV-${randomUUID().slice(0, 8).toUpperCase()}`;
    const invoiceUrl = typeof checkoutResult?.invoiceUrl === "string" ? checkoutResult.invoiceUrl : null;

    await query(
      `
        INSERT INTO invoices (
          id,
          hotel_id,
          stay_id,
          title,
          department,
          amount_cents,
          currency,
          points_earned,
          issued_at,
          download_url,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, CURRENT_DATE, $8, NOW(), NOW())
      `,
      [invoiceId, principal.hotelId, principal.stayId, "Check-out", "reception", totalCents, currency, invoiceUrl]
    );

    sendJson(res, 200, {
      ok: true,
      totals: {
        balanceCents,
        tipCents: computedTipCents,
        totalCents,
        currency
      },
      invoice: { id: invoiceId, downloadUrl: invoiceUrl }
    });
    return;
  }

  if (segments[0] === "api" && segments[1] === "v1" && segments[2] === "spa") {
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const integrations = await getHotelIntegrations(principal.hotelId);
    const integrationManager = new IntegrationManager(integrations);

    let spa;
    try {
      spa = integrationManager.getSpa();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "spa_not_configured") {
        sendJson(res, 503, { error: "spa_not_configured" });
        return;
      }
      throw error;
    }

    if (req.method === "GET" && segments.length === 4 && segments[3] === "services") {
      const category = typeof url.searchParams.get("category") === "string" ? url.searchParams.get("category") : null;
      try {
        const items = await spa.getServices({ category: category ? category.trim() : null });
        sendJson(res, 200, { items });
        return;
      } catch (error) {
        console.error("spa_services_failed", error);
        sendJson(res, 502, { error: "spa_unavailable" });
        return;
      }
    }

    if (req.method === "GET" && segments.length === 4 && segments[3] === "practitioners") {
      const serviceId = typeof url.searchParams.get("serviceId") === "string" ? url.searchParams.get("serviceId") : null;
      try {
        const items = await spa.getPractitioners({ serviceId: serviceId ? serviceId.trim() : null });
        sendJson(res, 200, { items });
        return;
      } catch (error) {
        console.error("spa_practitioners_failed", error);
        sendJson(res, 502, { error: "spa_unavailable" });
        return;
      }
    }

    if (req.method === "GET" && segments.length === 4 && segments[3] === "availability") {
      const serviceId = typeof url.searchParams.get("serviceId") === "string" ? url.searchParams.get("serviceId").trim() : "";
      const practitionerId =
        typeof url.searchParams.get("practitionerId") === "string" ? url.searchParams.get("practitionerId").trim() : "";
      const date = typeof url.searchParams.get("date") === "string" ? url.searchParams.get("date").trim() : "";
      const durationRaw = typeof url.searchParams.get("duration") === "string" ? url.searchParams.get("duration").trim() : "";

      if (!serviceId || !date) {
        sendJson(res, 400, { error: "missing_fields", required: ["serviceId", "date"] });
        return;
      }

      const duration = durationRaw ? Number(durationRaw) : 60;

      try {
        const availability = await spa.getAvailability({
          serviceId,
          practitionerId: practitionerId || null,
          date,
          duration: Number.isFinite(duration) && duration > 0 ? duration : 60
        });
        sendJson(res, 200, availability);
        return;
      } catch (error) {
        console.error("spa_availability_failed", error);
        sendJson(res, 502, { error: "spa_unavailable" });
        return;
      }
    }

    if (req.method === "POST" && segments.length === 4 && segments[3] === "bookings") {
      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
      const practitionerId = typeof body.practitionerId === "string" ? body.practitionerId.trim() : "";
      const date = typeof body.date === "string" ? body.date.trim() : "";
      const time = typeof body.time === "string" ? body.time.trim() : "";
      const guestName = typeof body.guestName === "string" ? body.guestName.trim() : "";
      const guestEmail = typeof body.guestEmail === "string" ? body.guestEmail.trim() : "";
      const guestPhone = typeof body.guestPhone === "string" ? body.guestPhone.trim() : "";
      const specialRequests = typeof body.specialRequests === "string" ? body.specialRequests.trim() : "";

      if (!serviceId || !practitionerId || !date || !time || !guestName || !guestEmail) {
        sendJson(res, 400, {
          error: "missing_fields",
          required: ["serviceId", "practitionerId", "date", "time", "guestName", "guestEmail"]
        });
        return;
      }

      try {
        const booking = await spa.createBooking({
          serviceId,
          practitionerId,
          date,
          time,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests
        });
        sendJson(res, 201, booking);
        return;
      } catch (error) {
        console.error("spa_booking_failed", error);
        sendJson(res, 502, { error: "spa_unavailable" });
        return;
      }
    }

    sendJson(res, 404, { error: "not_found" });
    return;
  }

  // ==========================================================================
  // SERVICE CATALOG - Standardized Request Modules
  // ==========================================================================

  // GET /api/v1/services/categories - List service categories by department
  if (url.pathname === "/api/v1/services/categories") {
    if (req.method === "GET") {
      const hotelId = url.searchParams.get("hotelId");
      const department = url.searchParams.get("department");

      if (!hotelId) {
        sendJson(res, 400, { error: "missing_hotel_id" });
        return;
      }

      const where = ["hotel_id = $1", "is_active = TRUE"];
      const params = [hotelId];

      if (department) {
        params.push(department);
        where.push(`department = $${params.length}`);
      }

      const categories = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            department,
            name_key AS "nameKey",
            name_default AS "nameDefault",
            description_key AS "descriptionKey",
            description_default AS "descriptionDefault",
            icon,
            sort_order AS "sortOrder"
          FROM service_categories
          WHERE ${where.join(" AND ")}
          ORDER BY sort_order ASC, name_default ASC
        `,
        params
      );

      sendJson(res, 200, { categories });
      return;
    }

    // POST - Create category (staff only)
    if (req.method === "POST") {
      const principal = requirePrincipal(req, res, url, ["staff"]);
      if (!principal) return;

      if (principal.role !== "admin" && principal.role !== "manager") {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const department = typeof body.department === "string" ? body.department.trim() : "";
      const nameDefault = typeof body.nameDefault === "string" ? body.nameDefault.trim() : "";

      if (!department || !nameDefault) {
        sendJson(res, 400, { error: "missing_fields", required: ["department", "nameDefault"] });
        return;
      }

      const id = `SC-${randomUUID().slice(0, 8).toUpperCase()}`;
      const nameKey = `service.${department}.${id}`;

      const rows = await query(
        `
          INSERT INTO service_categories (
            id, hotel_id, department, name_key, name_default,
            description_key, description_default, icon, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING
            id,
            hotel_id AS "hotelId",
            department,
            name_key AS "nameKey",
            name_default AS "nameDefault",
            description_key AS "descriptionKey",
            description_default AS "descriptionDefault",
            icon,
            sort_order AS "sortOrder"
        `,
        [
          id,
          principal.hotelId,
          department,
          nameKey,
          nameDefault,
          body.descriptionKey ?? null,
          body.descriptionDefault ?? null,
          body.icon ?? null,
          body.sortOrder ?? 0
        ]
      );

      sendJson(res, 201, rows[0]);
      return;
    }
  }

  // GET /api/v1/services/items - List service items
  if (url.pathname === "/api/v1/services/items") {
    if (req.method === "GET") {
      const hotelId = url.searchParams.get("hotelId");
      const categoryId = url.searchParams.get("categoryId");
      const department = url.searchParams.get("department");

      if (!hotelId) {
        sendJson(res, 400, { error: "missing_hotel_id" });
        return;
      }

      const where = ["hotel_id = $1", "is_active = TRUE"];
      const params = [hotelId];

      if (categoryId) {
        params.push(categoryId);
        where.push(`category_id = $${params.length}`);
      }

      if (department) {
        params.push(department);
        where.push(`department = $${params.length}`);
      }

      const items = await query(
        `
          SELECT
            id,
            category_id AS "categoryId",
            hotel_id AS "hotelId",
            department,
            name_key AS "nameKey",
            name_default AS "nameDefault",
            description_key AS "descriptionKey",
            description_default AS "descriptionDefault",
            icon,
            form_fields AS "formFields",
            estimated_time_minutes AS "estimatedTimeMinutes",
            price_cents AS "priceCents",
            currency,
            sort_order AS "sortOrder",
            requires_confirmation AS "requiresConfirmation"
          FROM service_items
          WHERE ${where.join(" AND ")}
          ORDER BY sort_order ASC, name_default ASC
        `,
        params
      );

      sendJson(res, 200, { items });
      return;
    }

    // POST - Create service item (staff only)
    if (req.method === "POST") {
      const principal = requirePrincipal(req, res, url, ["staff"]);
      if (!principal) return;

      if (principal.role !== "admin" && principal.role !== "manager") {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
      const department = typeof body.department === "string" ? body.department.trim() : "";
      const nameDefault = typeof body.nameDefault === "string" ? body.nameDefault.trim() : "";

      if (!categoryId || !department || !nameDefault) {
        sendJson(res, 400, { error: "missing_fields", required: ["categoryId", "department", "nameDefault"] });
        return;
      }

      const id = `SI-${randomUUID().slice(0, 8).toUpperCase()}`;
      const nameKey = `service.item.${id}`;

      const rows = await query(
        `
          INSERT INTO service_items (
            id, category_id, hotel_id, department, name_key, name_default,
            description_key, description_default, icon, form_fields,
            estimated_time_minutes, price_cents, currency, sort_order, requires_confirmation
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15)
          RETURNING
            id,
            category_id AS "categoryId",
            hotel_id AS "hotelId",
            department,
            name_key AS "nameKey",
            name_default AS "nameDefault",
            description_key AS "descriptionKey",
            description_default AS "descriptionDefault",
            icon,
            form_fields AS "formFields",
            estimated_time_minutes AS "estimatedTimeMinutes",
            price_cents AS "priceCents",
            currency,
            sort_order AS "sortOrder",
            requires_confirmation AS "requiresConfirmation"
        `,
        [
          id,
          categoryId,
          principal.hotelId,
          department,
          nameKey,
          nameDefault,
          body.descriptionKey ?? null,
          body.descriptionDefault ?? null,
          body.icon ?? null,
          JSON.stringify(body.formFields ?? []),
          body.estimatedTimeMinutes ?? null,
          body.priceCents ?? null,
          body.currency ?? "EUR",
          body.sortOrder ?? 0,
          body.requiresConfirmation ?? false
        ]
      );

      sendJson(res, 201, rows[0]);
      return;
    }
  }

  // POST /api/v1/services/request - Submit a service request (creates a ticket)
  if (url.pathname === "/api/v1/services/request" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const serviceItemId = typeof body.serviceItemId === "string" ? body.serviceItemId.trim() : "";
    const formData = body.formData && typeof body.formData === "object" ? body.formData : {};

    const hotelId = typeof principal.hotelId === "string" ? principal.hotelId.trim() : "";
    if (!hotelId) {
      sendJson(res, 400, { error: "missing_hotel_context" });
      return;
    }

    if (principal.typ === "guest" && !principal.stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    let ticketDepartment = "";
    let ticketTitle = "";
    let ticketStatus = "pending";
    let serviceItemPayload = null;
    let estimatedTimeMinutes = null;
    let requiresConfirmation = false;
    let ticketPayload = {};

    if (serviceItemId) {
        // Get the service item details
        const itemRows = await query(
          `
            SELECT
              id,
              hotel_id AS "hotelId",
              department,
              name_default AS "nameDefault",
              estimated_time_minutes AS "estimatedTimeMinutes",
              requires_confirmation AS "requiresConfirmation"
            FROM service_items
            WHERE id = $1 AND is_active = TRUE
            LIMIT 1
          `,
          [serviceItemId]
        );

        if (itemRows.length === 0) {
          sendJson(res, 404, { error: "service_item_not_found" });
          return;
        }

        const serviceItem = itemRows[0];

        // Verify hotel access
        if (serviceItem.hotelId !== hotelId) {
          sendJson(res, 403, { error: "forbidden" });
          return;
        }

        ticketDepartment = serviceItem.department;
        ticketTitle = serviceItem.nameDefault;
        ticketStatus = serviceItem.requiresConfirmation ? "pending_confirmation" : "pending";
        serviceItemPayload = { id: serviceItem.id, name: serviceItem.nameDefault };
        estimatedTimeMinutes = serviceItem.estimatedTimeMinutes ?? null;
        requiresConfirmation = Boolean(serviceItem.requiresConfirmation);
        ticketPayload = { formData, serviceItem: serviceItemPayload };
    } else {
      ticketDepartment = typeof body.department === "string" ? body.department.trim() : "";
      ticketTitle = typeof body.title === "string" ? body.title.trim() : "";
      if (!ticketDepartment || !ticketTitle) {
        sendJson(res, 400, { error: "missing_fields", required: ["department", "title"] });
        return;
      }

      const payloadCandidate = body.payload;
      if (payloadCandidate && typeof payloadCandidate === "object") {
        ticketPayload = payloadCandidate;
      } else if (payloadCandidate !== undefined) {
        ticketPayload = { payload: payloadCandidate };
      } else {
        ticketPayload = {};
      }
    }

    // Get stay info for room number
    const stayId = principal.typ === "guest"
      ? principal.stayId
      : typeof body.stayId === "string" ? body.stayId.trim() : null;

    let roomNumber = typeof body.roomNumber === "string" ? body.roomNumber.trim() : "";
    if (!roomNumber && stayId) {
      const stays = await query(
        `SELECT room_number AS "roomNumber" FROM stays WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
        [stayId, hotelId]
      );
      roomNumber = stays[0]?.roomNumber ?? "";
    }

    if (!roomNumber) {
      sendJson(res, 400, { error: "missing_room_number" });
      return;
    }

    // Create the ticket
    const ticketId = `T-${randomUUID().slice(0, 8).toUpperCase()}`;

    const ticketRows = await query(
      `
        INSERT INTO tickets (
          id, hotel_id, stay_id, room_number, department, status, title,
          service_item_id, priority, source, payload, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          room_number AS "roomNumber",
          department,
          status,
          title,
          service_item_id AS "serviceItemId",
          priority,
          source,
          created_at AS "createdAt"
      `,
      [
        ticketId,
        hotelId,
        stayId,
        roomNumber,
        ticketDepartment,
        ticketStatus,
        ticketTitle,
        serviceItemId || null,
        body.priority ?? "normal",
        "service_form",
        JSON.stringify(ticketPayload)
      ]
    );

    const ticket = ticketRows[0];

    // Emit realtime event
    try {
      await emitRealtimeEvent({
        type: "ticket_created",
        hotelId,
        ticketId: ticket.id,
        stayId: ticket.stayId,
        roomNumber: ticket.roomNumber,
        department: ticket.department,
        status: ticket.status,
        source: "service_form"
      });
    } catch (error) {
      console.error("realtime_emit_failed", error);
    }

    // Notify staff
    try {
      const recipients = await listStaffNotificationTargets({
        hotelId,
        department: ticket.department
      });

      const subject = `New service request • ${ticket.department} • Room ${ticket.roomNumber}`;
      const bodyText = `New service request: ${ticket.title}\n\nRoom: ${ticket.roomNumber}\nDepartment: ${ticket.department}\nTicket: ${ticket.id}`;

      for (const recipient of recipients) {
        await enqueueEmailOutbox({
          hotelId,
          toAddress: recipient.email,
          subject,
          bodyText,
          payload: { type: "service_request", ticketId: ticket.id }
        });
      }
    } catch (error) {
      console.error("notification_enqueue_failed", error);
    }

    sendJson(res, 201, {
      ticket,
      estimatedTimeMinutes,
      requiresConfirmation
    });
    return;
  }

  // =====================================================
  // STAFF: RESERVATIONS (AeroGuest-inspired)
  // =====================================================

  // GET /api/v1/staff/reservations?status=&from=&to=&search=&page=&pageSize=
  if (url.pathname === "/api/v1/staff/reservations" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const allowedStatuses = ["arrivals", "checked_in", "checked_out", "cancelled"];
    const status = typeof url.searchParams.get("status") === "string" ? url.searchParams.get("status").trim() : "";
    if (status && !allowedStatuses.includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
      return;
    }

    const fromRaw = url.searchParams.get("from");
    const from = parseIsoDate(fromRaw);
    if (fromRaw && !from) {
      sendJson(res, 400, { error: "invalid_from" });
      return;
    }

    const toRaw = url.searchParams.get("to");
    const to = parseIsoDate(toRaw);
    if (toRaw && !to) {
      sendJson(res, 400, { error: "invalid_to" });
      return;
    }

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";

    const page = Math.min(500, parsePositiveInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, parsePositiveInt(url.searchParams.get("pageSize"), 25));
    const offset = (page - 1) * pageSize;

    const where = ["s.hotel_id = $1"];
    const params = [principal.hotelId];

    if (from) {
      params.push(from);
      where.push(`s.check_in >= $${params.length}::date`);
    }

    if (to) {
      params.push(to);
      where.push(`s.check_out <= $${params.length}::date`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(
        `(
          LOWER(s.confirmation_number) LIKE $${params.length}
          OR LOWER(s.id) LIKE $${params.length}
          OR LOWER(COALESCE(s.pms_reservation_id, '')) LIKE $${params.length}
          OR LOWER(COALESCE(s.room_number, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.first_name, s.guest_first_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.last_name, s.guest_last_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.email, s.guest_email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.phone, s.guest_phone, '')) LIKE $${params.length}
        )`
      );
    }

    const innerWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const statusParamIndex = params.length + 1;
    const limitParamIndex = params.length + 2;
    const offsetParamIndex = params.length + 3;

    const items = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          guest_id AS "guestId",
          confirmation_number AS "confirmationNumber",
          guest_name AS "guestName",
          phone,
          email,
          check_in AS "arrivalDate",
          check_out AS "departureDate",
          room_number AS "roomNumber",
          status,
          journey_status AS "journeyStatus",
          updated_at AS "updatedAt"
        FROM (
          SELECT
            s.id,
            s.hotel_id,
            s.guest_id,
            s.confirmation_number,
            TRIM(
              COALESCE(NULLIF(g.first_name, ''), NULLIF(s.guest_first_name, ''), '') || ' ' ||
              COALESCE(NULLIF(g.last_name, ''), NULLIF(s.guest_last_name, ''), '')
            ) AS guest_name,
            COALESCE(NULLIF(g.phone, ''), NULLIF(s.guest_phone, '')) AS phone,
            COALESCE(NULLIF(g.email, ''), NULLIF(s.guest_email, '')) AS email,
            s.check_in,
            s.check_out,
            s.room_number,
            CASE
              WHEN LOWER(COALESCE(s.pms_status, '')) IN ('cancelled', 'canceled') THEN 'cancelled'
              WHEN LOWER(COALESCE(s.pms_status, '')) IN ('checked_out', 'checked-out', 'checkedout') THEN 'checked_out'
              WHEN LOWER(COALESCE(s.pms_status, '')) IN ('checked_in', 'checked-in', 'checkedin') THEN 'checked_in'
              WHEN s.check_out < CURRENT_DATE THEN 'checked_out'
              WHEN s.check_in > CURRENT_DATE THEN 'arrivals'
              WHEN s.check_in = CURRENT_DATE AND (s.room_number IS NULL OR s.room_number = '') THEN 'arrivals'
              ELSE 'checked_in'
            END AS status,
            CASE
              WHEN COALESCE(NULLIF(g.email, ''), NULLIF(s.guest_email, '')) IS NULL
                OR COALESCE(NULLIF(g.phone, ''), NULLIF(s.guest_phone, '')) IS NULL
              THEN 'Missing contact info'
              ELSE NULL
            END AS journey_status,
            s.updated_at
          FROM stays s
          LEFT JOIN guests g ON g.id = s.guest_id
          ${innerWhere}
        ) AS sub
        WHERE ($${statusParamIndex}::text IS NULL OR status = $${statusParamIndex})
        ORDER BY check_in ASC, check_out ASC, confirmation_number ASC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `,
      [...params, status || null, pageSize, offset]
    );

    const totalRows = await query(
      `
        SELECT COUNT(*)::int AS count
        FROM (
          SELECT
            CASE
              WHEN LOWER(COALESCE(s.pms_status, '')) IN ('cancelled', 'canceled') THEN 'cancelled'
              WHEN LOWER(COALESCE(s.pms_status, '')) IN ('checked_out', 'checked-out', 'checkedout') THEN 'checked_out'
              WHEN LOWER(COALESCE(s.pms_status, '')) IN ('checked_in', 'checked-in', 'checkedin') THEN 'checked_in'
              WHEN s.check_out < CURRENT_DATE THEN 'checked_out'
              WHEN s.check_in > CURRENT_DATE THEN 'arrivals'
              WHEN s.check_in = CURRENT_DATE AND (s.room_number IS NULL OR s.room_number = '') THEN 'arrivals'
              ELSE 'checked_in'
            END AS status
          FROM stays s
          LEFT JOIN guests g ON g.id = s.guest_id
          ${innerWhere}
        ) AS sub
        WHERE ($${statusParamIndex}::text IS NULL OR status = $${statusParamIndex})
      `,
      [...params, status || null]
    );

    const total = typeof totalRows[0]?.count === "number" ? totalRows[0].count : 0;

    sendJson(res, 200, {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    });
    return;
  }

  // POST /api/v1/staff/reservations/sync - pull latest reservations from PMS (manager/admin)
  if (url.pathname === "/api/v1/staff/reservations/sync" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const integrations = await getHotelIntegrations(principal.hotelId);
    const provider = integrations?.pms?.provider ?? null;
    const config = integrations?.pms?.config ?? {};
    if (!provider || provider === "none") {
      sendJson(res, 400, { error: "pms_not_configured" });
      return;
    }
    if (!config?.baseUrl || !config?.resortId) {
      sendJson(res, 400, { error: "pms_missing_config" });
      return;
    }

    const integrationManager = new IntegrationManager(integrations);
    const pms = integrationManager.getPMS();

    let processed = 0;
    let linkedGuests = 0;

    try {
      const reservations = await pms.listReservations();
      for (const reservation of reservations ?? []) {
        try {
          const stay = await upsertStayFromPmsReservation(principal.hotelId, reservation);
          processed += 1;
          if (stay.guestId) linkedGuests += 1;
        } catch (error) {
          console.error("pms_sync_upsert_failed", error);
        }
      }
    } catch (error) {
      console.error("pms_sync_failed", error);
      sendJson(res, 503, { error: "pms_unavailable" });
      return;
    }

    sendJson(res, 200, { ok: true, upserted: { stays: processed, linkedGuests } });
    return;
  }

  // POST /api/v1/staff/reservations - create reservation in PMS (manager/admin)
  if (url.pathname === "/api/v1/staff/reservations" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const arrivalDate = normalizeDateLike(body.arrivalDate);
    const departureDate = normalizeDateLike(body.departureDate);
    if (!arrivalDate || !departureDate) {
      sendJson(res, 400, { error: "invalid_dates" });
      return;
    }

    const guestFirstName = normalizeText(body.guestFirstName);
    const guestLastName = normalizeText(body.guestLastName);
    if (!guestFirstName && !guestLastName) {
      sendJson(res, 400, { error: "missing_guest_name" });
      return;
    }

    const guestEmail = normalizeEmail(body.guestEmail);
    const guestPhone = normalizeText(body.guestPhone);

    const roomNumber = normalizeText(body.roomNumber);
    const adults = typeof body.adults === "number" && body.adults > 0 ? Math.floor(body.adults) : 1;
    const children = typeof body.children === "number" && body.children >= 0 ? Math.floor(body.children) : 0;

    const confirmationNumber = normalizeText(body.confirmationNumber);

    const integrations = await getHotelIntegrations(principal.hotelId);
    const provider = integrations?.pms?.provider ?? null;
    const config = integrations?.pms?.config ?? {};
    if (!provider || provider === "none") {
      sendJson(res, 400, { error: "pms_not_configured" });
      return;
    }
    if (!config?.baseUrl || !config?.resortId) {
      sendJson(res, 400, { error: "pms_missing_config" });
      return;
    }

    const integrationManager = new IntegrationManager(integrations);
    const pms = integrationManager.getPMS();

    let created = null;
    try {
      created = await pms.createReservation({
        ...(confirmationNumber ? { confirmationNumber } : {}),
        guest: {
          ...(guestFirstName ? { firstName: guestFirstName } : {}),
          ...(guestLastName ? { lastName: guestLastName } : {}),
          ...(guestEmail ? { email: guestEmail } : {}),
          ...(guestPhone ? { phone: guestPhone } : {})
        },
        arrival: arrivalDate,
        departure: departureDate,
        ...(roomNumber ? { roomNumber } : {}),
        adults,
        children
      });
    } catch (error) {
      console.error("pms_create_reservation_failed", error);
      sendJson(res, 503, { error: "pms_unavailable" });
      return;
    }

    if (!created) {
      sendJson(res, 502, { error: "pms_create_failed" });
      return;
    }

    const stay = await upsertStayFromPmsReservation(principal.hotelId, created);
    sendJson(res, 201, { stay });
    return;
  }

  // GET /api/v1/staff/reservations/:stayId - Reservation detail for drawer
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "reservations" &&
    segments[4] &&
    req.method === "GET" &&
    segments.length === 5
  ) {
    const stayId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const rows = await query(
      `
        SELECT
          s.id,
          s.hotel_id AS "hotelId",
          h.name AS "hotelName",
          s.guest_id AS "guestId",
          s.confirmation_number AS "confirmationNumber",
          s.pms_reservation_id AS "pmsReservationId",
          s.pms_status AS "pmsStatus",
          s.guest_first_name AS "guestSnapshotFirstName",
          s.guest_last_name AS "guestSnapshotLastName",
          s.guest_email AS "guestSnapshotEmail",
          s.guest_phone AS "guestSnapshotPhone",
          s.room_number AS "roomNumber",
          s.check_in AS "checkIn",
          s.check_out AS "checkOut",
          s.adults,
          s.children,
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt",
          g.first_name AS "guestFirstName",
          g.last_name AS "guestLastName",
          g.email AS "guestEmail",
          g.phone AS "guestPhone",
          g.email_verified AS "guestEmailVerified",
          g.id_document_verified AS "guestIdDocumentVerified"
        FROM stays s
        JOIN hotels h ON h.id = s.hotel_id
        LEFT JOIN guests g ON g.id = s.guest_id
        WHERE s.id = $1
        LIMIT 1
      `,
      [stayId]
    );

    const stay = rows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }

    if (stay.hotelId !== principal.hotelId && principal.role !== "admin" && principal.role !== "manager") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const checkInIso = typeof stay.checkIn === "string" ? stay.checkIn : todayIso;
    const checkOutIso = typeof stay.checkOut === "string" ? stay.checkOut : todayIso;

    let status = "checked_in";
    const pmsStatus = typeof stay.pmsStatus === "string" ? stay.pmsStatus.trim().toLowerCase() : "";
    if (["cancelled", "canceled"].includes(pmsStatus)) status = "cancelled";
    else if (["checked_out", "checked-out", "checkedout"].includes(pmsStatus)) status = "checked_out";
    else if (["checked_in", "checked-in", "checkedin"].includes(pmsStatus)) status = "checked_in";
    else if (checkOutIso < todayIso) status = "checked_out";
    else if (checkInIso > todayIso) status = "arrivals";
    else if (checkInIso === todayIso && (!stay.roomNumber || !String(stay.roomNumber).trim())) status = "arrivals";

    const guestFirstName = stay.guestFirstName ?? stay.guestSnapshotFirstName ?? null;
    const guestLastName = stay.guestLastName ?? stay.guestSnapshotLastName ?? null;
    const guestEmail = stay.guestEmail ?? stay.guestSnapshotEmail ?? null;
    const guestPhone = stay.guestPhone ?? stay.guestSnapshotPhone ?? null;

    const guestName = [guestFirstName, guestLastName].filter(Boolean).join(" ").trim();
    const journeyStatus = !guestEmail || !guestPhone ? "Missing contact info" : null;

    const [tickets, threads] = await Promise.all([
      query(
        `
          SELECT
            id,
            room_number AS "roomNumber",
            department,
            status,
            title,
            updated_at AS "updatedAt"
          FROM tickets
          WHERE hotel_id = $1 AND stay_id = $2
          ORDER BY updated_at DESC
          LIMIT 25
        `,
        [stay.hotelId, stayId]
      ),
      query(
        `
          SELECT * FROM (
            SELECT
              t.id,
              t.department,
              t.status,
              t.title,
              t.updated_at AS "updatedAt",
              (
                SELECT body_text
                FROM messages m
                WHERE m.thread_id = t.id
                ORDER BY m.created_at DESC
                LIMIT 1
              ) AS "lastMessage",
              (
                SELECT created_at
                FROM messages m
                WHERE m.thread_id = t.id
                ORDER BY m.created_at DESC
                LIMIT 1
              ) AS "lastMessageAt"
            FROM threads t
            WHERE t.hotel_id = $1 AND t.stay_id = $2
          ) AS sub
          ORDER BY COALESCE("lastMessageAt", "updatedAt") DESC
          LIMIT 25
        `,
        [stay.hotelId, stayId]
      )
    ]);

    sendJson(res, 200, {
      id: stay.id,
      hotel: { id: stay.hotelId, name: stay.hotelName },
      guest: {
        id: stay.guestId ?? null,
        name: guestName || null,
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        emailVerified: Boolean(stay.guestId && stay.guestEmailVerified),
        idDocumentVerified: Boolean(stay.guestId && stay.guestIdDocumentVerified)
      },
      stay: {
        id: stay.id,
        confirmationNumber: stay.confirmationNumber,
        pmsReservationId: stay.pmsReservationId ?? null,
        pmsStatus: stay.pmsStatus ?? null,
        roomNumber: stay.roomNumber,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: { adults: stay.adults, children: stay.children },
        status,
        journeyStatus
      },
      links: {
        tickets,
        threads
      }
    });
    return;
  }

  // PATCH /api/v1/staff/reservations/:stayId - update reservation in PMS (manager/admin)
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "reservations" &&
    segments[4] &&
    req.method === "PATCH" &&
    segments.length === 5
  ) {
    const stayId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const existingRows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          pms_reservation_id AS "pmsReservationId"
        FROM stays
        WHERE id = $1
        LIMIT 1
      `,
      [stayId]
    );

    const existing = existingRows[0] ?? null;
    if (!existing) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }

    if (existing.hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const pmsReservationId = normalizeText(existing.pmsReservationId);
    if (!pmsReservationId) {
      sendJson(res, 409, { error: "reservation_missing_pms_reference" });
      return;
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const patch = {};
    const arrivalDate = normalizeDateLike(body.arrivalDate);
    const departureDate = normalizeDateLike(body.departureDate);
    const roomNumber = normalizeText(body.roomNumber);

    if (arrivalDate) patch.arrival = arrivalDate;
    if (departureDate) patch.departure = departureDate;
    if (roomNumber) patch.roomNumber = roomNumber;

    const adults = typeof body.adults === "number" && body.adults > 0 ? Math.floor(body.adults) : null;
    const children = typeof body.children === "number" && body.children >= 0 ? Math.floor(body.children) : null;
    if (adults !== null) patch.adults = adults;
    if (children !== null) patch.children = children;

    const guestPatch = {};
    const guestFirstName = normalizeText(body.guestFirstName);
    const guestLastName = normalizeText(body.guestLastName);
    const guestEmail = normalizeEmail(body.guestEmail);
    const guestPhone = normalizeText(body.guestPhone);

    if (guestFirstName) guestPatch.firstName = guestFirstName;
    if (guestLastName) guestPatch.lastName = guestLastName;
    if (guestEmail) guestPatch.email = guestEmail;
    if (guestPhone) guestPatch.phone = guestPhone;

    if (Object.keys(guestPatch).length) patch.guest = guestPatch;

    if (Object.keys(patch).length === 0) {
      sendJson(res, 400, { error: "missing_patch" });
      return;
    }

    const integrations = await getHotelIntegrations(principal.hotelId);
    const provider = integrations?.pms?.provider ?? null;
    const config = integrations?.pms?.config ?? {};
    if (!provider || provider === "none") {
      sendJson(res, 400, { error: "pms_not_configured" });
      return;
    }
    if (!config?.baseUrl || !config?.resortId) {
      sendJson(res, 400, { error: "pms_missing_config" });
      return;
    }

    const integrationManager = new IntegrationManager(integrations);
    const pms = integrationManager.getPMS();

    let updated = null;
    try {
      updated = await pms.updateReservation(pmsReservationId, patch);
    } catch (error) {
      console.error("pms_update_reservation_failed", error);
      sendJson(res, 503, { error: "pms_unavailable" });
      return;
    }

    if (!updated) {
      sendJson(res, 502, { error: "pms_update_failed" });
      return;
    }

    const stay = await upsertStayFromPmsReservation(principal.hotelId, updated);
    sendJson(res, 200, { stay });
    return;
  }

  // POST /api/v1/staff/reservations/:stayId/checkin-reminder - enqueue a reminder email (manager/admin only)
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "reservations" &&
    segments[4] &&
    segments[5] === "checkin-reminder" &&
    req.method === "POST" &&
    segments.length === 6
  ) {
    const stayId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const rows = await query(
      `
        SELECT
          s.id,
          s.hotel_id AS "hotelId",
          h.name AS "hotelName",
          s.confirmation_number AS "confirmationNumber",
          s.check_in AS "checkIn",
          g.email AS "guestEmail",
          g.first_name AS "guestFirstName",
          g.last_name AS "guestLastName"
        FROM stays s
        JOIN hotels h ON h.id = s.hotel_id
        LEFT JOIN guests g ON g.id = s.guest_id
        WHERE s.id = $1
        LIMIT 1
      `,
      [stayId]
    );

    const stay = rows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "reservation_not_found" });
      return;
    }

    if (stay.hotelId !== principal.hotelId && principal.role !== "admin") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const toAddress = typeof stay.guestEmail === "string" ? stay.guestEmail.trim() : "";
    if (!toAddress) {
      sendJson(res, 400, { error: "missing_contact_info" });
      return;
    }

    const guestName = [stay.guestFirstName, stay.guestLastName].filter(Boolean).join(" ").trim();
    const subject = `Check-in reminder • ${stay.hotelName}`;
    const bodyText = [
      `Hello${guestName ? ` ${guestName}` : ""},`,
      "",
      "This is a friendly reminder for your upcoming stay.",
      "",
      `Hotel: ${stay.hotelName}`,
      `Arrival: ${stay.checkIn}`,
      `Reservation: ${stay.confirmationNumber}`,
      "",
      "If you have any questions, simply reply to this message.",
      "",
      "MyStay"
    ].join("\n");

    const outbox = await enqueueEmailOutbox({
      hotelId: stay.hotelId,
      toAddress,
      subject,
      bodyText,
      payload: { type: "checkin_reminder", stayId: stay.id, confirmationNumber: stay.confirmationNumber }
    });

    sendJson(res, 200, { ok: true, outbox });
    return;
  }

  // =====================================================
  // STAFF: CONVERSATIONS (AeroGuest-inspired inbox)
  // =====================================================

  // GET /api/v1/staff/conversations?tab=&stayId=&search=&page=&pageSize=
  if (url.pathname === "/api/v1/staff/conversations" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const allowedTabs = ["messages", "archived", "ratings"];
    const tab = typeof url.searchParams.get("tab") === "string" ? url.searchParams.get("tab").trim() : "";
    if (tab && !allowedTabs.includes(tab)) {
      sendJson(res, 400, { error: "invalid_tab", allowed: allowedTabs });
      return;
    }

    const stayId = typeof url.searchParams.get("stayId") === "string" ? url.searchParams.get("stayId").trim() : "";
    const department =
      typeof url.searchParams.get("department") === "string" ? url.searchParams.get("department").trim() : "";
    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";

    const page = Math.min(500, parsePositiveInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, parsePositiveInt(url.searchParams.get("pageSize"), 25));
    const offset = (page - 1) * pageSize;

    const where = ["t.hotel_id = $1"];
    const params = [principal.hotelId];

	    const canSeeAllDepartments = principal.role === "admin" || principal.role === "manager";
	    const allowedDepartments = Array.isArray(principal.departments)
	      ? principal.departments
	          .filter((dept) => typeof dept === "string")
          .map((dept) => dept.trim())
          .filter(Boolean)
      : [];

    if (!canSeeAllDepartments) {
      if (allowedDepartments.length === 0) {
        sendJson(res, 200, { items: [], page, pageSize, total: 0, totalPages: 1 });
        return;
      }
      params.push(allowedDepartments);
      where.push(`t.department = ANY($${params.length}::text[])`);
    }

    if (stayId) {
      params.push(stayId);
      where.push(`t.stay_id = $${params.length}`);
    }

    if (department) {
      params.push(department);
      where.push(`t.department = $${params.length}`);
    }

    if (tab === "archived") {
      where.push(`t.status = 'archived'`);
    } else if (tab === "ratings") {
      where.push(`t.status = 'resolved'`);
    } else {
      where.push(`t.status <> 'archived'`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const idx = params.length;
      where.push(
        `(
          LOWER(COALESCE(t.id, '')) LIKE $${idx}
          OR LOWER(COALESCE(t.title, '')) LIKE $${idx}
          OR LOWER(COALESCE(t.department, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.confirmation_number, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.room_number, '')) LIKE $${idx}
          OR LOWER(TRIM(COALESCE(g.first_name, '') || ' ' || COALESCE(g.last_name, ''))) LIKE $${idx}
          OR LOWER(COALESCE(g.email, '')) LIKE $${idx}
          OR LOWER(COALESCE(g.phone, '')) LIKE $${idx}
        )`
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;

    const items = await query(
      `
        SELECT * FROM (
          SELECT
            t.id,
            t.hotel_id AS "hotelId",
            t.stay_id AS "stayId",
            t.department,
            t.status,
            t.title,
            t.assigned_staff_user_id AS "assignedStaffUserId",
            t.created_at AS "createdAt",
            t.updated_at AS "updatedAt",
            s.confirmation_number AS "confirmationNumber",
            s.room_number AS "roomNumber",
            s.guest_id AS "guestId",
            TRIM(COALESCE(g.first_name, '') || ' ' || COALESCE(g.last_name, '')) AS "guestName",
            g.email AS "guestEmail",
            g.phone AS "guestPhone",
            (
              SELECT body_text
              FROM messages m
              WHERE m.thread_id = t.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS "lastMessage",
            (
              SELECT created_at
              FROM messages m
              WHERE m.thread_id = t.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS "lastMessageAt"
          FROM threads t
          LEFT JOIN stays s ON s.id = t.stay_id
          LEFT JOIN guests g ON g.id = s.guest_id
          ${whereClause}
        ) AS sub
        ORDER BY COALESCE("lastMessageAt", "updatedAt") DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `,
      [...params, pageSize, offset]
    );

    const totalRows = await query(
      `
        SELECT COUNT(*)::int AS count
        FROM threads t
        LEFT JOIN stays s ON s.id = t.stay_id
        LEFT JOIN guests g ON g.id = s.guest_id
        ${whereClause}
      `,
      params
    );
    const total = typeof totalRows[0]?.count === "number" ? totalRows[0].count : 0;

    sendJson(res, 200, { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    return;
  }

  // POST /api/v1/staff/conversations - create or return a conversation thread for a stay
  if (url.pathname === "/api/v1/staff/conversations" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const stayId = typeof body.stayId === "string" ? body.stayId.trim() : "";
    if (!stayId) {
      sendJson(res, 400, { error: "missing_stay_id" });
      return;
    }

    const requestedDepartment = typeof body.department === "string" ? body.department.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    const stayRows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          confirmation_number AS "confirmationNumber",
          room_number AS "roomNumber"
        FROM stays
        WHERE id = $1
        LIMIT 1
      `,
      [stayId]
    );
    const stay = stayRows[0] ?? null;
    if (!stay) {
      sendJson(res, 404, { error: "stay_not_found" });
      return;
    }

    if (stay.hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

	    const canSeeAllDepartments = principal.role === "admin" || principal.role === "manager";
	    const allowedDepartments = Array.isArray(principal.departments)
	      ? principal.departments
	          .filter((dept) => typeof dept === "string")
          .map((dept) => dept.trim())
          .filter(Boolean)
      : [];

    let department = requestedDepartment;
    if (department) {
      if (!canSeeAllDepartments && !allowedDepartments.includes(department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }
    } else if (canSeeAllDepartments) {
      department = "reception";
    } else if (allowedDepartments.includes("reception")) {
      department = "reception";
    } else {
      department = allowedDepartments[0] ?? "";
    }

    if (!department) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const threadQueryParams = [principal.hotelId, stayId];
    let threadWhere = `hotel_id = $1 AND stay_id = $2 AND status <> 'archived'`;

    if (requestedDepartment) {
      threadQueryParams.push(department);
      threadWhere += ` AND department = $${threadQueryParams.length}`;
    } else if (!canSeeAllDepartments) {
      threadQueryParams.push(allowedDepartments);
      threadWhere += ` AND department = ANY($${threadQueryParams.length}::text[])`;
    }

    const existingThreads = await query(
      `
        SELECT
          id,
          department,
          status,
          title,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM threads
        WHERE ${threadWhere}
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      threadQueryParams
    );

    const existing = existingThreads[0] ?? null;
    if (existing) {
      sendJson(res, 200, {
        conversation: {
          id: existing.id,
          hotelId: principal.hotelId,
          stayId,
          department: existing.department,
          status: existing.status,
          title: existing.title,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt
        }
      });
      return;
    }

    const id = `TH-${randomUUID().slice(0, 8).toUpperCase()}`;
    const threadTitle = title || "Conversation";

    const insertedRows = await query(
      `
        INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          department,
          status,
          title,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, principal.hotelId, stayId, department, threadTitle]
    );

    const created = insertedRows[0];
    try {
      await emitRealtimeEvent({
        type: "thread_created",
        hotelId: created.hotelId,
        threadId: created.id,
        stayId: created.stayId,
        department: created.department,
        status: created.status
      });
    } catch (error) {
      console.error("realtime_emit_failed", error);
    }

    sendJson(res, 201, {
      conversation: {
        ...created,
        confirmationNumber: stay.confirmationNumber ?? null,
        roomNumber: stay.roomNumber ?? null
      }
    });
    return;
  }

  // PATCH /api/v1/staff/conversations/:id/archive - archive conversation (read-only)
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "conversations" &&
    segments[4] &&
    segments[5] === "archive" &&
    req.method === "PATCH" &&
    segments.length === 6
  ) {
    const conversationId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const scopeRows = await query(
      `
        SELECT
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          department,
          status,
          assigned_staff_user_id AS "assignedStaffUserId"
        FROM threads
        WHERE id = $1
        LIMIT 1
      `,
      [conversationId]
    );

    const scope = scopeRows[0];
    if (!scope) {
      sendJson(res, 404, { error: "conversation_not_found" });
      return;
    }

    if (scope.hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    if (!isDepartmentAllowed(principal, scope.department)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    if (scope.status === "archived") {
      sendJson(res, 200, { ok: true, status: "archived" });
      return;
    }

    const updatedRows = await query(
      `
        UPDATE threads
        SET status = 'archived', updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          department,
          status,
          title,
          assigned_staff_user_id AS "assignedStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [conversationId]
    );

    const updated = updatedRows[0];
    if (!updated) {
      sendJson(res, 404, { error: "conversation_not_found" });
      return;
    }

    try {
      await emitRealtimeEvent({
        type: "thread_updated",
        hotelId: updated.hotelId,
        threadId: updated.id,
        stayId: updated.stayId,
        department: updated.department,
        status: updated.status,
        assignedStaffUserId: updated.assignedStaffUserId ?? null,
        updatedAt: updated.updatedAt
      });
    } catch (error) {
      console.error("realtime_emit_failed", error);
    }

    sendJson(res, 200, { ok: true });
    return;
  }

  // =====================================================
  // STAFF: PAY BY LINK
  // =====================================================

  // GET /api/v1/staff/payment-links?from=&to=&status=&search=&page=&pageSize=
  if (url.pathname === "/api/v1/staff/payment-links" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const allowedStatuses = ["created", "paid", "failed", "expired"];
    const status = typeof url.searchParams.get("status") === "string" ? url.searchParams.get("status").trim() : "";
    if (status && !allowedStatuses.includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
      return;
    }

    const fromRaw = url.searchParams.get("from");
    const from = parseIsoDate(fromRaw);
    if (fromRaw && !from) {
      sendJson(res, 400, { error: "invalid_from" });
      return;
    }

    const toRaw = url.searchParams.get("to");
    const to = parseIsoDate(toRaw);
    if (toRaw && !to) {
      sendJson(res, 400, { error: "invalid_to" });
      return;
    }

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";

    const page = Math.min(500, parsePositiveInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, parsePositiveInt(url.searchParams.get("pageSize"), 25));
    const offset = (page - 1) * pageSize;

    const where = ["pl.hotel_id = $1"];
    const params = [principal.hotelId];

    if (from) {
      params.push(from);
      where.push(`pl.created_at::date >= $${params.length}::date`);
    }

    if (to) {
      params.push(to);
      where.push(`pl.created_at::date <= $${params.length}::date`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(
        `(
          LOWER(COALESCE(pl.id, '')) LIKE $${params.length}
          OR LOWER(COALESCE(pl.public_token, '')) LIKE $${params.length}
          OR LOWER(COALESCE(pl.reason_text, '')) LIKE $${params.length}
          OR LOWER(COALESCE(pl.payer_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(pl.payer_email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(s.confirmation_number, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.first_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.last_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.email, '')) LIKE $${params.length}
          OR LOWER(COALESCE(g.phone, '')) LIKE $${params.length}
        )`
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const statusParamIndex = params.length + 1;
    const limitParamIndex = params.length + 2;
    const offsetParamIndex = params.length + 3;

    const items = await query(
      `
        SELECT
          pl.id,
          pl.hotel_id AS "hotelId",
          pl.stay_id AS "stayId",
          pl.guest_id AS "guestId",
          pl.payer_type AS "payerType",
          COALESCE(
            NULLIF(pl.payer_name, ''),
            NULLIF(TRIM(COALESCE(g.first_name, '') || ' ' || COALESCE(g.last_name, '')), ''),
            NULLIF(pl.payer_email, ''),
            'Unknown'
          ) AS "payerName",
          COALESCE(NULLIF(pl.payer_email, ''), g.email) AS "payerEmail",
          COALESCE(NULLIF(pl.payer_phone, ''), g.phone) AS "payerPhone",
          pl.amount_cents AS "amountCents",
          pl.currency,
          pl.reason_category AS "reasonCategory",
          pl.reason_text AS "reasonText",
          pl.pms_status AS "pmsStatus",
          pl.payment_status AS "paymentStatus",
          pl.public_url AS "publicUrl",
          s.confirmation_number AS "confirmationNumber",
          pl.created_at AS "createdAt",
          pl.updated_at AS "updatedAt"
        FROM payment_links pl
        LEFT JOIN stays s ON s.id = pl.stay_id
        LEFT JOIN guests g ON g.id = pl.guest_id
        ${whereClause}
        AND ($${statusParamIndex}::text IS NULL OR pl.payment_status = $${statusParamIndex})
        ORDER BY pl.created_at DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `,
      [...params, status || null, pageSize, offset]
    );

    const totalRows = await query(
      `
        SELECT COUNT(*)::int AS count
        FROM payment_links pl
        LEFT JOIN stays s ON s.id = pl.stay_id
        LEFT JOIN guests g ON g.id = pl.guest_id
        ${whereClause}
        AND ($${statusParamIndex}::text IS NULL OR pl.payment_status = $${statusParamIndex})
      `,
      [...params, status || null]
    );

    const total = typeof totalRows[0]?.count === "number" ? totalRows[0].count : 0;

    sendJson(res, 200, { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    return;
  }

  // POST /api/v1/staff/payment-links - Create payment link
  if (url.pathname === "/api/v1/staff/payment-links" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const payerType = typeof body.payerType === "string" ? body.payerType.trim() : "guest";
    if (payerType !== "guest" && payerType !== "visitor") {
      sendJson(res, 400, { error: "invalid_payer_type" });
      return;
    }

    const stayId = typeof body.stayId === "string" ? body.stayId.trim() : null;
    const guestId = typeof body.guestId === "string" ? body.guestId.trim() : null;
    const payerName = typeof body.payerName === "string" ? body.payerName.trim() : null;
    const payerEmail = typeof body.payerEmail === "string" ? body.payerEmail.trim() : null;
    const payerPhone = typeof body.payerPhone === "string" ? body.payerPhone.trim() : null;

    const amountCents = typeof body.amountCents === "number" ? Math.floor(body.amountCents) : NaN;
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      sendJson(res, 400, { error: "invalid_amount" });
      return;
    }

    const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
    const reasonCategory = typeof body.reasonCategory === "string" ? body.reasonCategory.trim() : null;
    const reasonText = typeof body.reasonText === "string" ? body.reasonText.trim() : null;

    const resolvedStayId = stayId || null;
    let resolvedGuestId = guestId || null;

    if (resolvedStayId) {
      const rows = await query(
        `
          SELECT guest_id AS "guestId"
          FROM stays
          WHERE id = $1 AND hotel_id = $2
          LIMIT 1
        `,
        [resolvedStayId, principal.hotelId]
      );
      if (!rows[0]) {
        sendJson(res, 400, { error: "invalid_stay_id" });
        return;
      }
      if (!resolvedGuestId && typeof rows[0]?.guestId === "string" && rows[0].guestId.trim()) {
        resolvedGuestId = rows[0].guestId.trim();
      }
    }

    if (payerType === "guest" && !resolvedStayId && !resolvedGuestId) {
      sendJson(res, 400, { error: "missing_fields", required: ["stayId or guestId"] });
      return;
    }

    if (payerType === "visitor" && !payerName && !payerEmail) {
      sendJson(res, 400, { error: "missing_fields", required: ["payerName or payerEmail"] });
      return;
    }

    const hotelRows = await query(`SELECT currency FROM hotels WHERE id = $1 LIMIT 1`, [principal.hotelId]);
    const hotelCurrency = typeof hotelRows[0]?.currency === "string" ? hotelRows[0].currency.trim().toUpperCase() : "EUR";
    const resolvedCurrency = currency || hotelCurrency || "EUR";

    const integrations = await getHotelIntegrations(principal.hotelId);
    const pmsConfigured = integrations?.pms?.provider && integrations.pms.provider !== "none";
    const pmsStatus = pmsConfigured ? "configured" : "not_configured";

    const id = `PL-${randomUUID().slice(0, 8).toUpperCase()}`;
    const publicToken = `pl_${randomUUID().replace(/-/g, "")}`;
    const baseUrl = (process.env.PAYMENT_LINK_BASE_URL ?? "http://localhost:3000/pay").replace(/\/+$/, "");
    const publicUrl = `${baseUrl}/${publicToken}`;

    const rows = await query(
      `
        INSERT INTO payment_links (
          id,
          hotel_id,
          stay_id,
          guest_id,
          payer_type,
          payer_name,
          payer_email,
          payer_phone,
          amount_cents,
          currency,
          reason_category,
          reason_text,
          pms_status,
          payment_status,
          public_token,
          public_url,
          created_by_staff_user_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'created', $14, $15, $16, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          guest_id AS "guestId",
          payer_type AS "payerType",
          payer_name AS "payerName",
          payer_email AS "payerEmail",
          payer_phone AS "payerPhone",
          amount_cents AS "amountCents",
          currency,
          reason_category AS "reasonCategory",
          reason_text AS "reasonText",
          pms_status AS "pmsStatus",
          payment_status AS "paymentStatus",
          public_token AS "publicToken",
          public_url AS "publicUrl",
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        id,
        principal.hotelId,
        resolvedStayId,
        resolvedGuestId,
        payerType,
        payerName,
        payerEmail,
        payerPhone,
        amountCents,
        resolvedCurrency,
        reasonCategory,
        reasonText,
        pmsStatus,
        publicToken,
        publicUrl,
        principal.staffUserId
      ]
    );

    sendJson(res, 201, rows[0]);
    return;
  }

  // GET /api/v1/staff/payment-links/:id - Payment link details
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "payment-links" &&
    segments[4] &&
    req.method === "GET" &&
    segments.length === 5
  ) {
    const paymentLinkId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const rows = await query(
      `
        SELECT
          pl.id,
          pl.hotel_id AS "hotelId",
          pl.stay_id AS "stayId",
          pl.guest_id AS "guestId",
          pl.payer_type AS "payerType",
          pl.payer_name AS "payerName",
          pl.payer_email AS "payerEmail",
          pl.payer_phone AS "payerPhone",
          pl.amount_cents AS "amountCents",
          pl.currency,
          pl.reason_category AS "reasonCategory",
          pl.reason_text AS "reasonText",
          pl.pms_status AS "pmsStatus",
          pl.payment_status AS "paymentStatus",
          pl.public_token AS "publicToken",
          pl.public_url AS "publicUrl",
          pl.paid_at AS "paidAt",
          pl.expires_at AS "expiresAt",
          pl.created_at AS "createdAt",
          pl.updated_at AS "updatedAt",
          s.confirmation_number AS "confirmationNumber",
          s.room_number AS "roomNumber",
          g.first_name AS "guestFirstName",
          g.last_name AS "guestLastName",
          g.email AS "guestEmail",
          g.phone AS "guestPhone"
        FROM payment_links pl
        LEFT JOIN stays s ON s.id = pl.stay_id
        LEFT JOIN guests g ON g.id = pl.guest_id
        WHERE pl.id = $1 AND pl.hotel_id = $2
        LIMIT 1
      `,
      [paymentLinkId, principal.hotelId]
    );

    const row = rows[0] ?? null;
    if (!row) {
      sendJson(res, 404, { error: "payment_link_not_found" });
      return;
    }

    const guestName = [row.guestFirstName, row.guestLastName].filter(Boolean).join(" ").trim();
    sendJson(res, 200, {
      id: row.id,
      hotelId: row.hotelId,
      payer: {
        type: row.payerType,
        name: row.payerName || guestName || null,
        email: row.payerEmail || row.guestEmail || null,
        phone: row.payerPhone || row.guestPhone || null
      },
      stay: row.stayId
        ? {
            id: row.stayId,
            confirmationNumber: row.confirmationNumber ?? null,
            roomNumber: row.roomNumber ?? null
          }
        : null,
      guest: row.guestId
        ? {
            id: row.guestId,
            name: guestName || null,
            email: row.guestEmail ?? null,
            phone: row.guestPhone ?? null
          }
        : null,
      amountCents: row.amountCents,
      currency: row.currency,
      reasonCategory: row.reasonCategory,
      reasonText: row.reasonText,
      pmsStatus: row.pmsStatus,
      paymentStatus: row.paymentStatus,
      publicToken: row.publicToken,
      publicUrl: row.publicUrl,
      paidAt: row.paidAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
    return;
  }

  // POST /api/v1/staff/payment-links/:id/send-email - Enqueue email with payment link
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "payment-links" &&
    segments[4] &&
    segments[5] === "send-email" &&
    req.method === "POST" &&
    segments.length === 6
  ) {
    const paymentLinkId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const rows = await query(
      `
        SELECT
          pl.id,
          pl.hotel_id AS "hotelId",
          pl.amount_cents AS "amountCents",
          pl.currency,
          pl.reason_text AS "reasonText",
          pl.public_url AS "publicUrl",
          h.name AS "hotelName",
          COALESCE(NULLIF(pl.payer_email, ''), g.email) AS "toEmail",
          TRIM(COALESCE(g.first_name, '') || ' ' || COALESCE(g.last_name, '')) AS "guestName"
        FROM payment_links pl
        JOIN hotels h ON h.id = pl.hotel_id
        LEFT JOIN guests g ON g.id = pl.guest_id
        WHERE pl.id = $1 AND pl.hotel_id = $2
        LIMIT 1
      `,
      [paymentLinkId, principal.hotelId]
    );

    const row = rows[0] ?? null;
    if (!row) {
      sendJson(res, 404, { error: "payment_link_not_found" });
      return;
    }

    const toAddress = typeof row.toEmail === "string" ? row.toEmail.trim() : "";
    if (!toAddress) {
      sendJson(res, 400, { error: "missing_contact_info" });
      return;
    }

    const guestName = typeof row.guestName === "string" ? row.guestName.trim() : "";
    const formattedAmount = `${(row.amountCents / 100).toFixed(2)} ${row.currency}`;
    const subject = `Payment link • ${row.hotelName}`;
    const bodyText = [
      `Hello${guestName ? ` ${guestName}` : ""},`,
      "",
      "Please use the link below to complete your payment.",
      "",
      row.reasonText ? `Reason: ${row.reasonText}` : null,
      `Amount: ${formattedAmount}`,
      "",
      row.publicUrl,
      "",
      "MyStay"
    ]
      .filter(Boolean)
      .join("\n");

    const outbox = await enqueueEmailOutbox({
      hotelId: row.hotelId,
      toAddress,
      subject,
      bodyText,
      payload: { type: "payment_link", paymentLinkId: row.id }
    });

    sendJson(res, 200, { ok: true, outbox });
    return;
  }

  // POST /api/v1/staff/payment-links/:id/send-message - Post link into a guest thread
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "payment-links" &&
    segments[4] &&
    segments[5] === "send-message" &&
    req.method === "POST" &&
    segments.length === 6
  ) {
    const paymentLinkId = decodeURIComponent(segments[4]);
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const rows = await query(
      `
        SELECT
          pl.id,
          pl.hotel_id AS "hotelId",
          pl.stay_id AS "stayId",
          pl.amount_cents AS "amountCents",
          pl.currency,
          pl.reason_text AS "reasonText",
          pl.public_url AS "publicUrl"
        FROM payment_links pl
        WHERE pl.id = $1 AND pl.hotel_id = $2
        LIMIT 1
      `,
      [paymentLinkId, principal.hotelId]
    );

    const row = rows[0] ?? null;
    if (!row) {
      sendJson(res, 404, { error: "payment_link_not_found" });
      return;
    }

    if (!row.stayId) {
      sendJson(res, 400, { error: "missing_stay" });
      return;
    }

	    const canSeeAllDepartments = principal.role === "admin" || principal.role === "manager";
	    const allowedDepartments = Array.isArray(principal.departments)
	      ? principal.departments.filter((dept) => typeof dept === "string").map((dept) => dept.trim()).filter(Boolean)
	      : [];

    if (!canSeeAllDepartments && allowedDepartments.length === 0) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const existingThreads = await query(
      `
        SELECT id, department
        FROM threads
        WHERE hotel_id = $1 AND stay_id = $2 AND status <> 'archived'
        ${canSeeAllDepartments ? "" : "AND department = ANY($3::text[])"}
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      canSeeAllDepartments ? [row.hotelId, row.stayId] : [row.hotelId, row.stayId, allowedDepartments]
    );

    let threadId = existingThreads[0]?.id ?? null;
    let department = existingThreads[0]?.department ?? null;

    if (!threadId) {
      if (canSeeAllDepartments) department = "reception";
      else if (allowedDepartments.includes("reception")) department = "reception";
      else department = allowedDepartments[0] ?? "reception";

      threadId = `TH-${randomUUID().slice(0, 8).toUpperCase()}`;
      await query(
        `
          INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'pending', 'Payment link', NOW(), NOW())
        `,
        [threadId, row.hotelId, row.stayId, department]
      );

      try {
        await emitRealtimeEvent({
          type: "thread_created",
          hotelId: row.hotelId,
          threadId,
          stayId: row.stayId,
          department,
          status: "pending"
        });
      } catch (error) {
        console.error("realtime_emit_failed", error);
      }
    }

    const formattedAmount = `${(row.amountCents / 100).toFixed(2)} ${row.currency}`;
    const bodyText = [
      "Here is your payment link:",
      "",
      row.reasonText ? `Reason: ${row.reasonText}` : null,
      `Amount: ${formattedAmount}`,
      "",
      row.publicUrl
    ]
      .filter(Boolean)
      .join("\n");

    const messageId = `M-${randomUUID().slice(0, 8).toUpperCase()}`;
    const senderName = principal.displayName ?? "Staff";

    await query(
      `
        INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
        VALUES ($1, $2, 'staff', $3, $4, $5::jsonb, NOW())
      `,
      [messageId, threadId, senderName, bodyText, JSON.stringify({ type: "payment_link", paymentLinkId: row.id })]
    );

    await query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [threadId]);

    try {
      await emitRealtimeEvent({
        type: "message_created",
        hotelId: row.hotelId,
        threadId,
        messageId,
        department: department ?? "reception"
      });
    } catch (error) {
      console.error("realtime_emit_failed", error);
    }

    sendJson(res, 200, { ok: true, threadId, messageId });
    return;
  }

  // GET /api/v1/staff/responses - Get predefined responses for staff
  if (url.pathname === "/api/v1/staff/responses" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const department = url.searchParams.get("department");

    const where = ["hotel_id = $1", "is_active = TRUE"];
    const params = [principal.hotelId];

    if (department) {
      params.push(department);
      where.push(`department = $${params.length}`);
    } else if (principal.role !== "admin" && Array.isArray(principal.departments)) {
      params.push(principal.departments);
      where.push(`department = ANY($${params.length}::text[])`);
    }

    const responses = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          department,
          service_item_id AS "serviceItemId",
          name,
          content_key AS "contentKey",
          content_default AS "contentDefault",
          variables,
          sort_order AS "sortOrder"
        FROM predefined_responses
        WHERE ${where.join(" AND ")}
        ORDER BY department, sort_order ASC, name ASC
      `,
      params
    );

    sendJson(res, 200, { responses });
    return;
  }

  // =====================================================
  // STAFF: AUDIENCE & CRM (AeroGuest-inspired)
  // =====================================================

  // GET /api/v1/staff/audience?from=&to=&search=&page=&pageSize=
  if (url.pathname === "/api/v1/staff/audience" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const fromRaw = url.searchParams.get("from");
    const from = parseIsoDate(fromRaw);
    if (fromRaw && !from) {
      sendJson(res, 400, { error: "invalid_from" });
      return;
    }

    const toRaw = url.searchParams.get("to");
    const to = parseIsoDate(toRaw);
    if (toRaw && !to) {
      sendJson(res, 400, { error: "invalid_to" });
      return;
    }

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";

    const page = Math.min(500, parsePositiveInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, parsePositiveInt(url.searchParams.get("pageSize"), 25));
    const offset = (page - 1) * pageSize;

    const statsRows = await query(
      `
        SELECT
          SUM(CASE WHEN status = 'opted_in' THEN 1 ELSE 0 END)::int AS "totalContacts",
          SUM(
            CASE
              WHEN status = 'opted_in' AND COALESCE(status_at, created_at) >= date_trunc('week', NOW())
                THEN 1
              ELSE 0
            END
          )::int AS "optedInThisWeek",
          SUM(
            CASE
              WHEN status = 'skipped' AND COALESCE(status_at, created_at) >= date_trunc('week', NOW())
                THEN 1
              ELSE 0
            END
          )::int AS "skippedThisWeek"
        FROM audience_contacts
        WHERE hotel_id = $1
      `,
      [principal.hotelId]
    );

    const syncRows = await query(
      `
        SELECT
          finished_at AS "syncedAt"
        FROM pms_sync_runs
        WHERE hotel_id = $1 AND status = 'ok' AND finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 1
      `,
      [principal.hotelId]
    );

    const where = ["hotel_id = $1", "status = 'opted_in'"];
    const params = [principal.hotelId];

    if (from) {
      params.push(from);
      where.push(`COALESCE(status_at, created_at) >= $${params.length}::date`);
    }

    if (to) {
      params.push(to);
      where.push(`COALESCE(status_at, created_at) < ($${params.length}::date + INTERVAL '1 day')`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(
        `(
          LOWER(name) LIKE $${params.length}
          OR LOWER(COALESCE(email, '')) LIKE $${params.length}
        )`
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const rows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          guest_id AS "guestId",
          status,
          status_at AS "statusAt",
          name,
          email,
          phone,
          channel,
          synced_with_pms AS "syncedWithPms",
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          COUNT(*) OVER()::int AS "total"
        FROM audience_contacts
        ${whereSql}
        ORDER BY COALESCE(status_at, created_at) DESC, name ASC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `,
      [...params, pageSize, offset]
    );

    const total = typeof rows[0]?.total === "number" ? rows[0].total : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const items = rows.map((row) => {
      const { total: _ignored, ...rest } = row;
      return rest;
    });

    const stats = statsRows[0] ?? { totalContacts: 0, optedInThisWeek: 0, skippedThisWeek: 0 };
    const syncedAt = syncRows[0]?.syncedAt ?? null;

    sendJson(res, 200, { stats: { ...stats, syncedAt }, items, page, pageSize, total, totalPages });
    return;
  }

  // GET /api/v1/staff/audience/export?from=&to=&search=
  if (url.pathname === "/api/v1/staff/audience/export" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const fromRaw = url.searchParams.get("from");
    const from = parseIsoDate(fromRaw);
    if (fromRaw && !from) {
      sendJson(res, 400, { error: "invalid_from" });
      return;
    }

    const toRaw = url.searchParams.get("to");
    const to = parseIsoDate(toRaw);
    if (toRaw && !to) {
      sendJson(res, 400, { error: "invalid_to" });
      return;
    }

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";

    const where = ["hotel_id = $1", "status = 'opted_in'"];
    const params = [principal.hotelId];

    if (from) {
      params.push(from);
      where.push(`COALESCE(status_at, created_at) >= $${params.length}::date`);
    }

    if (to) {
      params.push(to);
      where.push(`COALESCE(status_at, created_at) < ($${params.length}::date + INTERVAL '1 day')`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(
        `(
          LOWER(name) LIKE $${params.length}
          OR LOWER(COALESCE(email, '')) LIKE $${params.length}
        )`
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await query(
      `
        SELECT
          COALESCE(status_at, created_at) AS "optInDate",
          name,
          email,
          channel,
          synced_with_pms AS "syncedWithPms",
          status
        FROM audience_contacts
        ${whereSql}
        ORDER BY COALESCE(status_at, created_at) DESC, name ASC
      `,
      params
    );

    const header = ["opt_in_date", "name", "email", "channel", "synced_with_pms", "status"];
    const lines = [header.join(",")];

    for (const row of rows) {
      const values = [
        row.optInDate ? new Date(row.optInDate).toISOString() : "",
        row.name ?? "",
        row.email ?? "",
        row.channel ?? "",
        row.syncedWithPms ? "yes" : "no",
        row.status ?? ""
      ];
      lines.push(values.map(csvEscape).join(","));
    }

    const filename = `audience-${principal.hotelId}-${new Date().toISOString().slice(0, 10)}.csv`;
    sendText(res, 200, `${lines.join("\n")}\n`, {
      contentType: "text/csv; charset=utf-8",
      headers: { "Content-Disposition": `attachment; filename="${filename}"` }
    });
    return;
  }

  // GET /api/v1/staff/signup-forms - list signup forms for hotel
  if (url.pathname === "/api/v1/staff/signup-forms" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const forms = await query(
      `
        SELECT
          f.id,
          f.hotel_id AS "hotelId",
          f.name,
          f.description,
          f.channel,
          f.status,
          f.config,
          f.created_by_staff_user_id AS "createdByStaffUserId",
          COALESCE(su.display_name, su.email) AS "createdBy",
          f.created_at AS "createdAt",
          f.updated_at AS "updatedAt"
        FROM signup_forms f
        LEFT JOIN staff_users su ON su.id = f.created_by_staff_user_id
        WHERE f.hotel_id = $1
        ORDER BY f.updated_at DESC, f.name ASC
      `,
      [principal.hotelId]
    );

    sendJson(res, 200, { items: forms });
    return;
  }

  // POST /api/v1/staff/signup-forms - create signup form (manager/admin only)
  if (url.pathname === "/api/v1/staff/signup-forms" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      sendJson(res, 400, { error: "missing_name" });
      return;
    }

    const description = typeof body.description === "string" ? body.description.trim() : null;
    const channel = typeof body.channel === "string" ? body.channel.trim() : "";
    if (!channel) {
      sendJson(res, 400, { error: "missing_channel" });
      return;
    }

    const status = typeof body.status === "string" ? body.status.trim() : "active";
    if (!["active", "archived"].includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: ["active", "archived"] });
      return;
    }

    const config = body.config === undefined ? {} : body.config;

    const id = `SF-${randomUUID().slice(0, 8).toUpperCase()}`;

    const rows = await query(
      `
        INSERT INTO signup_forms (
          id,
          hotel_id,
          name,
          description,
          channel,
          status,
          config,
          created_by_staff_user_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          channel,
          status,
          config,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, principal.hotelId, name, description, channel, status, JSON.stringify(config ?? {}), principal.staffUserId]
    );

    sendJson(res, 201, { signupForm: rows[0] });
    return;
  }

  // PATCH /api/v1/staff/signup-forms/:id - update signup form (manager/admin only)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/staff\/signup-forms\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const formId = url.pathname.split("/").pop();
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [formId, principal.hotelId];

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        sendJson(res, 400, { error: "invalid_name" });
        return;
      }
      params.push(name);
      updates.push(`name = $${params.length}`);
    }

    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : null;
      params.push(description);
      updates.push(`description = $${params.length}`);
    }

    if (body.channel !== undefined) {
      const channel = typeof body.channel === "string" ? body.channel.trim() : "";
      if (!channel) {
        sendJson(res, 400, { error: "invalid_channel" });
        return;
      }
      params.push(channel);
      updates.push(`channel = $${params.length}`);
    }

    if (body.status !== undefined) {
      const status = typeof body.status === "string" ? body.status.trim() : "";
      if (!["active", "archived"].includes(status)) {
        sendJson(res, 400, { error: "invalid_status", allowed: ["active", "archived"] });
        return;
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (body.config !== undefined) {
      params.push(JSON.stringify(body.config ?? {}));
      updates.push(`config = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    updates.push(`updated_at = NOW()`);

    const rows = await query(
      `
        UPDATE signup_forms
        SET ${updates.join(", ")}
        WHERE id = $1 AND hotel_id = $2
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          channel,
          status,
          config,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      params
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "signup_form_not_found" });
      return;
    }

    sendJson(res, 200, { signupForm: rows[0] });
    return;
  }

  // DELETE /api/v1/staff/signup-forms/:id - delete signup form (manager/admin only)
  if (req.method === "DELETE" && url.pathname.match(/^\/api\/v1\/staff\/signup-forms\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const formId = url.pathname.split("/").pop();
    const rows = await query(`DELETE FROM signup_forms WHERE id = $1 AND hotel_id = $2 RETURNING id`, [formId, principal.hotelId]);
    if (rows.length === 0) {
      sendJson(res, 404, { error: "signup_form_not_found" });
      return;
    }

    sendJson(res, 200, { ok: true });
    return;
  }

  // GET /api/v1/staff/hotel-directory - fetch hotel directory draft + published docs
  if (url.pathname === "/api/v1/staff/hotel-directory" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    await query(
      `
        INSERT INTO hotel_directory_pages (hotel_id)
        VALUES ($1)
        ON CONFLICT (hotel_id) DO NOTHING
      `,
      [principal.hotelId]
    );

    const rows = await query(
      `
        SELECT
          hotel_id AS "hotelId",
          draft,
          published,
          draft_saved_at AS "draftSavedAt",
          published_at AS "publishedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM hotel_directory_pages
        WHERE hotel_id = $1
        LIMIT 1
      `,
      [principal.hotelId]
    );

    sendJson(res, 200, { page: rows[0] ?? null });
    return;
  }

  // PATCH /api/v1/staff/hotel-directory - save draft / publish / restore (manager/admin only)
  if (url.pathname === "/api/v1/staff/hotel-directory" && req.method === "PATCH") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const action = typeof body.action === "string" ? body.action.trim() : "";
    const allowedActions = ["save_draft", "publish", "restore_published_to_draft"];
    if (!action || !allowedActions.includes(action)) {
      sendJson(res, 400, { error: "invalid_action", allowed: allowedActions });
      return;
    }

    const document = body.document;
    if (action !== "restore_published_to_draft") {
      if (!document || typeof document !== "object" || Array.isArray(document)) {
        sendJson(res, 400, { error: "invalid_document" });
        return;
      }
    }

    await query(
      `
        INSERT INTO hotel_directory_pages (hotel_id)
        VALUES ($1)
        ON CONFLICT (hotel_id) DO NOTHING
      `,
      [principal.hotelId]
    );

    let updateSql = "";
    let params = [];

    if (action === "save_draft") {
      updateSql = `
        UPDATE hotel_directory_pages
        SET draft = $1::jsonb, draft_saved_at = NOW(), updated_at = NOW()
        WHERE hotel_id = $2
        RETURNING
          hotel_id AS "hotelId",
          draft,
          published,
          draft_saved_at AS "draftSavedAt",
          published_at AS "publishedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;
      params = [JSON.stringify(document ?? {}), principal.hotelId];
    } else if (action === "publish") {
      updateSql = `
        UPDATE hotel_directory_pages
        SET draft = $1::jsonb, published = $1::jsonb, draft_saved_at = NOW(), published_at = NOW(), updated_at = NOW()
        WHERE hotel_id = $2
        RETURNING
          hotel_id AS "hotelId",
          draft,
          published,
          draft_saved_at AS "draftSavedAt",
          published_at AS "publishedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;
      params = [JSON.stringify(document ?? {}), principal.hotelId];
    } else {
      updateSql = `
        UPDATE hotel_directory_pages
        SET draft = published, draft_saved_at = NOW(), updated_at = NOW()
        WHERE hotel_id = $1
        RETURNING
          hotel_id AS "hotelId",
          draft,
          published,
          draft_saved_at AS "draftSavedAt",
          published_at AS "publishedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;
      params = [principal.hotelId];
    }

    const rows = await query(updateSql, params);
    sendJson(res, 200, { page: rows[0] ?? null });
    return;
  }

  // =====================================================
  // STAFF: AUTOMATIONS & MESSAGE TEMPLATES (AeroGuest-inspired)
  // =====================================================

  // GET /api/v1/staff/automations?search=&status=&page=&pageSize=
  if (url.pathname === "/api/v1/staff/automations" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";
    const status = typeof url.searchParams.get("status") === "string" ? url.searchParams.get("status").trim().toLowerCase() : "";
    const allowedStatuses = ["active", "paused"];
    if (status && !allowedStatuses.includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
      return;
    }

    const page = Math.min(500, parsePositiveInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, parsePositiveInt(url.searchParams.get("pageSize"), 25));
    const offset = (page - 1) * pageSize;

    const where = ["a.hotel_id = $1"];
    const params = [principal.hotelId];

    if (status) {
      params.push(status);
      where.push(`a.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`LOWER(a.name) LIKE $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const rows = await query(
      `
        SELECT
          a.id,
          a.hotel_id AS "hotelId",
          a.name,
          a.description,
          a.trigger,
          a.status,
          a.config,
          a.created_by_staff_user_id AS "createdByStaffUserId",
          COALESCE(su.display_name, su.email) AS "createdBy",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          COUNT(*) OVER()::int AS "total"
        FROM automations a
        LEFT JOIN staff_users su ON su.id = a.created_by_staff_user_id
        ${whereSql}
        ORDER BY a.updated_at DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `,
      [...params, pageSize, offset]
    );

    const total = typeof rows[0]?.total === "number" ? rows[0].total : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const items = rows.map((row) => {
      const { total: _ignored, ...rest } = row;
      return rest;
    });

    sendJson(res, 200, { items, page, pageSize, total, totalPages });
    return;
  }

  // GET /api/v1/staff/automations/:id - automation details
  if (req.method === "GET" && url.pathname.match(/^\/api\/v1\/staff\/automations\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const automationId = url.pathname.split("/").pop();
    const rows = await query(
      `
        SELECT
          a.id,
          a.hotel_id AS "hotelId",
          a.name,
          a.description,
          a.trigger,
          a.status,
          a.config,
          a.created_by_staff_user_id AS "createdByStaffUserId",
          COALESCE(su.display_name, su.email) AS "createdBy",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt"
        FROM automations a
        LEFT JOIN staff_users su ON su.id = a.created_by_staff_user_id
        WHERE a.id = $1 AND a.hotel_id = $2
        LIMIT 1
      `,
      [automationId, principal.hotelId]
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "automation_not_found" });
      return;
    }

    sendJson(res, 200, { automation: rows[0] });
    return;
  }

  // POST /api/v1/staff/automations - create automation (manager/admin)
  if (url.pathname === "/api/v1/staff/automations" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      sendJson(res, 400, { error: "missing_name" });
      return;
    }

    const trigger = typeof body.trigger === "string" ? body.trigger.trim() : "";
    if (!trigger) {
      sendJson(res, 400, { error: "missing_trigger" });
      return;
    }

    const description = typeof body.description === "string" ? body.description.trim() : null;
    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "active";
    const allowedStatuses = ["active", "paused"];
    if (!allowedStatuses.includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
      return;
    }

    const config = body.config === undefined ? {} : body.config;
    if (config !== null && (typeof config !== "object" || Array.isArray(config))) {
      sendJson(res, 400, { error: "invalid_config" });
      return;
    }

    const id = `AU-${randomUUID().slice(0, 8).toUpperCase()}`;

    const rows = await query(
      `
        INSERT INTO automations (
          id,
          hotel_id,
          name,
          description,
          trigger,
          status,
          config,
          created_by_staff_user_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          trigger,
          status,
          config,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, principal.hotelId, name, description, trigger, status, JSON.stringify(config ?? {}), principal.staffUserId]
    );

    sendJson(res, 201, { automation: rows[0] });
    return;
  }

  // PATCH /api/v1/staff/automations/:id - update automation (manager/admin)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/staff\/automations\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const automationId = url.pathname.split("/").pop();
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [automationId, principal.hotelId];

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        sendJson(res, 400, { error: "invalid_name" });
        return;
      }
      params.push(name);
      updates.push(`name = $${params.length}`);
    }

    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : null;
      params.push(description);
      updates.push(`description = $${params.length}`);
    }

    if (body.trigger !== undefined) {
      const trigger = typeof body.trigger === "string" ? body.trigger.trim() : "";
      if (!trigger) {
        sendJson(res, 400, { error: "invalid_trigger" });
        return;
      }
      params.push(trigger);
      updates.push(`trigger = $${params.length}`);
    }

    if (body.status !== undefined) {
      const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
      const allowedStatuses = ["active", "paused"];
      if (!allowedStatuses.includes(status)) {
        sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
        return;
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (body.config !== undefined) {
      if (body.config !== null && (typeof body.config !== "object" || Array.isArray(body.config))) {
        sendJson(res, 400, { error: "invalid_config" });
        return;
      }
      params.push(JSON.stringify(body.config ?? {}));
      updates.push(`config = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    updates.push(`updated_at = NOW()`);

    const rows = await query(
      `
        UPDATE automations
        SET ${updates.join(", ")}
        WHERE id = $1 AND hotel_id = $2
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          trigger,
          status,
          config,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      params
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "automation_not_found" });
      return;
    }

    sendJson(res, 200, { automation: rows[0] });
    return;
  }

  // PATCH /api/v1/staff/automations/:id/toggle - enable/disable automation (manager/admin)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/staff\/automations\/[^/]+\/toggle$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const pathParts = url.pathname.split("/");
    const automationId = pathParts[5];

    const rows = await query(
      `
        UPDATE automations
        SET status = CASE WHEN status = 'active' THEN 'paused' ELSE 'active' END,
            updated_at = NOW()
        WHERE id = $1 AND hotel_id = $2
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          trigger,
          status,
          updated_at AS "updatedAt"
      `,
      [automationId, principal.hotelId]
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "automation_not_found" });
      return;
    }

    sendJson(res, 200, { automation: rows[0] });
    return;
  }

  // GET /api/v1/staff/message-templates?search=&status=&channel=&page=&pageSize=
  if (url.pathname === "/api/v1/staff/message-templates" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";
    const status = typeof url.searchParams.get("status") === "string" ? url.searchParams.get("status").trim().toLowerCase() : "";
    const channel = typeof url.searchParams.get("channel") === "string" ? url.searchParams.get("channel").trim().toLowerCase() : "";

    const allowedStatuses = ["draft", "published", "archived"];
    if (status && !allowedStatuses.includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
      return;
    }

    const allowedChannels = ["email", "sms", "app"];
    if (channel && !allowedChannels.includes(channel)) {
      sendJson(res, 400, { error: "invalid_channel", allowed: allowedChannels });
      return;
    }

    const page = Math.min(500, parsePositiveInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, parsePositiveInt(url.searchParams.get("pageSize"), 25));
    const offset = (page - 1) * pageSize;

    const where = ["t.hotel_id = $1"];
    const params = [principal.hotelId];

    if (status) {
      params.push(status);
      where.push(`t.status = $${params.length}`);
    }

    if (channel) {
      params.push(channel);
      where.push(`t.channel = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`LOWER(t.name) LIKE $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const rows = await query(
      `
        SELECT
          t.id,
          t.hotel_id AS "hotelId",
          t.name,
          t.description,
          t.channel,
          t.status,
          t.content,
          t.created_by_staff_user_id AS "createdByStaffUserId",
          COALESCE(su.display_name, su.email) AS "createdBy",
          t.created_at AS "createdAt",
          t.updated_at AS "updatedAt",
          COUNT(*) OVER()::int AS "total"
        FROM message_templates t
        LEFT JOIN staff_users su ON su.id = t.created_by_staff_user_id
        ${whereSql}
        ORDER BY t.updated_at DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `,
      [...params, pageSize, offset]
    );

    const total = typeof rows[0]?.total === "number" ? rows[0].total : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const items = rows.map((row) => {
      const { total: _ignored, ...rest } = row;
      return rest;
    });

    sendJson(res, 200, { items, page, pageSize, total, totalPages });
    return;
  }

  // GET /api/v1/staff/message-templates/:id - template detail
  if (req.method === "GET" && url.pathname.match(/^\/api\/v1\/staff\/message-templates\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const templateId = url.pathname.split("/").pop();
    const rows = await query(
      `
        SELECT
          t.id,
          t.hotel_id AS "hotelId",
          t.name,
          t.description,
          t.channel,
          t.status,
          t.content,
          t.created_by_staff_user_id AS "createdByStaffUserId",
          COALESCE(su.display_name, su.email) AS "createdBy",
          t.created_at AS "createdAt",
          t.updated_at AS "updatedAt"
        FROM message_templates t
        LEFT JOIN staff_users su ON su.id = t.created_by_staff_user_id
        WHERE t.id = $1 AND t.hotel_id = $2
        LIMIT 1
      `,
      [templateId, principal.hotelId]
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "message_template_not_found" });
      return;
    }

    sendJson(res, 200, { template: rows[0] });
    return;
  }

  // POST /api/v1/staff/message-templates - create template (manager/admin)
  if (url.pathname === "/api/v1/staff/message-templates" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      sendJson(res, 400, { error: "missing_name" });
      return;
    }

    const channel = typeof body.channel === "string" ? body.channel.trim().toLowerCase() : "";
    const allowedChannels = ["email", "sms", "app"];
    if (!allowedChannels.includes(channel)) {
      sendJson(res, 400, { error: "invalid_channel", allowed: allowedChannels });
      return;
    }

    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "draft";
    const allowedStatuses = ["draft", "published", "archived"];
    if (!allowedStatuses.includes(status)) {
      sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
      return;
    }

    const description = typeof body.description === "string" ? body.description.trim() : null;
    const content = body.content === undefined ? {} : body.content;
    if (content !== null && (typeof content !== "object" || Array.isArray(content))) {
      sendJson(res, 400, { error: "invalid_content" });
      return;
    }

    const id = `MT-${randomUUID().slice(0, 8).toUpperCase()}`;

    const rows = await query(
      `
        INSERT INTO message_templates (
          id,
          hotel_id,
          name,
          description,
          channel,
          status,
          content,
          created_by_staff_user_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          channel,
          status,
          content,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, principal.hotelId, name, description, channel, status, JSON.stringify(content ?? {}), principal.staffUserId]
    );

    sendJson(res, 201, { template: rows[0] });
    return;
  }

  // PATCH /api/v1/staff/message-templates/:id - update template (manager/admin)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/staff\/message-templates\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const templateId = url.pathname.split("/").pop();
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [templateId, principal.hotelId];

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        sendJson(res, 400, { error: "invalid_name" });
        return;
      }
      params.push(name);
      updates.push(`name = $${params.length}`);
    }

    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : null;
      params.push(description);
      updates.push(`description = $${params.length}`);
    }

    if (body.channel !== undefined) {
      const channel = typeof body.channel === "string" ? body.channel.trim().toLowerCase() : "";
      const allowedChannels = ["email", "sms", "app"];
      if (!allowedChannels.includes(channel)) {
        sendJson(res, 400, { error: "invalid_channel", allowed: allowedChannels });
        return;
      }
      params.push(channel);
      updates.push(`channel = $${params.length}`);
    }

    if (body.status !== undefined) {
      const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
      const allowedStatuses = ["draft", "published", "archived"];
      if (!allowedStatuses.includes(status)) {
        sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
        return;
      }
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (body.content !== undefined) {
      if (body.content !== null && (typeof body.content !== "object" || Array.isArray(body.content))) {
        sendJson(res, 400, { error: "invalid_content" });
        return;
      }
      params.push(JSON.stringify(body.content ?? {}));
      updates.push(`content = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    updates.push(`updated_at = NOW()`);

    const rows = await query(
      `
        UPDATE message_templates
        SET ${updates.join(", ")}
        WHERE id = $1 AND hotel_id = $2
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          channel,
          status,
          content,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      params
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "message_template_not_found" });
      return;
    }

    sendJson(res, 200, { template: rows[0] });
    return;
  }

  // PATCH /api/v1/staff/message-templates/:id/archive - archive template (manager/admin)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/staff\/message-templates\/[^/]+\/archive$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const pathParts = url.pathname.split("/");
    const templateId = pathParts[5];

    const rows = await query(
      `
        UPDATE message_templates
        SET status = 'archived', updated_at = NOW()
        WHERE id = $1 AND hotel_id = $2
        RETURNING id, hotel_id AS "hotelId", status, updated_at AS "updatedAt"
      `,
      [templateId, principal.hotelId]
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "message_template_not_found" });
      return;
    }

    sendJson(res, 200, { template: rows[0] });
    return;
  }

  // POST /api/v1/staff/message-templates/:id/duplicate - duplicate template (manager/admin)
  if (req.method === "POST" && url.pathname.match(/^\/api\/v1\/staff\/message-templates\/[^/]+\/duplicate$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const pathParts = url.pathname.split("/");
    const templateId = pathParts[5];

    const rows = await query(
      `
        SELECT
          name,
          description,
          channel,
          status,
          content
        FROM message_templates
        WHERE id = $1 AND hotel_id = $2
        LIMIT 1
      `,
      [templateId, principal.hotelId]
    );

    const template = rows[0] ?? null;
    if (!template) {
      sendJson(res, 404, { error: "message_template_not_found" });
      return;
    }

    const id = `MT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const name = typeof template.name === "string" ? `Copy of ${template.name}` : "Copy";

    const inserted = await query(
      `
        INSERT INTO message_templates (
          id,
          hotel_id,
          name,
          description,
          channel,
          status,
          content,
          created_by_staff_user_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          name,
          description,
          channel,
          status,
          content,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        id,
        principal.hotelId,
        name,
        template.description ?? null,
        template.channel,
        template.status,
        JSON.stringify(template.content ?? {}),
        principal.staffUserId
      ]
    );

    sendJson(res, 201, { template: inserted[0] });
    return;
  }

  // =====================================================
  // STAFF: UPSELL SERVICES (AeroGuest-inspired)
  // =====================================================

  // GET /api/v1/staff/upsell-services
  if (url.pathname === "/api/v1/staff/upsell-services" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const search = typeof url.searchParams.get("search") === "string" ? url.searchParams.get("search").trim() : "";
    const category = typeof url.searchParams.get("category") === "string" ? url.searchParams.get("category").trim() : "";

    const where = ["hotel_id = $1"];
    const params = [principal.hotelId];

    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`(LOWER(name) LIKE $${params.length} OR LOWER(category) LIKE $${params.length})`);
    }

    const rows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          category,
          name,
          touchpoint,
          price_cents AS "priceCents",
          currency,
          availability_weekdays AS "availabilityWeekdays",
          enabled,
          sort_order AS "sortOrder",
          description,
          image_url AS "imageUrl",
          time_slots AS "timeSlots",
          bookable,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM upsell_services
        WHERE ${where.join(" AND ")}
        ORDER BY category ASC, sort_order ASC, name ASC
      `,
      params
    );

    sendJson(res, 200, { items: rows });
    return;
  }

  // GET /api/v1/staff/upsell-services/:id
  if (req.method === "GET" && url.pathname.match(/^\/api\/v1\/staff\/upsell-services\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

    const serviceId = url.pathname.split("/").pop();
    const rows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          category,
          name,
          touchpoint,
          price_cents AS "priceCents",
          currency,
          availability_weekdays AS "availabilityWeekdays",
          enabled,
          sort_order AS "sortOrder",
          description,
          image_url AS "imageUrl",
          time_slots AS "timeSlots",
          bookable,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM upsell_services
        WHERE id = $1 AND hotel_id = $2
        LIMIT 1
      `,
      [serviceId, principal.hotelId]
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "upsell_service_not_found" });
      return;
    }

    sendJson(res, 200, { service: rows[0] });
    return;
  }

  // POST /api/v1/staff/upsell-services - create service (manager/admin)
  if (url.pathname === "/api/v1/staff/upsell-services" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const category = typeof body.category === "string" ? body.category.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!category || !name) {
      sendJson(res, 400, { error: "missing_fields", required: ["category", "name"] });
      return;
    }

    const touchpoint = typeof body.touchpoint === "string" ? body.touchpoint.trim().toLowerCase() : "";
    const allowedTouchpoints = ["before_stay", "during_stay", "before_and_during"];
    if (!allowedTouchpoints.includes(touchpoint)) {
      sendJson(res, 400, { error: "invalid_touchpoint", allowed: allowedTouchpoints });
      return;
    }

    const priceCents = typeof body.priceCents === "number" ? Math.floor(body.priceCents) : Number(body.priceCents);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      sendJson(res, 400, { error: "invalid_price_cents" });
      return;
    }

    const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "EUR";
    if (!currency) {
      sendJson(res, 400, { error: "invalid_currency" });
      return;
    }

    const allowedWeekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const availabilityWeekdays = Array.isArray(body.availabilityWeekdays)
      ? body.availabilityWeekdays.filter((day) => typeof day === "string").map((day) => day.trim().toLowerCase()).filter((day) => allowedWeekdays.includes(day))
      : [];

    const enabled = body.enabled === undefined ? true : Boolean(body.enabled);
    const sortOrder = body.sortOrder === undefined ? 0 : Number(body.sortOrder);
    const safeSortOrder = Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0;

    const description = typeof body.description === "string" ? body.description.trim() : null;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : null;
    const timeSlots = Array.isArray(body.timeSlots) ? body.timeSlots.filter((s) => typeof s === "string").map((s) => s.trim()) : [];
    const bookable = Boolean(body.bookable);

    const id = `US-${randomUUID().slice(0, 8).toUpperCase()}`;

    const rows = await query(
      `
        INSERT INTO upsell_services (
          id,
          hotel_id,
          category,
          name,
          touchpoint,
          price_cents,
          currency,
          availability_weekdays,
          enabled,
          sort_order,
          description,
          image_url,
          time_slots,
          bookable,
          created_by_staff_user_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11, $12, $13::text[], $14, $15, NOW(), NOW())
        RETURNING
          id,
          hotel_id AS "hotelId",
          category,
          name,
          touchpoint,
          price_cents AS "priceCents",
          currency,
          availability_weekdays AS "availabilityWeekdays",
          enabled,
          sort_order AS "sortOrder",
          description,
          image_url AS "imageUrl",
          time_slots AS "timeSlots",
          bookable,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, principal.hotelId, category, name, touchpoint, priceCents, currency, availabilityWeekdays, enabled, safeSortOrder, description, imageUrl, timeSlots, bookable, principal.staffUserId]
    );

    sendJson(res, 201, { service: rows[0] });
    return;
  }

  // PATCH /api/v1/staff/upsell-services/:id - update service (manager/admin)
  if (req.method === "PATCH" && url.pathname.match(/^\/api\/v1\/staff\/upsell-services\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const serviceId = url.pathname.split("/").pop();
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const updates = [];
    const params = [serviceId, principal.hotelId];

    if (body.category !== undefined) {
      const category = typeof body.category === "string" ? body.category.trim() : "";
      if (!category) {
        sendJson(res, 400, { error: "invalid_category" });
        return;
      }
      params.push(category);
      updates.push(`category = $${params.length}`);
    }

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        sendJson(res, 400, { error: "invalid_name" });
        return;
      }
      params.push(name);
      updates.push(`name = $${params.length}`);
    }

    if (body.touchpoint !== undefined) {
      const touchpoint = typeof body.touchpoint === "string" ? body.touchpoint.trim().toLowerCase() : "";
      const allowedTouchpoints = ["before_stay", "during_stay", "before_and_during"];
      if (!allowedTouchpoints.includes(touchpoint)) {
        sendJson(res, 400, { error: "invalid_touchpoint", allowed: allowedTouchpoints });
        return;
      }
      params.push(touchpoint);
      updates.push(`touchpoint = $${params.length}`);
    }

    if (body.priceCents !== undefined) {
      const priceCents = typeof body.priceCents === "number" ? Math.floor(body.priceCents) : Number(body.priceCents);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        sendJson(res, 400, { error: "invalid_price_cents" });
        return;
      }
      params.push(priceCents);
      updates.push(`price_cents = $${params.length}`);
    }

    if (body.currency !== undefined) {
      const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
      if (!currency) {
        sendJson(res, 400, { error: "invalid_currency" });
        return;
      }
      params.push(currency);
      updates.push(`currency = $${params.length}`);
    }

    if (body.availabilityWeekdays !== undefined) {
      const allowedWeekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const availabilityWeekdays = Array.isArray(body.availabilityWeekdays)
        ? body.availabilityWeekdays.filter((day) => typeof day === "string").map((day) => day.trim().toLowerCase()).filter((day) => allowedWeekdays.includes(day))
        : [];
      params.push(availabilityWeekdays);
      updates.push(`availability_weekdays = $${params.length}::text[]`);
    }

    if (body.enabled !== undefined) {
      params.push(Boolean(body.enabled));
      updates.push(`enabled = $${params.length}`);
    }

    if (body.sortOrder !== undefined) {
      const sortOrder = Number(body.sortOrder);
      const safeSortOrder = Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0;
      params.push(safeSortOrder);
      updates.push(`sort_order = $${params.length}`);
    }

    if (body.description !== undefined) {
      const desc = typeof body.description === "string" ? body.description.trim() : null;
      params.push(desc || null);
      updates.push(`description = $${params.length}`);
    }

    if (body.imageUrl !== undefined) {
      const imgUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : null;
      params.push(imgUrl || null);
      updates.push(`image_url = $${params.length}`);
    }

    if (body.timeSlots !== undefined) {
      const ts = Array.isArray(body.timeSlots) ? body.timeSlots.filter((s) => typeof s === "string").map((s) => s.trim()) : [];
      params.push(ts);
      updates.push(`time_slots = $${params.length}::text[]`);
    }

    if (body.bookable !== undefined) {
      params.push(Boolean(body.bookable));
      updates.push(`bookable = $${params.length}`);
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_fields_to_update" });
      return;
    }

    updates.push(`updated_at = NOW()`);

    const rows = await query(
      `
        UPDATE upsell_services
        SET ${updates.join(", ")}
        WHERE id = $1 AND hotel_id = $2
        RETURNING
          id,
          hotel_id AS "hotelId",
          category,
          name,
          touchpoint,
          price_cents AS "priceCents",
          currency,
          availability_weekdays AS "availabilityWeekdays",
          enabled,
          sort_order AS "sortOrder",
          description,
          image_url AS "imageUrl",
          time_slots AS "timeSlots",
          bookable,
          created_by_staff_user_id AS "createdByStaffUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      params
    );

    if (rows.length === 0) {
      sendJson(res, 404, { error: "upsell_service_not_found" });
      return;
    }

    sendJson(res, 200, { service: rows[0] });
    return;
  }

  // DELETE /api/v1/staff/upsell-services/:id - delete service (manager/admin)
  if (req.method === "DELETE" && url.pathname.match(/^\/api\/v1\/staff\/upsell-services\/[^/]+$/)) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const serviceId = url.pathname.split("/").pop();
    const rows = await query(`DELETE FROM upsell_services WHERE id = $1 AND hotel_id = $2 RETURNING id`, [serviceId, principal.hotelId]);
    if (rows.length === 0) {
      sendJson(res, 404, { error: "upsell_service_not_found" });
      return;
    }

    sendJson(res, 200, { ok: true });
    return;
  }

  // GET /api/v1/analytics/dashboard - Staff analytics dashboard
  if (url.pathname === "/api/v1/analytics/dashboard" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    // Only managers and admins can see analytics
    if (principal.role !== "admin" && principal.role !== "manager") {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const department = url.searchParams.get("department");
    const dateFrom = url.searchParams.get("dateFrom") ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const dateTo = url.searchParams.get("dateTo") ?? new Date().toISOString().split("T")[0];

    // Build department filter
    const deptFilter = department
      ? "AND department = $4"
      : principal.role !== "admin" && Array.isArray(principal.departments)
        ? `AND department = ANY($4::text[])`
        : "";

    const params = [principal.hotelId, dateFrom, dateTo];
    if (department) {
      params.push(department);
    } else if (deptFilter) {
      params.push(principal.departments);
    }

    // Total tickets
    const totalTickets = await query(
      `
        SELECT COUNT(*) AS count
        FROM tickets
        WHERE hotel_id = $1
          AND created_at >= $2::date
          AND created_at <= ($3::date + INTERVAL '1 day')
          ${deptFilter}
      `,
      params
    );

    // Tickets by status
    const byStatus = await query(
      `
        SELECT status, COUNT(*) AS count
        FROM tickets
        WHERE hotel_id = $1
          AND created_at >= $2::date
          AND created_at <= ($3::date + INTERVAL '1 day')
          ${deptFilter}
        GROUP BY status
      `,
      params
    );

    // Tickets by department
    const byDepartment = await query(
      `
        SELECT department, COUNT(*) AS count
        FROM tickets
        WHERE hotel_id = $1
          AND created_at >= $2::date
          AND created_at <= ($3::date + INTERVAL '1 day')
          ${deptFilter}
        GROUP BY department
        ORDER BY count DESC
      `,
      params
    );

    // Average resolution time (completed tickets)
    const avgResolution = await query(
      `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) AS avg_minutes
        FROM tickets
        WHERE hotel_id = $1
          AND created_at >= $2::date
          AND created_at <= ($3::date + INTERVAL '1 day')
          AND status = 'completed'
          ${deptFilter}
      `,
      params
    );

    // Top service items
    const topServices = await query(
      `
        SELECT 
          t.service_item_id AS "serviceItemId",
          si.name_default AS "serviceName",
          COUNT(*) AS count
        FROM tickets t
        LEFT JOIN service_items si ON t.service_item_id = si.id
        WHERE t.hotel_id = $1
          AND t.created_at >= $2::date
          AND t.created_at <= ($3::date + INTERVAL '1 day')
          AND t.service_item_id IS NOT NULL
          ${deptFilter.replace(/department/g, 't.department')}
        GROUP BY t.service_item_id, si.name_default
        ORDER BY count DESC
        LIMIT 10
      `,
      params
    );

    // Staff performance (tickets resolved per staff)
    const staffPerformance = await query(
      `
        SELECT 
          t.assigned_staff_user_id AS "staffUserId",
          su.display_name AS "staffName",
          COUNT(*) AS "ticketsResolved",
          AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 60) AS "avgResolutionMinutes"
        FROM tickets t
        LEFT JOIN staff_users su ON t.assigned_staff_user_id = su.id
        WHERE t.hotel_id = $1
          AND t.created_at >= $2::date
          AND t.created_at <= ($3::date + INTERVAL '1 day')
          AND t.status = 'completed'
          AND t.assigned_staff_user_id IS NOT NULL
          ${deptFilter.replace(/department/g, 't.department')}
        GROUP BY t.assigned_staff_user_id, su.display_name
        ORDER BY "ticketsResolved" DESC
        LIMIT 10
      `,
      params
    );

    sendJson(res, 200, {
      period: { from: dateFrom, to: dateTo },
      totalTickets: parseInt(totalTickets[0]?.count ?? 0),
      byStatus: byStatus.reduce((acc, row) => ({ ...acc, [row.status]: parseInt(row.count) }), {}),
      byDepartment: byDepartment.map(row => ({ department: row.department, count: parseInt(row.count) })),
      avgResolutionMinutes: parseFloat(avgResolution[0]?.avg_minutes ?? 0),
      topServices: topServices.map(row => ({
        serviceItemId: row.serviceItemId,
        serviceName: row.serviceName,
        count: parseInt(row.count)
      })),
      staffPerformance: staffPerformance.map(row => ({
        staffUserId: row.staffUserId,
        staffName: row.staffName,
        ticketsResolved: parseInt(row.ticketsResolved),
        avgResolutionMinutes: parseFloat(row.avgResolutionMinutes ?? 0)
      }))
    });
    return;
  }

  if (url.pathname === "/api/v1/tickets") {
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

	    if (req.method === "GET") {
	      const where = [];
	      const params = [];

      const requestedHotelId = url.searchParams.get("hotelId");
      if (requestedHotelId && requestedHotelId.trim() && requestedHotelId.trim() !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      addEqualsFilter(where, params, "hotel_id", principal.hotelId);

	      if (principal.typ === "guest") {
	        addEqualsFilter(where, params, "stay_id", principal.stayId);
	      } else {
	        if (principal.role !== "admin" && principal.role !== "manager") {
	          if (!Array.isArray(principal.departments) || principal.departments.length === 0) {
	            sendJson(res, 200, { items: [] });
	            return;
	          }
	          params.push(principal.departments);
          where.push(`department = ANY($${params.length}::text[])`);
        }
        addEqualsFilter(where, params, "stay_id", url.searchParams.get("stayId"));
        addEqualsFilter(where, params, "department", url.searchParams.get("department"));
        addEqualsFilter(where, params, "status", url.searchParams.get("status"));
        addEqualsFilter(where, params, "room_number", url.searchParams.get("roomNumber"));
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const items = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            stay_id AS "stayId",
            room_number AS "roomNumber",
            department,
            status,
            title,
            assigned_staff_user_id AS "assignedStaffUserId",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM tickets
          ${whereClause}
          ORDER BY updated_at DESC
          LIMIT 100
        `,
        params
      );

      sendJson(res, 200, { items });
      return;
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const title = typeof body.title === "string" ? body.title.trim() : "";
      const department = typeof body.department === "string" ? body.department.trim() : "";
      const payloadJson = body.payload ? JSON.stringify(body.payload) : "{}";

      const stayId =
        principal.typ === "guest"
          ? principal.stayId
          : typeof body.stayId === "string"
            ? body.stayId.trim()
            : null;

      let roomNumber = typeof body.roomNumber === "string" ? body.roomNumber.trim() : "";
      if (!roomNumber && stayId) {
        const stays = await query(
          `
            SELECT room_number AS "roomNumber"
            FROM stays
            WHERE id = $1 AND hotel_id = $2
            LIMIT 1
          `,
          [stayId, principal.hotelId]
        );
        roomNumber = stays[0]?.roomNumber ?? "";
      }

      if (!title || !department || !roomNumber) {
        sendJson(res, 400, { error: "missing_fields", required: ["title", "department", "roomNumber"] });
        return;
      }

      const id = `T-${randomUUID().slice(0, 8).toUpperCase()}`;

      const rows = await query(
        `
          INSERT INTO tickets (
            id,
            hotel_id,
            stay_id,
            room_number,
            department,
            status,
            title,
            payload,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW())
          RETURNING
            id,
            hotel_id AS "hotelId",
            stay_id AS "stayId",
            room_number AS "roomNumber",
            department,
            status,
            title,
            assigned_staff_user_id AS "assignedStaffUserId",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [id, principal.hotelId, stayId, roomNumber, department, "pending", title, payloadJson]
      );

      const created = rows[0];
      try {
        await emitRealtimeEvent({
          type: "ticket_created",
          hotelId: principal.hotelId,
          ticketId: created.id,
          stayId: created.stayId,
          roomNumber: created.roomNumber,
          department: created.department,
          status: created.status
        });
      } catch (error) {
        console.error("realtime_emit_failed", error);
      }

      try {
        const recipients = await listStaffNotificationTargets({
          hotelId: principal.hotelId,
          department: created.department
        });
        const actorStaffUserId = principal.typ === "staff" ? principal.staffUserId : null;
        const subject = `New ticket • ${created.department} • Room ${created.roomNumber ?? "—"}`;
        const bodyText = `New ticket created.\n\n${created.title}\nTicket: ${created.id}\nRoom: ${created.roomNumber ?? "—"}\nDepartment: ${created.department}\nStatus: ${created.status}`;

        for (const recipient of recipients) {
          if (actorStaffUserId && recipient.id === actorStaffUserId) continue;
          await enqueueEmailOutbox({
            hotelId: principal.hotelId,
            toAddress: recipient.email,
            subject,
            bodyText,
            payload: { type: "ticket_created", ticketId: created.id, department: created.department }
          });
        }
      } catch (error) {
        console.error("notification_enqueue_failed", error);
      }

      sendJson(res, 201, created);
      return;
    }
  }

  if (url.pathname === "/api/v1/threads") {
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    if (req.method === "GET") {
      const where = [];
      const params = [];

      const requestedHotelId = url.searchParams.get("hotelId");
      if (requestedHotelId && requestedHotelId.trim() && requestedHotelId.trim() !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      addEqualsFilter(where, params, "t.hotel_id", principal.hotelId);

	      if (principal.typ === "guest") {
	        addEqualsFilter(where, params, "t.stay_id", principal.stayId);
	      } else {
	        if (principal.role !== "admin" && principal.role !== "manager") {
	          if (!Array.isArray(principal.departments) || principal.departments.length === 0) {
	            sendJson(res, 200, { items: [] });
	            return;
	          }
	          params.push(principal.departments);
          where.push(`t.department = ANY($${params.length}::text[])`);
        }
        addEqualsFilter(where, params, "t.stay_id", url.searchParams.get("stayId"));
        addEqualsFilter(where, params, "t.department", url.searchParams.get("department"));
        addEqualsFilter(where, params, "t.status", url.searchParams.get("status"));
      }

	      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
	      const includeUnread = principal.typ === "guest";
	      const unreadJoin = includeUnread
	        ? `
            LEFT JOIN LATERAL (
              SELECT MAX(created_at) AS last_staff_message_at
              FROM messages m_staff
              WHERE m_staff.thread_id = t.id AND m_staff.sender_type = 'staff'
            ) lm ON true
          `
	        : "";
	      const unreadSelect = includeUnread
	        ? `
              t.guest_last_read_at AS "guestLastReadAt",
              CASE
                WHEN lm.last_staff_message_at IS NULL THEN 0
                WHEN t.guest_last_read_at IS NULL THEN 1
                WHEN lm.last_staff_message_at > t.guest_last_read_at THEN 1
                ELSE 0
              END AS "unreadCount",
          `
	        : `
              NULL::timestamptz AS "guestLastReadAt",
              0::int AS "unreadCount",
          `;

		      const items = await query(
		        `
		          SELECT * FROM (
		            SELECT
		              t.id,
		              t.hotel_id AS "hotelId",
		              t.stay_id AS "stayId",
		              t.department,
		              t.status,
		              t.title,
		              t.assigned_staff_user_id AS "assignedStaffUserId",
		              su.display_name AS "assignedStaffUserDisplayName",
		              su.email AS "assignedStaffUserEmail",
		              t.created_at AS "createdAt",
		              t.updated_at AS "updatedAt",
		              ${unreadSelect}
		              (
		                SELECT body_text
	                FROM messages m
	                WHERE m.thread_id = t.id
	                ORDER BY m.created_at DESC
	                LIMIT 1
	              ) AS "lastMessage",
	              (
	                SELECT created_at
	                FROM messages m
	                WHERE m.thread_id = t.id
	                ORDER BY m.created_at DESC
	                LIMIT 1
		              ) AS "lastMessageAt"
		            FROM threads t
		            LEFT JOIN staff_users su ON su.id = t.assigned_staff_user_id
		            ${unreadJoin}
		            ${whereClause}
		          ) AS sub
		          ORDER BY COALESCE("lastMessageAt", "updatedAt") DESC
		          LIMIT 100
		        `,
		        params
		      );

	      sendJson(res, 200, {
	        items: items.map((item) => {
	          const assignedStaffUserId = item.assignedStaffUserId ?? null;
	          return {
	            ...item,
	            assignedStaffUser: assignedStaffUserId
	              ? {
	                  id: assignedStaffUserId,
	                  displayName: item.assignedStaffUserDisplayName ?? null,
	                  email: item.assignedStaffUserEmail ?? null
	                }
	              : null
	          };
	        })
	      });
	      return;
	    }

    if (req.method === "POST") {
      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

	      const requestedDepartment = typeof body.department === "string" ? body.department.trim() : "";
	      const department = requestedDepartment ? requestedDepartment.replace(/_/g, "-") : "";
		      const title = typeof body.title === "string" ? body.title.trim() : "";
		      const stayId =
		        principal.typ === "guest"
		          ? principal.stayId
	          : typeof body.stayId === "string"
	            ? body.stayId.trim()
	            : null;
	      const initialMessage = typeof body.initialMessage === "string" ? body.initialMessage.trim() : "";
	      const requestedSenderName = typeof body.senderName === "string" ? body.senderName.trim() : "";

	      if (!principal.hotelId) {
	        sendJson(res, 400, { error: "missing_hotel_context" });
	        return;
	      }

	      if (principal.typ === "guest" && !stayId) {
	        sendJson(res, 400, { error: "missing_stay_context" });
	        return;
	      }

	      if (!department || !title) {
	        sendJson(res, 400, { error: "missing_fields", required: ["department", "title"] });
	        return;
	      }

	      if (principal.typ === "guest") {
	        const existingThreads = await query(
	          `
	            SELECT
	              id,
	              hotel_id AS "hotelId",
	              stay_id AS "stayId",
	              department,
	              status,
	              title,
	              assigned_staff_user_id AS "assignedStaffUserId",
	              created_at AS "createdAt",
	              updated_at AS "updatedAt"
	            FROM threads
	            WHERE hotel_id = $1 AND stay_id = $2 AND department = $3 AND status <> 'archived'
	            ORDER BY updated_at DESC
	            LIMIT 1
	          `,
	          [principal.hotelId, stayId, department]
	        );

		        let existing = existingThreads[0] ?? null;
		        if (existing) {
		          if (!existing.assignedStaffUserId) {
		            try {
		              const assignee = await pickDefaultThreadAssignee({
		                hotelId: principal.hotelId,
		                department: existing.department
		              });
		              if (assignee) {
		                await query(
		                  `UPDATE threads SET assigned_staff_user_id = $1, updated_at = NOW() WHERE id = $2 AND assigned_staff_user_id IS NULL`,
		                  [assignee, existing.id]
		                );
		                existing = { ...existing, assignedStaffUserId: assignee };
		              }
		            } catch (error) {
		              console.error("thread_assign_default_failed", error);
		            }
		          }

		          if (initialMessage) {
		            const messageId = `M-${randomUUID().slice(0, 8).toUpperCase()}`;
		            const senderName = requestedSenderName || getGuestDisplayName(principal) || "Guest";
	
		            await query(
		              `
		                INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
		                VALUES ($1, $2, 'guest', $3, $4, '{}'::jsonb, NOW())
		              `,
		              [messageId, existing.id, senderName, initialMessage]
		            );
	            await query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [existing.id]);

	            try {
	              await emitRealtimeEvent({
	                type: "message_created",
	                hotelId: principal.hotelId,
	                stayId,
	                threadId: existing.id,
	                messageId,
	                department: existing.department,
	                senderType: "guest"
	              });
	            } catch (error) {
	              console.error("realtime_emit_failed", error);
	            }

	            try {
		              const recipients = existing.assignedStaffUserId
		                ? await listStaffNotificationTargetsByIds({
		                    hotelId: principal.hotelId,
		                    staffUserIds: [existing.assignedStaffUserId]
		                  })
		                : await listStaffNotificationTargets({
	                    hotelId: principal.hotelId,
	                    department: existing.department
	                  });

	              const subject = `New guest message • ${existing.department}`;
	              const bodyText = [
	                "New guest message received.",
	                "",
	                existing.title ? `Thread: ${existing.title} (${existing.id})` : `Thread: ${existing.id}`,
	                "",
	                initialMessage
	              ].join("\n");

	              for (const recipient of recipients) {
	                await enqueueEmailOutbox({
	                  hotelId: principal.hotelId,
	                  toAddress: recipient.email,
	                  subject,
	                  bodyText,
	                  payload: {
	                    type: "message_created",
	                    threadId: existing.id,
	                    department: existing.department,
	                    messageId
	                  }
	                });
	              }
	            } catch (error) {
	              console.error("notification_enqueue_failed", error);
	            }
	          }

	          sendJson(res, 200, existing);
	          return;
	        }
	      }

		      const id = `TH-${randomUUID().slice(0, 8).toUpperCase()}`;
		      const assignedStaffUserId =
		        principal.typ === "guest"
		          ? await pickDefaultThreadAssignee({ hotelId: principal.hotelId, department })
		          : null;
	
	      const rows = await query(
	        `
	          INSERT INTO threads (id, hotel_id, stay_id, department, status, title, assigned_staff_user_id, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		          RETURNING
		            id,
		            hotel_id AS "hotelId",
		            stay_id AS "stayId",
		            department,
		            status,
		            title,
		            assigned_staff_user_id AS "assignedStaffUserId",
		            created_at AS "createdAt",
		            updated_at AS "updatedAt"
		        `,
		        [id, principal.hotelId, stayId, department, "pending", title, assignedStaffUserId]
		      );

	      try {
	        await emitRealtimeEvent({
	          type: "thread_created",
	          hotelId: principal.hotelId,
	          threadId: id,
	          stayId,
	          department,
	          status: "pending"
	        });
	      } catch (error) {
	        console.error("realtime_emit_failed", error);
	      }

	      try {
	        if (principal.typ === "guest") {
	          const recipients = await listStaffNotificationTargets({
	            hotelId: principal.hotelId,
	            department
	          });
	          const subject = `New thread • ${department}`;
	          const bodyText = [
	            "A guest started a new conversation.",
	            "",
	            `Thread: ${id}`,
	            `Department: ${department}`,
	            stayId ? `Stay: ${stayId}` : null,
	            initialMessage ? "" : null,
	            initialMessage ? `Initial message:\n${initialMessage}` : null
	          ]
	            .filter(Boolean)
	            .join("\n");

	          for (const recipient of recipients) {
	            await enqueueEmailOutbox({
	              hotelId: principal.hotelId,
	              toAddress: recipient.email,
	              subject,
	              bodyText,
	              payload: { type: "thread_created", threadId: id, department }
	            });
	          }
	        }
	      } catch (error) {
	        console.error("notification_enqueue_failed", error);
	      }

		      if (initialMessage) {
		        const messageId = `M-${randomUUID().slice(0, 8).toUpperCase()}`;
		        const senderType = principal.typ === "staff" ? "staff" : "guest";
		        const senderName =
		          principal.typ === "staff"
		            ? requestedSenderName || principal.displayName || "Staff"
		            : requestedSenderName || getGuestDisplayName(principal) || "Guest";
	        await query(
	          `
	            INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
	            VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
	          `,
	          [messageId, id, senderType, senderName, initialMessage, "{}"]
	        );
	
	        try {
	          await emitRealtimeEvent({
	            type: "message_created",
	            hotelId: principal.hotelId,
	            stayId,
	            threadId: id,
	            messageId,
	            department,
	            senderType
	          });
	        } catch (error) {
	          console.error("realtime_emit_failed", error);
	        }
	      }

      sendJson(res, 201, rows[0]);
      return;
    }
  }

  if (segments[0] === "api" && segments[1] === "v1" && segments[2] === "threads" && segments[3]) {
    const threadId = decodeURIComponent(segments[3]);
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    if (req.method === "GET" && segments.length === 4) {
      const params = [threadId, principal.hotelId];
      const where =
        principal.typ === "guest" ? `t.id = $1 AND t.hotel_id = $2 AND t.stay_id = $3` : `t.id = $1 AND t.hotel_id = $2`;
      if (principal.typ === "guest") params.push(principal.stayId);

      const rows = await query(
        `
          SELECT
            t.id,
            t.hotel_id AS "hotelId",
            t.stay_id AS "stayId",
            t.department,
            t.status,
            t.title,
            t.assigned_staff_user_id AS "assignedStaffUserId",
            su.display_name AS "assignedStaffUserDisplayName",
            su.email AS "assignedStaffUserEmail",
            t.created_at AS "createdAt",
            t.updated_at AS "updatedAt",
            (
              SELECT body_text
              FROM messages m
              WHERE m.thread_id = t.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS "lastMessage",
            (
              SELECT created_at
              FROM messages m
              WHERE m.thread_id = t.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS "lastMessageAt"
          FROM threads t
          LEFT JOIN staff_users su ON su.id = t.assigned_staff_user_id
          WHERE ${where}
          LIMIT 1
        `,
        params
      );

      const row = rows[0];
      if (!row) {
        sendJson(res, 404, { error: "thread_not_found" });
        return;
      }

      if (principal.typ === "staff" && !isDepartmentAllowed(principal, row.department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      const assignedStaffUserId = row.assignedStaffUserId ?? null;
      sendJson(res, 200, {
        ...row,
        assignedStaffUser: assignedStaffUserId
          ? {
              id: assignedStaffUserId,
              displayName: row.assignedStaffUserDisplayName ?? null,
              email: row.assignedStaffUserEmail ?? null
            }
          : null
      });
      return;
    }

    if (req.method === "PATCH" && segments.length === 4) {
      if (principal.typ !== "staff") {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }
      if (!requireStaffRole(res, principal, ["staff", "manager", "admin"])) return;

      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const allowedStatuses = ["pending", "in_progress", "resolved", "archived"];
      const nextStatus = typeof body.status === "string" ? body.status.trim() : null;
      const assignedToProvided = Object.prototype.hasOwnProperty.call(body, "assignedTo");
      const rawAssignedTo = assignedToProvided ? body.assignedTo : undefined;

      if (nextStatus !== null && !allowedStatuses.includes(nextStatus)) {
        sendJson(res, 400, { error: "invalid_status", allowed: allowedStatuses });
        return;
      }

      if (nextStatus === null && !assignedToProvided) {
        sendJson(res, 400, { error: "missing_fields", required: ["status and/or assignedTo"] });
        return;
      }

	      const scopeRows = await query(
	        `
	          SELECT
	            hotel_id AS "hotelId",
	            department,
	            assigned_staff_user_id AS "assignedStaffUserId",
	            status,
	            title
	          FROM threads
	          WHERE id = $1
	          LIMIT 1
	        `,
	        [threadId]
	      );

      const scope = scopeRows[0];
      if (!scope) {
        sendJson(res, 404, { error: "thread_not_found" });
        return;
      }

      if (scope.hotelId !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (!isDepartmentAllowed(principal, scope.department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (scope.status === "archived") {
        sendJson(res, 409, { error: "thread_archived" });
        return;
      }

      let nextAssignedStaffUserId = scope.assignedStaffUserId ?? null;
      if (assignedToProvided) {
        if (rawAssignedTo === null) {
          nextAssignedStaffUserId = null;
        } else if (typeof rawAssignedTo === "string") {
          const trimmed = rawAssignedTo.trim();
          if (!trimmed) nextAssignedStaffUserId = null;
          else if (trimmed === "me") nextAssignedStaffUserId = principal.staffUserId;
          else if (trimmed === principal.staffUserId) nextAssignedStaffUserId = principal.staffUserId;
          else {
            if (principal.role !== "admin") {
              sendJson(res, 403, { error: "forbidden" });
              return;
            }

            const exists = await query(
              `SELECT id FROM staff_users WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
              [trimmed, principal.hotelId]
            );
            if (!exists[0]) {
              sendJson(res, 400, { error: "invalid_assigned_to" });
              return;
            }
            nextAssignedStaffUserId = trimmed;
          }
        } else {
          sendJson(res, 400, { error: "invalid_assigned_to" });
          return;
        }
      }

      if (assignedToProvided && principal.role !== "admin") {
        const currentAssignedStaffUserId = scope.assignedStaffUserId ?? null;
        const isAssignSelf = nextAssignedStaffUserId === principal.staffUserId;
        const isUnassign = nextAssignedStaffUserId === null;

        if (isAssignSelf && currentAssignedStaffUserId && currentAssignedStaffUserId !== principal.staffUserId) {
          sendJson(res, 403, { error: "already_assigned" });
          return;
        }

        if (isUnassign && currentAssignedStaffUserId && currentAssignedStaffUserId !== principal.staffUserId) {
          sendJson(res, 403, { error: "already_assigned" });
          return;
        }
      }

      const set = [];
      const params = [];
      if (nextStatus !== null) {
        params.push(nextStatus);
        set.push(`status = $${params.length}`);
      }
      if (assignedToProvided) {
        params.push(nextAssignedStaffUserId);
        set.push(`assigned_staff_user_id = $${params.length}`);
      }
      params.push(threadId);

      const updatedRows = await query(
        `
          UPDATE threads
          SET ${set.join(", ")}, updated_at = NOW()
          WHERE id = $${params.length}
          RETURNING
            id,
            hotel_id AS "hotelId",
            stay_id AS "stayId",
            department,
            status,
            title,
            assigned_staff_user_id AS "assignedStaffUserId",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        params
      );

      const updated = updatedRows[0];
	      try {
	        await emitRealtimeEvent({
	          type: "thread_updated",
	          hotelId: updated.hotelId,
	          threadId: updated.id,
	          stayId: updated.stayId,
	          department: updated.department,
	          status: updated.status,
	          assignedStaffUserId: updated.assignedStaffUserId ?? null,
	          updatedAt: updated.updatedAt
	        });
	      } catch (error) {
	        console.error("realtime_emit_failed", error);
	      }

	      try {
	        const statusChanged = nextStatus !== null && scope.status !== updated.status;
	        const assignmentChanged =
	          assignedToProvided && (scope.assignedStaffUserId ?? null) !== (updated.assignedStaffUserId ?? null);

	        if (statusChanged || assignmentChanged) {
	          const recipients = updated.assignedStaffUserId
	            ? await listStaffNotificationTargetsByIds({
	                hotelId: principal.hotelId,
	                staffUserIds: [updated.assignedStaffUserId]
	              })
	            : await listStaffNotificationTargets({
	                hotelId: principal.hotelId,
	                department: updated.department
	              });

	          const filtered = recipients.filter((recipient) => recipient.id !== principal.staffUserId);
	          const subject = `Thread updated • ${updated.department} • ${updated.id}`;
	          const bodyText = [
	            "Thread updated.",
	            "",
	            scope.title ? `Title: ${scope.title}` : `Thread: ${updated.id}`,
	            `Department: ${updated.department}`,
	            statusChanged ? `Status: ${scope.status} → ${updated.status}` : `Status: ${updated.status}`,
	            assignmentChanged
	              ? `Assignee: ${(scope.assignedStaffUserId ?? "unassigned") || "unassigned"} → ${(updated.assignedStaffUserId ?? "unassigned") || "unassigned"}`
	              : `Assignee: ${updated.assignedStaffUserId ?? "unassigned"}`
	          ].join("\n");

	          for (const recipient of filtered) {
	            await enqueueEmailOutbox({
	              hotelId: principal.hotelId,
	              toAddress: recipient.email,
	              subject,
	              bodyText,
	              payload: {
	                type: "thread_updated",
	                threadId: updated.id,
	                department: updated.department,
	                status: updated.status
	              }
	            });
	          }
	        }
	      } catch (error) {
	        console.error("notification_enqueue_failed", error);
	      }

	      sendJson(res, 200, updated);
	      return;
	    }

	    if (segments[4] === "messages") {
	      if (req.method === "GET") {
	        if (
	          principal.typ === "staff" &&
		          principal.role !== "admin" &&
		          principal.role !== "manager" &&
		          (!Array.isArray(principal.departments) || principal.departments.length === 0)
		        ) {
		          sendJson(res, 403, { error: "forbidden" });
		          return;
		        }

          // Pagination: ?limit=N&before=ISO_TIMESTAMP
          const limitParam = parseInt(url.searchParams.get("limit") ?? "", 10);
          const pageLimit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 500;
          const beforeParam = url.searchParams.get("before") ?? "";

	        const params = [threadId, principal.hotelId];
	        let where =
	          principal.typ === "guest"
	            ? `m.thread_id = $1 AND t.hotel_id = $2 AND t.stay_id = $3`
	            : `m.thread_id = $1 AND t.hotel_id = $2`;
	        if (principal.typ === "guest") params.push(principal.stayId);
		        if (principal.typ === "staff" && principal.role !== "admin" && principal.role !== "manager") {
		          params.push(principal.departments);
		          where = `${where} AND t.department = ANY($${params.length}::text[])`;
		        }

          // If "before" cursor provided, only get messages older than that timestamp
          if (beforeParam) {
            params.push(beforeParam);
            where = `${where} AND m.created_at < $${params.length}::timestamptz`;
          }

          // Get total count for this thread (without pagination filters)
          const countParams = [threadId, principal.hotelId];
          let countWhere =
            principal.typ === "guest"
              ? `m.thread_id = $1 AND t.hotel_id = $2 AND t.stay_id = $3`
              : `m.thread_id = $1 AND t.hotel_id = $2`;
          if (principal.typ === "guest") countParams.push(principal.stayId);
          if (principal.typ === "staff" && principal.role !== "admin" && principal.role !== "manager") {
            countParams.push(principal.departments);
            countWhere = `${countWhere} AND t.department = ANY($${countParams.length}::text[])`;
          }
          const [{ count: totalCount }] = await query(
            `SELECT COUNT(*)::int AS count FROM messages m JOIN threads t ON t.id = m.thread_id WHERE ${countWhere}`,
            countParams
          );

          // Fetch newest N messages (ordered DESC to get the latest, then reverse for display order)
          const rawItems = await query(
            `
            SELECT
              m.id,
              m.thread_id AS "threadId",
              m.sender_type AS "senderType",
              m.sender_name AS "senderName",
              m.body_text AS "bodyText",
              m.payload AS payload,
              m.created_at AS "createdAt"
            FROM messages m
            JOIN threads t ON t.id = m.thread_id
            WHERE ${where}
            ORDER BY m.created_at DESC
            LIMIT ${pageLimit}
          `,
          params
        );

        const items = rawItems.reverse();
        const hasMore = items.length >= pageLimit && items.length < totalCount;

        if (principal.typ === "guest") {
          try {
            await query(
              `UPDATE threads SET guest_last_read_at = NOW() WHERE id = $1 AND hotel_id = $2 AND stay_id = $3`,
              [threadId, principal.hotelId, principal.stayId]
            );
          } catch (error) {
            console.error("thread_read_update_failed", error);
          }
        }

        sendJson(res, 200, { items, total: totalCount, hasMore });
        return;
      }

	      if (req.method === "POST") {
	        const body = await readJson(req);
	        if (!body || typeof body !== "object") {
	          sendJson(res, 400, { error: "invalid_json" });
	          return;
	        }

        const senderName = typeof body.senderName === "string" ? body.senderName.trim() : null;
        const bodyText = typeof body.bodyText === "string" ? body.bodyText.trim() : "";
        const payloadJson = body.payload ? JSON.stringify(body.payload) : "{}";

        if (!bodyText) {
          sendJson(res, 400, { error: "missing_fields", required: ["bodyText"] });
          return;
        }

        const scopeParams = [threadId, principal.hotelId];
	        const scopeWhere =
	          principal.typ === "guest"
	            ? `id = $1 AND hotel_id = $2 AND stay_id = $3`
	            : `id = $1 AND hotel_id = $2`;
	        if (principal.typ === "guest") scopeParams.push(principal.stayId);

	        const existing = await query(
	          `SELECT id, stay_id AS "stayId", department, status, title, assigned_staff_user_id AS "assignedStaffUserId" FROM threads WHERE ${scopeWhere} LIMIT 1`,
	          scopeParams
	        );
	        const existingThread = existing[0];
	        if (!existingThread) {
	          sendJson(res, 404, { error: "thread_not_found" });
	          return;
	        }

          if (existingThread.status === "archived") {
            sendJson(res, 409, { error: "thread_archived" });
            return;
          }

	        if (principal.typ === "staff" && !isDepartmentAllowed(principal, existingThread.department)) {
	          sendJson(res, 403, { error: "forbidden" });
	          return;
	        }

		        const senderType = principal.typ === "staff" ? "staff" : "guest";
		        const resolvedSenderName =
		          senderType === "staff"
		            ? senderName ?? principal.displayName ?? "Staff"
		            : senderName ?? getGuestDisplayName(principal) ?? "Guest";

        const id = `M-${randomUUID().slice(0, 8).toUpperCase()}`;

        const rows = await query(
          `
            INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
            RETURNING
              id,
              thread_id AS "threadId",
              sender_type AS "senderType",
              sender_name AS "senderName",
              body_text AS "bodyText",
              payload AS payload,
              created_at AS "createdAt"
          `,
          [id, threadId, senderType, resolvedSenderName, bodyText, payloadJson]
        );

        await query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [threadId]);

	        const message = rows[0];
	        try {
	          await emitRealtimeEvent({
	            type: "message_created",
	            hotelId: principal.hotelId,
	            stayId: existingThread.stayId ?? null,
	            threadId,
	            messageId: message.id,
	            department: existingThread.department,
	            senderType
	          });
	        } catch (error) {
	          console.error("realtime_emit_failed", error);
	        }

	        try {
	          if (senderType === "guest") {
	            const recipients = existingThread.assignedStaffUserId
	              ? await listStaffNotificationTargetsByIds({
	                  hotelId: principal.hotelId,
	                  staffUserIds: [existingThread.assignedStaffUserId]
	                })
	              : await listStaffNotificationTargets({
	                  hotelId: principal.hotelId,
	                  department: existingThread.department
	                });

	            const subject = `New guest message • ${existingThread.department}`;
	            const bodyText = [
	              "New guest message received.",
	              "",
	              existingThread.title ? `Thread: ${existingThread.title} (${threadId})` : `Thread: ${threadId}`,
	              "",
	              message.bodyText
	            ].join("\n");

	            for (const recipient of recipients) {
	              await enqueueEmailOutbox({
	                hotelId: principal.hotelId,
	                toAddress: recipient.email,
	                subject,
	                bodyText,
	                payload: { type: "message_created", threadId, department: existingThread.department }
	              });
	            }
	          }
	        } catch (error) {
	          console.error("notification_enqueue_failed", error);
	        }
	        sendJson(res, 201, message);
	        return;
	      }
	    }

    if (segments[4] === "notes" && segments.length === 5) {
      if (principal.typ !== "staff") {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }
      if (!requireStaffRole(res, principal, ["staff", "admin"])) return;

      const scopeRows = await query(
        `
          SELECT
            hotel_id AS "hotelId",
            department,
            assigned_staff_user_id AS "assignedStaffUserId"
          FROM threads
          WHERE id = $1
          LIMIT 1
        `,
        [threadId]
      );

      const scope = scopeRows[0];
      if (!scope) {
        sendJson(res, 404, { error: "thread_not_found" });
        return;
      }

      if (scope.hotelId !== principal.hotelId) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (!isDepartmentAllowed(principal, scope.department)) {
        sendJson(res, 403, { error: "forbidden" });
        return;
      }

      if (req.method === "GET") {
        const items = await query(
          `
            SELECT
              id,
              hotel_id AS "hotelId",
              target_type AS "targetType",
              target_id AS "targetId",
              department,
              author_staff_user_id AS "authorStaffUserId",
              author_name AS "authorName",
              body_text AS "bodyText",
              created_at AS "createdAt"
            FROM internal_notes
            WHERE hotel_id = $1 AND target_type = 'thread' AND target_id = $2
            ORDER BY created_at DESC
            LIMIT 100
          `,
          [principal.hotelId, threadId]
        );

        sendJson(res, 200, { items });
        return;
      }

      if (req.method === "POST") {
        const body = await readJson(req);
        if (!body || typeof body !== "object") {
          sendJson(res, 400, { error: "invalid_json" });
          return;
        }

        const bodyText = typeof body.bodyText === "string" ? body.bodyText.trim() : "";
        if (!bodyText) {
          sendJson(res, 400, { error: "missing_fields", required: ["bodyText"] });
          return;
        }

        const authorName = principal.displayName ?? principal.email ?? "Staff";
        const id = `N-${randomUUID().slice(0, 8).toUpperCase()}`;
        const rows = await query(
          `
            INSERT INTO internal_notes (
              id,
              hotel_id,
              target_type,
              target_id,
              department,
              author_staff_user_id,
              author_name,
              body_text,
              created_at
            )
            VALUES ($1, $2, 'thread', $3, $4, $5, $6, $7, NOW())
            RETURNING
              id,
              hotel_id AS "hotelId",
              target_type AS "targetType",
              target_id AS "targetId",
              department,
              author_staff_user_id AS "authorStaffUserId",
              author_name AS "authorName",
              body_text AS "bodyText",
              created_at AS "createdAt"
          `,
          [id, principal.hotelId, threadId, scope.department, principal.staffUserId, authorName, bodyText]
        );

        const note = rows[0];
        try {
          await emitRealtimeEvent({
            type: "thread_note_created",
            hotelId: principal.hotelId,
            threadId,
            department: scope.department,
            noteId: note.id
          });
        } catch (error) {
          console.error("realtime_emit_failed", error);
        }

        try {
          if (scope.assignedStaffUserId && scope.assignedStaffUserId !== principal.staffUserId) {
            const recipients = await listStaffNotificationTargetsByIds({
              hotelId: principal.hotelId,
              staffUserIds: [scope.assignedStaffUserId]
            });
            for (const recipient of recipients) {
              await enqueueEmailOutbox({
                hotelId: principal.hotelId,
                toAddress: recipient.email,
                subject: `Internal note • Thread ${threadId}`,
                bodyText: `A new internal note was added.\n\nThread: ${threadId}\nDepartment: ${scope.department}\n\n${bodyText}`,
                payload: { type: "thread_note_created", threadId, department: scope.department }
              });
            }
          }
        } catch (error) {
          console.error("notification_enqueue_failed", error);
        }

        sendJson(res, 201, note);
        return;
      }
    }
  }

  // POST /api/v1/restaurant-bookings - Create restaurant booking (ticket + thread + event)
  if (url.pathname === "/api/v1/restaurant-bookings" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const restaurantName = typeof body.restaurantName === "string" ? body.restaurantName.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    const guests = typeof body.guests === "number" ? body.guests : parseInt(body.guests, 10) || 0;
    const specialRequests = typeof body.specialRequests === "string" ? body.specialRequests.trim() : "";
    const experienceItemId = typeof body.experienceItemId === "string" ? body.experienceItemId.trim() : "";

    if (!restaurantName || !date || !time || guests < 1) {
      sendJson(res, 400, {
        error: "missing_fields",
        required: ["restaurantName", "date", "time", "guests (>= 1)"]
      });
      return;
    }

    const stayId = principal.stayId;
    if (!stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    try {
      // Resolve room number from stay
      let roomNumber = "";
      const stays = await query(
        `SELECT room_number AS "roomNumber" FROM stays WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
        [stayId, principal.hotelId]
      );
      roomNumber = stays[0]?.roomNumber ?? "";

      const guestName = getGuestDisplayName(principal) || "Guest";

      // 1. Create ticket (eventId will be added after event creation)
      const ticketId = `T-${randomUUID().slice(0, 8).toUpperCase()}`;
      const eventId = `EV-${randomUUID().slice(0, 8).toUpperCase()}`;
      const ticketTitle = `Reservation ${restaurantName} - ${date} ${time} - ${guests} guest${guests > 1 ? "s" : ""}`;
      const ticketPayload = JSON.stringify({
        type: "restaurant_booking",
        restaurantName,
        date,
        time,
        guests,
        specialRequests,
        experienceItemId,
        guestName,
        eventId
      });

      await query(
        `
          INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'restaurants', 'pending', $5, $6::jsonb, NOW(), NOW())
        `,
        [ticketId, principal.hotelId, stayId, roomNumber, ticketTitle, ticketPayload]
      );

      try {
        await emitRealtimeEvent({
          type: "ticket_created",
          hotelId: principal.hotelId,
          ticketId,
          stayId,
          roomNumber,
          department: "restaurants",
          status: "pending"
        });
      } catch (err) {
        console.error("realtime_emit_failed", err);
      }

      // 2. Create or find thread + send initial message
      const initialMessage = specialRequests
        ? `I would like to book a table at ${restaurantName} on ${date} at ${time} for ${guests} guest${guests > 1 ? "s" : ""}.\n\nSpecial requests: ${specialRequests}`
        : `I would like to book a table at ${restaurantName} on ${date} at ${time} for ${guests} guest${guests > 1 ? "s" : ""}.`;

      const existingThreads = await query(
        `
          SELECT id, department, status, assigned_staff_user_id AS "assignedStaffUserId"
          FROM threads
          WHERE hotel_id = $1 AND stay_id = $2 AND department = 'restaurants' AND status <> 'archived'
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [principal.hotelId, stayId]
      );

      let threadId;
      if (existingThreads[0]) {
        threadId = existingThreads[0].id;
      } else {
        threadId = `TH-${randomUUID().slice(0, 8).toUpperCase()}`;
        const threadTitle = `Restaurants - Room ${roomNumber || "—"}`;

        let assigneeId = null;
        try {
          assigneeId = await pickDefaultThreadAssignee({
            hotelId: principal.hotelId,
            department: "restaurants"
          });
        } catch (err) {
          console.error("thread_assign_default_failed", err);
        }

        await query(
          `
            INSERT INTO threads (id, hotel_id, stay_id, department, status, title, assigned_staff_user_id, created_at, updated_at)
            VALUES ($1, $2, $3, 'restaurants', 'pending', $4, $5, NOW(), NOW())
          `,
          [threadId, principal.hotelId, stayId, threadTitle, assigneeId]
        );
      }

      // Send the booking message
      const messageId = `M-${randomUUID().slice(0, 8).toUpperCase()}`;
      await query(
        `
          INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
          VALUES ($1, $2, 'guest', $3, $4, $5::jsonb, NOW())
        `,
        [messageId, threadId, guestName, initialMessage, JSON.stringify({ type: "restaurant_booking", ticketId })]
      );
      await query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [threadId]);

      try {
        await emitRealtimeEvent({
          type: "message_created",
          hotelId: principal.hotelId,
          stayId,
          threadId,
          messageId,
          department: "restaurants",
          senderType: "guest"
        });
      } catch (err) {
        console.error("realtime_emit_failed", err);
      }

      // 3. Create a pending event in the agenda
      const startAt = `${date}T${time}:00`;
      await query(
        `
          INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, status, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, 'restaurant', $4, $5, 'pending', $6::jsonb, NOW(), NOW())
        `,
        [
          eventId,
          principal.hotelId,
          stayId,
          `${restaurantName} - ${guests} guest${guests > 1 ? "s" : ""}`,
          startAt,
          JSON.stringify({
            department: "restaurants",
            restaurant: restaurantName,
            guests,
            ticketId,
            threadId,
            specialRequests
          })
        ]
      );

      // Notify staff
      try {
        const recipients = await listStaffNotificationTargets({
          hotelId: principal.hotelId,
          department: "restaurants"
        });
        const subject = `Restaurant booking • ${restaurantName} • Room ${roomNumber || "—"}`;
        const bodyText = `New restaurant booking request.\n\nRestaurant: ${restaurantName}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}\nRoom: ${roomNumber || "—"}\nGuest: ${guestName}\n${specialRequests ? `Special requests: ${specialRequests}` : ""}`;

        for (const recipient of recipients) {
          await enqueueEmailOutbox({
            hotelId: principal.hotelId,
            toAddress: recipient.email,
            subject,
            bodyText,
            payload: { type: "restaurant_booking", ticketId, threadId, eventId }
          });
        }
      } catch (err) {
        console.error("notification_enqueue_failed", err);
      }

      sendJson(res, 201, {
        ticketId,
        threadId,
        eventId,
        message: "Booking request submitted"
      });
      return;
    } catch (error) {
      console.error("restaurant_booking_failed", error);
      sendJson(res, 500, { error: "booking_failed" });
      return;
    }
  }

  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "events" &&
    segments[3] &&
    segments[4] === "respond" &&
    segments.length === 5 &&
    req.method === "PATCH"
  ) {
    const eventId = decodeURIComponent(segments[3]);
    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const body = await readJson(req);
    const action =
      body && typeof body === "object" && typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

    if (action !== "accept" && action !== "decline") {
      sendJson(res, 400, { error: "missing_fields", required: ["action"] });
      return;
    }

    const rows = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          type,
          status,
          metadata
        FROM events
        WHERE id = $1
        LIMIT 1
      `,
      [eventId]
    );
    const event = rows[0];
    if (!event) {
      sendJson(res, 404, { error: "event_not_found" });
      return;
    }

    if (event.hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    if (principal.typ === "guest" && event.stayId !== principal.stayId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
      ? event.metadata
      : {};
    const variant = typeof metadata.variant === "string" ? metadata.variant.trim().toLowerCase() : "";
    const kind = typeof metadata.kind === "string" ? metadata.kind.trim().toLowerCase() : "";
    const isInvite = event.type === "invite" || variant === "invite" || kind === "suggestion";

    if (!isInvite) {
      sendJson(res, 400, { error: "event_not_actionable" });
      return;
    }

    const responseBy = principal.typ === "guest" ? "guest" : "staff";
    const nextStatus = action === "accept" ? "confirmed" : "declined";
    const nextMetadata = {
      ...metadata,
      responseAction: action,
      responseBy,
      responseAt: new Date().toISOString()
    };

    const updatedRows = await query(
      `
        UPDATE events
        SET
          status = $2,
          metadata = $3::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          type,
          title,
          start_at AS "startAt",
          end_at AS "endAt",
          status,
          metadata AS metadata,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [eventId, nextStatus, JSON.stringify(nextMetadata)]
    );

    sendJson(res, 200, { item: updatedRows[0] ?? null });
    return;
  }

  if (url.pathname === "/api/v1/events" && req.method === "GET") {
    const where = [];
    const params = [];

    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const requestedHotelId = url.searchParams.get("hotelId");
    if (requestedHotelId && requestedHotelId.trim() && requestedHotelId.trim() !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    addEqualsFilter(where, params, "hotel_id", principal.hotelId);
    if (principal.typ === "guest") addEqualsFilter(where, params, "stay_id", principal.stayId);
    else addEqualsFilter(where, params, "stay_id", url.searchParams.get("stayId"));
    const requestedStatus = url.searchParams.get("status");
    addEqualsFilter(where, params, "status", requestedStatus);
    addEqualsFilter(where, params, "type", url.searchParams.get("type"));
    const includeDeclined = (url.searchParams.get("includeDeclined") ?? "").trim().toLowerCase() === "true";
    if (principal.typ === "guest" && !requestedStatus && !includeDeclined) {
      where.push(`status <> 'declined'`);
    }

    const fromDateInput = url.searchParams.get("from");
    const toDateInput = url.searchParams.get("to");
    const fromDate = parseIsoDate(fromDateInput);
    const toDate = parseIsoDate(toDateInput);
    if (fromDateInput && !fromDate) {
      sendJson(res, 400, { error: "invalid_from_date", expected: "YYYY-MM-DD" });
      return;
    }
    if (toDateInput && !toDate) {
      sendJson(res, 400, { error: "invalid_to_date", expected: "YYYY-MM-DD" });
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      sendJson(res, 400, { error: "invalid_date_range" });
      return;
    }
    if (fromDate) {
      params.push(fromDate);
      where.push(`start_at >= ($${params.length}::date)`);
    }
    if (toDate) {
      params.push(toDate);
      where.push(`start_at < ($${params.length}::date + INTERVAL '1 day')`);
    }
    const limit = Math.min(parsePositiveInt(url.searchParams.get("limit"), 200), 500);

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const items = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          type,
          title,
          start_at AS "startAt",
          end_at AS "endAt",
          status,
          metadata AS metadata,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM events
        ${whereClause}
        ORDER BY start_at ASC
        LIMIT ${limit}
      `,
      params
    );

    sendJson(res, 200, { items });
    return;
  }

  if (url.pathname === "/api/v1/invoices" && req.method === "GET") {
    const where = [];
    const params = [];

    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const requestedHotelId = url.searchParams.get("hotelId");
    if (requestedHotelId && requestedHotelId.trim() && requestedHotelId.trim() !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    addEqualsFilter(where, params, "hotel_id", principal.hotelId);
    if (principal.typ === "guest") addEqualsFilter(where, params, "stay_id", principal.stayId);
    else addEqualsFilter(where, params, "stay_id", url.searchParams.get("stayId"));

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const items = await query(
      `
        SELECT
          id,
          hotel_id AS "hotelId",
          stay_id AS "stayId",
          title,
          department,
          amount_cents AS "amountCents",
          currency,
          points_earned AS "pointsEarned",
          issued_at AS "issuedAt",
          download_url AS "downloadUrl"
        FROM invoices
        ${whereClause}
        ORDER BY issued_at DESC
        LIMIT 200
      `,
      params
    );

    sendJson(res, 200, { items });
    return;
  }

  if (url.pathname === "/api/v1/analytics/summary" && req.method === "GET") {
    const where = [];
    const params = [];

    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

    const requestedHotelId = url.searchParams.get("hotelId");
    if (requestedHotelId && requestedHotelId.trim() && requestedHotelId.trim() !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    addEqualsFilter(where, params, "hotel_id", principal.hotelId);
    if (principal.typ === "guest") addEqualsFilter(where, params, "stay_id", principal.stayId);
    else addEqualsFilter(where, params, "stay_id", url.searchParams.get("stayId"));

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [ticketTotalRows, ticketDepartmentRows, ticketStatusRows] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM tickets ${whereClause}`, params),
      query(`SELECT department, COUNT(*) AS count FROM tickets ${whereClause} GROUP BY department`, params),
      query(`SELECT status, COUNT(*) AS count FROM tickets ${whereClause} GROUP BY status`, params)
    ]);

    const ticketTotal = Number(ticketTotalRows[0]?.count ?? 0);
    const ticketsByDepartment = {};
    for (const row of ticketDepartmentRows) ticketsByDepartment[row.department] = Number(row.count ?? 0);
    const ticketsByStatus = {};
    for (const row of ticketStatusRows) ticketsByStatus[row.status] = Number(row.count ?? 0);

    const [threadTotalRows, threadDepartmentRows] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM threads ${whereClause}`, params),
      query(`SELECT department, COUNT(*) AS count FROM threads ${whereClause} GROUP BY department`, params)
    ]);

    const threadTotal = Number(threadTotalRows[0]?.count ?? 0);
    const threadsByDepartment = {};
    for (const row of threadDepartmentRows) threadsByDepartment[row.department] = Number(row.count ?? 0);

    const invoiceRows = await query(
      `
        SELECT
          COALESCE(SUM(amount_cents), 0) AS "totalCents",
          COALESCE(SUM(points_earned), 0) AS "totalPoints"
        FROM invoices
        ${whereClause}
      `,
      params
    );

    const revenue = {
      totalCents: Number(invoiceRows[0]?.totalCents ?? 0),
      totalPoints: Number(invoiceRows[0]?.totalPoints ?? 0)
    };

    const now = new Date().toISOString();
    const upcomingEventsRows = await query(
      `
        SELECT COUNT(*) AS count
        FROM events
        ${whereClause ? `${whereClause} AND start_at >= NOW()` : `WHERE start_at >= NOW()`}
      `,
      params
    );

    sendJson(res, 200, {
      scope: { hotelId: principal.hotelId, stayId: principal.typ === "guest" ? principal.stayId : url.searchParams.get("stayId") },
      tickets: { total: ticketTotal, byDepartment: ticketsByDepartment, byStatus: ticketsByStatus },
      threads: { total: threadTotal, byDepartment: threadsByDepartment },
      revenue,
      upcomingEvents: Number(upcomingEventsRows[0]?.count ?? 0),
      generatedAt: now
    });
    return;
  }

  // POST /api/v1/tips - Process a digital tip payment
  if (req.method === "POST" && url.pathname === "/api/v1/tips") {
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const amount = typeof body.amount === "number" ? body.amount : 0;
    const staffUserId = typeof body.staffUserId === "string" ? body.staffUserId.trim() : "";
    const department = typeof body.department === "string" ? body.department.trim() : "";
    const currency = typeof body.currency === "string" ? body.currency.trim().toLowerCase() : "usd";

    if (amount <= 0) {
      sendJson(res, 400, { error: "invalid_amount" });
      return;
    }

    if (!staffUserId || !department) {
      sendJson(res, 400, { error: "missing_fields", required: ["staffUserId", "department"] });
      return;
    }

    // Get staff user details
    const staffRows = await query(
      `
        SELECT id, display_name AS "displayName", email
        FROM staff_users
        WHERE id = $1 AND hotel_id = $2
        LIMIT 1
      `,
      [staffUserId, principal.hotelId]
    );

    const staffUser = staffRows[0];
    if (!staffUser) {
      sendJson(res, 404, { error: "staff_not_found" });
      return;
    }

    // Get hotel integrations for payment config
    const integrations = await getHotelIntegrations(principal.hotelId);
    if (!integrations?.payment?.config?.stripeSecretKey) {
      sendJson(res, 503, { error: "payment_not_configured" });
      return;
    }

    try {
      // Initialize payment connector
      const integrationManager = new IntegrationManager(integrations);
      const paymentConnector = integrationManager.getPaymentConnector();

      // Process the tip (requires customerId from guest profile)
      // For now, we'll create a charge with card details from body
      const tipResult = await paymentConnector.processTip({
        amount,
        currency,
        customerId: body.customerId || `guest-${principal.stayId}`, // Placeholder
        staffName: staffUser.displayName || staffUser.email,
        department
      });

      // Record the tip in database
      const tipId = `TIP-${randomUUID().slice(0, 8).toUpperCase()}`;
      await query(
        `
          INSERT INTO invoices (
            id, hotel_id, stay_id, type, amount_cents, currency,
            description, payload, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
        `,
        [
          tipId,
          principal.hotelId,
          principal.stayId,
          "tip",
          Math.round(amount * 100),
          currency,
          `Tip for ${staffUser.displayName} (${department})`,
          JSON.stringify({
            staffUserId,
            staffName: staffUser.displayName,
            department,
            stripePaymentIntentId: tipResult.id
          })
        ]
      );

      sendJson(res, 201, {
        id: tipId,
        amount,
        currency,
        staffUser: {
          id: staffUser.id,
          displayName: staffUser.displayName
        },
        department,
        paymentIntentId: tipResult.id,
        status: tipResult.status
      });
      return;
    } catch (error) {
      console.error("tip_processing_failed", error);
      sendJson(res, 500, { error: "payment_failed", message: error.message });
      return;
    }
  }

  // ==========================================================================
  // ROOM IMAGES - Manage room photo carousels
  // ==========================================================================

  // GET /api/v1/hotels/:hotelId/room-images - List room images (public for guest app)
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "room-images" &&
    !segments[5] &&
    req.method === "GET"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomNumber = url.searchParams.get("roomNumber");
    
    console.log('[Room Images API] Request for hotel:', hotelId, 'room:', roomNumber);
    
    try {
      const params = [hotelId];
      let where = `hotel_id = $1 AND is_active = true`;

      if (roomNumber) {
        params.push(roomNumber);
        where += ` AND (room_numbers IS NULL OR $2 = ANY(room_numbers))`;
      }

      const rows = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            category,
            title,
            description,
            image_url AS "imageUrl",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            room_numbers AS "roomNumbers",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM room_images
          WHERE ${where}
          ORDER BY sort_order ASC, created_at ASC
        `,
        params
      );

      console.log('[Room Images API] Found', rows.length, 'images for room', roomNumber);
      rows.forEach(r => console.log('  -', r.id, r.title, 'rooms:', r.roomNumbers));

      sendJson(res, 200, { images: rows, total: rows.length });
      return;
    } catch (error) {
      console.error("room_images_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // GET /api/v1/staff/room-images - List all room images for staff (active and inactive)
  if (url.pathname === "/api/v1/staff/room-images" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const category = url.searchParams.get("category")?.trim() || null;
    const isActive = url.searchParams.get("isActive");

    try {
      const params = [principal.hotelId];
      let whereClause = "WHERE hotel_id = $1";
      
      if (category) {
        params.push(category);
        whereClause += ` AND category = $${params.length}`;
      }
      
      if (isActive === "true") {
        whereClause += " AND is_active = true";
      } else if (isActive === "false") {
        whereClause += " AND is_active = false";
      }

      const rows = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            category,
            title,
            description,
            image_url AS "imageUrl",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_by_staff_user_id AS "createdByStaffUserId",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM room_images
          ${whereClause}
          ORDER BY sort_order ASC, created_at ASC
        `,
        params
      );

      sendJson(res, 200, { images: rows, total: rows.length });
      return;
    } catch (error) {
      console.error("room_images_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // POST /api/v1/staff/room-images - Create a new room image
  if (url.pathname === "/api/v1/staff/room-images" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    const imageUrl = normalizeText(body?.imageUrl);
    const title = normalizeText(body?.title);
    const description = normalizeText(body?.description);
    const category = normalizeText(body?.category) || "room";

    if (!imageUrl) {
      sendJson(res, 400, { error: "missing_image_url" });
      return;
    }

    try {
      const id = `RI-${randomUUID().slice(0, 8).toUpperCase()}`;
      
      // Get next sort order
      const maxOrderRows = await query(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM room_images WHERE hotel_id = $1`,
        [principal.hotelId]
      );
      const sortOrder = maxOrderRows[0]?.next_order ?? 1;

      await query(
        `
          INSERT INTO room_images (id, hotel_id, category, title, description, image_url, sort_order, is_active, created_by_staff_user_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
        `,
        [id, principal.hotelId, category, title, description, imageUrl, sortOrder, principal.staffId]
      );

      const rows = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            category,
            title,
            description,
            image_url AS "imageUrl",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM room_images
          WHERE id = $1
        `,
        [id]
      );

      sendJson(res, 201, { image: rows[0] });
      return;
    } catch (error) {
      console.error("room_image_create_failed", error);
      sendJson(res, 500, { error: "create_failed" });
      return;
    }
  }

  // PATCH /api/v1/staff/room-images/:id - Update a room image
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "room-images" &&
    segments[4] &&
    !segments[5] &&
    req.method === "PATCH"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const imageId = decodeURIComponent(segments[4]);
    const body = await readJson(req);

    try {
      // Check ownership
      const existing = await query(
        `SELECT id FROM room_images WHERE id = $1 AND hotel_id = $2`,
        [imageId, principal.hotelId]
      );
      if (!existing[0]) {
        sendJson(res, 404, { error: "image_not_found" });
        return;
      }

      const updates = [];
      const params = [];

      if (typeof body?.title === "string") {
        params.push(body.title.trim() || null);
        updates.push(`title = $${params.length}`);
      }
      if (typeof body?.description === "string") {
        params.push(body.description.trim() || null);
        updates.push(`description = $${params.length}`);
      }
      if (typeof body?.imageUrl === "string" && body.imageUrl.trim()) {
        params.push(body.imageUrl.trim());
        updates.push(`image_url = $${params.length}`);
      }
      if (typeof body?.category === "string" && body.category.trim()) {
        params.push(body.category.trim());
        updates.push(`category = $${params.length}`);
      }
      if (typeof body?.sortOrder === "number") {
        params.push(body.sortOrder);
        updates.push(`sort_order = $${params.length}`);
      }
      if (typeof body?.isActive === "boolean") {
        params.push(body.isActive);
        updates.push(`is_active = $${params.length}`);
      }

      if (updates.length === 0) {
        sendJson(res, 400, { error: "no_updates" });
        return;
      }

      updates.push("updated_at = NOW()");
      params.push(imageId);

      await query(
        `UPDATE room_images SET ${updates.join(", ")} WHERE id = $${params.length}`,
        params
      );

      const rows = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            category,
            title,
            description,
            image_url AS "imageUrl",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM room_images
          WHERE id = $1
        `,
        [imageId]
      );

      sendJson(res, 200, { image: rows[0] });
      return;
    } catch (error) {
      console.error("room_image_update_failed", error);
      sendJson(res, 500, { error: "update_failed" });
      return;
    }
  }

  // DELETE /api/v1/staff/room-images/:id - Delete a room image
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "room-images" &&
    segments[4] &&
    !segments[5] &&
    req.method === "DELETE"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const imageId = decodeURIComponent(segments[4]);

    try {
      const result = await query(
        `DELETE FROM room_images WHERE id = $1 AND hotel_id = $2 RETURNING id`,
        [imageId, principal.hotelId]
      );

      if (!result[0]) {
        sendJson(res, 404, { error: "image_not_found" });
        return;
      }

      sendJson(res, 200, { deleted: true, id: imageId });
      return;
    } catch (error) {
      console.error("room_image_delete_failed", error);
      sendJson(res, 500, { error: "delete_failed" });
      return;
    }
  }

  // ==========================================================================
  // GUEST CONTENT - Backend-driven UI/content payload
  // ==========================================================================

  // GET /api/v1/hotels/:hotelId/guest-content - locale-resolved content payload (public)
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "guest-content" &&
    !segments[5] &&
    req.method === "GET"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    const localeRaw = typeof url.searchParams.get("locale") === "string" ? url.searchParams.get("locale").trim() : "";
    const locale = localeRaw === "fr" || localeRaw === "es" ? localeRaw : "en";

    try {
      const override = await getGuestContentOverride(hotelId);
      const content = resolveGuestContent(locale, override);
      sendJson(res, 200, { hotelId, locale, content });
      return;
    } catch (error) {
      console.error("guest_content_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // GET/PUT /api/v1/staff/guest-content - Manage backend guest content configuration
  if (url.pathname === "/api/v1/staff/guest-content") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    if (req.method === "GET") {
      try {
        const rows = await query(
          `
            SELECT hotel_id AS "hotelId", content, created_at AS "createdAt", updated_at AS "updatedAt"
            FROM guest_content_configs
            WHERE hotel_id = $1
            LIMIT 1
          `,
          [principal.hotelId]
        );
        const row = rows[0] ?? null;
        sendJson(res, 200, {
          hotelId: principal.hotelId,
          content: row?.content ?? {},
          createdAt: row?.createdAt ?? null,
          updatedAt: row?.updatedAt ?? null
        });
        return;
      } catch (error) {
        if (isPgRelationMissing(error)) {
          sendJson(res, 200, { hotelId: principal.hotelId, content: {}, createdAt: null, updatedAt: null });
          return;
        }
        console.error("guest_content_staff_fetch_failed", error);
        sendJson(res, 500, { error: "fetch_failed" });
        return;
      }
    }

    if (req.method === "PUT") {
      if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

      const body = await readJson(req);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendJson(res, 400, { error: "invalid_json" });
        return;
      }

      const content = body.content;
      if (!content || typeof content !== "object" || Array.isArray(content)) {
        sendJson(res, 400, { error: "invalid_content" });
        return;
      }

      try {
        const rows = await query(
          `
            INSERT INTO guest_content_configs (hotel_id, content, created_at, updated_at)
            VALUES ($1, $2::jsonb, NOW(), NOW())
            ON CONFLICT (hotel_id)
            DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
            RETURNING hotel_id AS "hotelId", content, created_at AS "createdAt", updated_at AS "updatedAt"
          `,
          [principal.hotelId, JSON.stringify(content)]
        );

        sendJson(res, 200, rows[0]);
        return;
      } catch (error) {
        console.error("guest_content_staff_save_failed", error);
        sendJson(res, 500, { error: "save_failed" });
        return;
      }
    }
  }

  // ==========================================================================
  // EXPERIENCE SECTIONS - Configurable home page carousels
  // ==========================================================================

  // GET /api/v1/hotels/:hotelId/experiences - List experience sections with items (public)
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "experiences" &&
    !segments[5] &&
    req.method === "GET"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    
    try {
      // Get sections
      const sections = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            slug,
            title_fr AS "titleFr",
            title_en AS "titleEn",
            sort_order AS "sortOrder",
            is_active AS "isActive"
          FROM experience_sections
          WHERE hotel_id = $1 AND is_active = true
          ORDER BY sort_order ASC
        `,
        [hotelId]
      );

      // Get items for all sections
      const sectionIds = sections.map(s => s.id);
      let items = [];
      if (sectionIds.length > 0) {
        items = await query(
          `
            SELECT
              id,
              section_id AS "sectionId",
              hotel_id AS "hotelId",
              label,
              image_url AS "imageUrl",
              link_url AS "linkUrl",
              type,
              restaurant_config AS "restaurantConfig",
              sort_order AS "sortOrder",
              is_active AS "isActive"
            FROM experience_items
            WHERE section_id = ANY($1) AND is_active = true
            ORDER BY sort_order ASC
          `,
          [sectionIds]
        );
      }

      // Group items by section
      const sectionsWithItems = sections.map(section => ({
        ...section,
        items: items.filter(item => item.sectionId === section.id)
      }));

      sendJson(res, 200, { sections: sectionsWithItems });
      return;
    } catch (error) {
      console.error("experiences_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // GET /api/v1/staff/experiences - List all experience sections for staff
  if (url.pathname === "/api/v1/staff/experiences" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    try {
      const sections = await query(
        `
          SELECT
            id,
            hotel_id AS "hotelId",
            slug,
            title_fr AS "titleFr",
            title_en AS "titleEn",
            sort_order AS "sortOrder",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM experience_sections
          WHERE hotel_id = $1
          ORDER BY sort_order ASC
        `,
        [principal.hotelId]
      );

      const sectionIds = sections.map(s => s.id);
      let items = [];
      if (sectionIds.length > 0) {
        items = await query(
          `
            SELECT
              id,
              section_id AS "sectionId",
              hotel_id AS "hotelId",
              label,
              image_url AS "imageUrl",
              link_url AS "linkUrl",
              type,
              restaurant_config AS "restaurantConfig",
              sort_order AS "sortOrder",
              is_active AS "isActive",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
            FROM experience_items
            WHERE section_id = ANY($1)
            ORDER BY sort_order ASC
          `,
          [sectionIds]
        );
      }

      const sectionsWithItems = sections.map(section => ({
        ...section,
        items: items.filter(item => item.sectionId === section.id)
      }));

      sendJson(res, 200, { sections: sectionsWithItems, total: sections.length });
      return;
    } catch (error) {
      console.error("experiences_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // POST /api/v1/staff/experiences/sections - Create a new experience section
  if (url.pathname === "/api/v1/staff/experiences/sections" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    const slug = normalizeText(body?.slug);
    const titleFr = normalizeText(body?.titleFr);
    const titleEn = normalizeText(body?.titleEn);

    if (!slug || !titleFr || !titleEn) {
      sendJson(res, 400, { error: "missing_required_fields" });
      return;
    }

    try {
      const id = `ES-${randomUUID().slice(0, 8).toUpperCase()}`;
      
      const maxOrderRows = await query(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM experience_sections WHERE hotel_id = $1`,
        [principal.hotelId]
      );
      const sortOrder = maxOrderRows[0]?.next_order ?? 1;

      await query(
        `
          INSERT INTO experience_sections (id, hotel_id, slug, title_fr, title_en, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `,
        [id, principal.hotelId, slug, titleFr, titleEn, sortOrder]
      );

      const rows = await query(
        `SELECT id, hotel_id AS "hotelId", slug, title_fr AS "titleFr", title_en AS "titleEn", sort_order AS "sortOrder", is_active AS "isActive" FROM experience_sections WHERE id = $1`,
        [id]
      );

      sendJson(res, 201, { section: rows[0] });
      return;
    } catch (error) {
      console.error("experience_section_create_failed", error);
      if (error.code === "23505") {
        sendJson(res, 409, { error: "duplicate_slug" });
        return;
      }
      sendJson(res, 500, { error: "create_failed" });
      return;
    }
  }

  // PATCH /api/v1/staff/experiences/sections/:id - Update an experience section
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "experiences" &&
    segments[4] === "sections" &&
    segments[5] &&
    !segments[6] &&
    req.method === "PATCH"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const sectionId = decodeURIComponent(segments[5]);
    const body = await readJson(req);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (body.titleFr !== undefined) {
      updates.push(`title_fr = $${paramIndex++}`);
      params.push(normalizeText(body.titleFr));
    }
    if (body.titleEn !== undefined) {
      updates.push(`title_en = $${paramIndex++}`);
      params.push(normalizeText(body.titleEn));
    }
    if (body.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(parseInt(body.sortOrder, 10));
    }
    if (body.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(Boolean(body.isActive));
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_updates" });
      return;
    }

    updates.push(`updated_at = NOW()`);
    params.push(sectionId);
    params.push(principal.hotelId);

    try {
      await query(
        `UPDATE experience_sections SET ${updates.join(", ")} WHERE id = $${paramIndex++} AND hotel_id = $${paramIndex}`,
        params
      );

      const rows = await query(
        `SELECT id, hotel_id AS "hotelId", slug, title_fr AS "titleFr", title_en AS "titleEn", sort_order AS "sortOrder", is_active AS "isActive" FROM experience_sections WHERE id = $1`,
        [sectionId]
      );

      sendJson(res, 200, { section: rows[0] });
      return;
    } catch (error) {
      console.error("experience_section_update_failed", error);
      sendJson(res, 500, { error: "update_failed" });
      return;
    }
  }

  // POST /api/v1/staff/experiences/items - Create a new experience item
  if (url.pathname === "/api/v1/staff/experiences/items" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    const sectionId = normalizeText(body?.sectionId);
    const label = normalizeText(body?.label);
    const imageUrl = normalizeText(body?.imageUrl);
    const linkUrl = normalizeText(body?.linkUrl);
    const itemType = normalizeText(body?.type) || "default";
    const restaurantConfig = body?.restaurantConfig && typeof body.restaurantConfig === "object" ? body.restaurantConfig : {};

    if (!sectionId || !label || !imageUrl) {
      sendJson(res, 400, { error: "missing_required_fields" });
      return;
    }

    try {
      const id = `EI-${randomUUID().slice(0, 8).toUpperCase()}`;
      
      const maxOrderRows = await query(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM experience_items WHERE section_id = $1`,
        [sectionId]
      );
      const sortOrder = maxOrderRows[0]?.next_order ?? 1;

      await query(
        `
          INSERT INTO experience_items (id, section_id, hotel_id, label, image_url, link_url, type, restaurant_config, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
        `,
        [id, sectionId, principal.hotelId, label, imageUrl, linkUrl, itemType, JSON.stringify(restaurantConfig), sortOrder]
      );

      const rows = await query(
        `SELECT id, section_id AS "sectionId", hotel_id AS "hotelId", label, image_url AS "imageUrl", link_url AS "linkUrl", type, restaurant_config AS "restaurantConfig", sort_order AS "sortOrder", is_active AS "isActive" FROM experience_items WHERE id = $1`,
        [id]
      );

      sendJson(res, 201, { item: rows[0] });
      return;
    } catch (error) {
      console.error("experience_item_create_failed", error);
      sendJson(res, 500, { error: "create_failed" });
      return;
    }
  }

  // PATCH /api/v1/staff/experiences/items/:id - Update an experience item
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "experiences" &&
    segments[4] === "items" &&
    segments[5] &&
    !segments[6] &&
    req.method === "PATCH"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const itemId = decodeURIComponent(segments[5]);
    const body = await readJson(req);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (body.label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      params.push(normalizeText(body.label));
    }
    if (body.imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      params.push(normalizeText(body.imageUrl));
    }
    if (body.linkUrl !== undefined) {
      updates.push(`link_url = $${paramIndex++}`);
      params.push(normalizeText(body.linkUrl));
    }
    if (body.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      params.push(normalizeText(body.type) || "default");
    }
    if (body.restaurantConfig !== undefined) {
      updates.push(`restaurant_config = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(body.restaurantConfig && typeof body.restaurantConfig === "object" ? body.restaurantConfig : {}));
    }
    if (body.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(parseInt(body.sortOrder, 10));
    }
    if (body.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(Boolean(body.isActive));
    }

    if (updates.length === 0) {
      sendJson(res, 400, { error: "no_updates" });
      return;
    }

    updates.push(`updated_at = NOW()`);
    params.push(itemId);
    params.push(principal.hotelId);

    try {
      await query(
        `UPDATE experience_items SET ${updates.join(", ")} WHERE id = $${paramIndex++} AND hotel_id = $${paramIndex}`,
        params
      );

      const rows = await query(
        `SELECT id, section_id AS "sectionId", hotel_id AS "hotelId", label, image_url AS "imageUrl", link_url AS "linkUrl", type, restaurant_config AS "restaurantConfig", sort_order AS "sortOrder", is_active AS "isActive" FROM experience_items WHERE id = $1`,
        [itemId]
      );

      sendJson(res, 200, { item: rows[0] });
      return;
    } catch (error) {
      console.error("experience_item_update_failed", error);
      sendJson(res, 500, { error: "update_failed" });
      return;
    }
  }

  // DELETE /api/v1/staff/experiences/items/:id - Delete an experience item
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "experiences" &&
    segments[4] === "items" &&
    segments[5] &&
    !segments[6] &&
    req.method === "DELETE"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const itemId = decodeURIComponent(segments[5]);

    try {
      const result = await query(
        `DELETE FROM experience_items WHERE id = $1 AND hotel_id = $2 RETURNING id`,
        [itemId, principal.hotelId]
      );

      if (!result[0]) {
        sendJson(res, 404, { error: "item_not_found" });
        return;
      }

      sendJson(res, 200, { deleted: true, id: itemId });
      return;
    } catch (error) {
      console.error("experience_item_delete_failed", error);
      sendJson(res, 500, { error: "delete_failed" });
      return;
    }
  }

  // =========================================================================
  // USEFUL INFORMATIONS
  // =========================================================================

  // GET /api/v1/hotels/:hotelId/useful-informations - Public endpoint for guests
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "useful-informations" &&
    !segments[5] &&
    req.method === "GET"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    try {
      const categories = await query(
        `SELECT id, title, icon, sort_order AS "sortOrder"
         FROM useful_info_categories
         WHERE hotel_id = $1 AND is_active = true
         ORDER BY sort_order ASC`,
        [hotelId]
      );
      const categoryIds = categories.map((c) => c.id);
      let items = [];
      if (categoryIds.length > 0) {
        items = await query(
          `SELECT id, category_id AS "categoryId", title, content, sort_order AS "sortOrder"
           FROM useful_info_items
           WHERE category_id = ANY($1) AND is_active = true
           ORDER BY sort_order ASC`,
          [categoryIds]
        );
      }
      const result = categories.map((cat) => ({
        ...cat,
        items: items.filter((item) => item.categoryId === cat.id)
      }));
      sendJson(res, 200, { categories: result });
      return;
    } catch (error) {
      console.error("useful_info_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // GET /api/v1/staff/useful-informations - List all categories with items for staff
  if (url.pathname === "/api/v1/staff/useful-informations" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    try {
      const categories = await query(
        `SELECT id, hotel_id AS "hotelId", title, icon,
                sort_order AS "sortOrder", is_active AS "isActive",
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM useful_info_categories
         WHERE hotel_id = $1
         ORDER BY sort_order ASC`,
        [principal.hotelId]
      );
      const categoryIds = categories.map((c) => c.id);
      let items = [];
      if (categoryIds.length > 0) {
        items = await query(
          `SELECT id, category_id AS "categoryId", hotel_id AS "hotelId",
                  title, content, sort_order AS "sortOrder",
                  is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt"
           FROM useful_info_items
           WHERE category_id = ANY($1)
           ORDER BY sort_order ASC`,
          [categoryIds]
        );
      }
      const result = categories.map((cat) => ({
        ...cat,
        items: items.filter((item) => item.categoryId === cat.id)
      }));
      sendJson(res, 200, { categories: result, total: categories.length });
      return;
    } catch (error) {
      console.error("useful_info_staff_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // POST /api/v1/staff/useful-informations/categories - Create a category
  if (url.pathname === "/api/v1/staff/useful-informations/categories" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) { sendJson(res, 400, { error: "title_required" }); return; }

    const id = `uic-${randomUUID()}`;
    const icon = typeof body.icon === "string" ? body.icon.trim() : null;
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;
    const isActive = body.isActive !== false;

    try {
      const rows = await query(
        `INSERT INTO useful_info_categories (id, hotel_id, title, icon, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, hotel_id AS "hotelId", title, icon,
                   sort_order AS "sortOrder", is_active AS "isActive",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [id, principal.hotelId, title, icon, sortOrder, isActive]
      );
      sendJson(res, 201, { category: { ...rows[0], items: [] } });
      return;
    } catch (error) {
      console.error("useful_info_category_create_failed", error);
      sendJson(res, 500, { error: "create_failed" });
      return;
    }
  }

  // PATCH /api/v1/staff/useful-informations/categories/:id
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "useful-informations" &&
    segments[4] === "categories" &&
    segments[5] &&
    !segments[6] &&
    req.method === "PATCH"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const categoryId = decodeURIComponent(segments[5]);
    const body = await readJson(req);

    const sets = [];
    const params = [];
    let paramIdx = 1;

    if (typeof body.title === "string") { sets.push(`title = $${paramIdx++}`); params.push(body.title.trim()); }
    if (typeof body.icon === "string" || body.icon === null) { sets.push(`icon = $${paramIdx++}`); params.push(body.icon); }
    if (typeof body.sortOrder === "number") { sets.push(`sort_order = $${paramIdx++}`); params.push(body.sortOrder); }
    if (typeof body.isActive === "boolean") { sets.push(`is_active = $${paramIdx++}`); params.push(body.isActive); }

    if (sets.length === 0) { sendJson(res, 400, { error: "no_fields" }); return; }

    sets.push(`updated_at = now()`);
    params.push(categoryId, principal.hotelId);

    try {
      const rows = await query(
        `UPDATE useful_info_categories SET ${sets.join(", ")}
         WHERE id = $${paramIdx++} AND hotel_id = $${paramIdx}
         RETURNING id, hotel_id AS "hotelId", title, icon,
                   sort_order AS "sortOrder", is_active AS "isActive",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        params
      );
      if (rows.length === 0) { sendJson(res, 404, { error: "not_found" }); return; }
      sendJson(res, 200, { category: rows[0] });
      return;
    } catch (error) {
      console.error("useful_info_category_update_failed", error);
      sendJson(res, 500, { error: "update_failed" });
      return;
    }
  }

  // DELETE /api/v1/staff/useful-informations/categories/:id
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "useful-informations" &&
    segments[4] === "categories" &&
    segments[5] &&
    !segments[6] &&
    req.method === "DELETE"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const categoryId = decodeURIComponent(segments[5]);

    try {
      const rows = await query(
        `DELETE FROM useful_info_categories WHERE id = $1 AND hotel_id = $2 RETURNING id`,
        [categoryId, principal.hotelId]
      );
      if (rows.length === 0) { sendJson(res, 404, { error: "not_found" }); return; }
      sendJson(res, 200, { deleted: true, id: categoryId });
      return;
    } catch (error) {
      console.error("useful_info_category_delete_failed", error);
      sendJson(res, 500, { error: "delete_failed" });
      return;
    }
  }

  // POST /api/v1/staff/useful-informations/items - Create an item
  if (url.pathname === "/api/v1/staff/useful-informations/items" && req.method === "POST") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const body = await readJson(req);
    const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!categoryId || !title || !content) {
      sendJson(res, 400, { error: "category_id_title_content_required" });
      return;
    }

    const id = `uii-${randomUUID()}`;
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;
    const isActive = body.isActive !== false;

    try {
      const rows = await query(
        `INSERT INTO useful_info_items (id, category_id, hotel_id, title, content, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, category_id AS "categoryId", hotel_id AS "hotelId",
                   title, content, sort_order AS "sortOrder",
                   is_active AS "isActive",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [id, categoryId, principal.hotelId, title, content, sortOrder, isActive]
      );
      sendJson(res, 201, { item: rows[0] });
      return;
    } catch (error) {
      console.error("useful_info_item_create_failed", error);
      sendJson(res, 500, { error: "create_failed" });
      return;
    }
  }

  // PATCH /api/v1/staff/useful-informations/items/:id
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "useful-informations" &&
    segments[4] === "items" &&
    segments[5] &&
    !segments[6] &&
    req.method === "PATCH"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const itemId = decodeURIComponent(segments[5]);
    const body = await readJson(req);

    const sets = [];
    const params = [];
    let paramIdx = 1;

    if (typeof body.title === "string") { sets.push(`title = $${paramIdx++}`); params.push(body.title.trim()); }
    if (typeof body.content === "string") { sets.push(`content = $${paramIdx++}`); params.push(body.content.trim()); }
    if (typeof body.sortOrder === "number") { sets.push(`sort_order = $${paramIdx++}`); params.push(body.sortOrder); }
    if (typeof body.isActive === "boolean") { sets.push(`is_active = $${paramIdx++}`); params.push(body.isActive); }

    if (sets.length === 0) { sendJson(res, 400, { error: "no_fields" }); return; }

    sets.push(`updated_at = now()`);
    params.push(itemId, principal.hotelId);

    try {
      const rows = await query(
        `UPDATE useful_info_items SET ${sets.join(", ")}
         WHERE id = $${paramIdx++} AND hotel_id = $${paramIdx}
         RETURNING id, category_id AS "categoryId", hotel_id AS "hotelId",
                   title, content, sort_order AS "sortOrder",
                   is_active AS "isActive",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        params
      );
      if (rows.length === 0) { sendJson(res, 404, { error: "not_found" }); return; }
      sendJson(res, 200, { item: rows[0] });
      return;
    } catch (error) {
      console.error("useful_info_item_update_failed", error);
      sendJson(res, 500, { error: "update_failed" });
      return;
    }
  }

  // DELETE /api/v1/staff/useful-informations/items/:id
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "staff" &&
    segments[3] === "useful-informations" &&
    segments[4] === "items" &&
    segments[5] &&
    !segments[6] &&
    req.method === "DELETE"
  ) {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;
    if (!requireStaffRole(res, principal, ["admin", "manager"])) return;

    const itemId = decodeURIComponent(segments[5]);

    try {
      const rows = await query(
        `DELETE FROM useful_info_items WHERE id = $1 AND hotel_id = $2 RETURNING id`,
        [itemId, principal.hotelId]
      );
      if (rows.length === 0) { sendJson(res, 404, { error: "not_found" }); return; }
      sendJson(res, 200, { deleted: true, id: itemId });
      return;
    } catch (error) {
      console.error("useful_info_item_delete_failed", error);
      sendJson(res, 500, { error: "delete_failed" });
      return;
    }
  }

  // =========================================================================
  // CLEANING / BOOKABLE SERVICES
  // =========================================================================

  // GET /api/v1/hotels/:hotelId/cleaning/service - Public: get cleaning service config
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "cleaning" &&
    segments[5] === "service" &&
    !segments[6] &&
    req.method === "GET"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    try {
      const rows = await query(
        `SELECT id, name, description, image_url AS "imageUrl",
                price_cents AS "priceCents", currency,
                time_slots AS "timeSlots",
                availability_weekdays AS "availabilityWeekdays"
         FROM upsell_services
         WHERE hotel_id = $1 AND bookable = true AND enabled = true
           AND LOWER(category) = 'housekeeping'
         ORDER BY sort_order ASC
         LIMIT 1`,
        [hotelId]
      );
      if (rows.length === 0) {
        sendJson(res, 404, { error: "cleaning_service_not_found" });
        return;
      }
      sendJson(res, 200, { service: rows[0] });
      return;
    } catch (error) {
      console.error("cleaning_service_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // GET /api/v1/hotels/:hotelId/cleaning/bookings?date=YYYY-MM-DD - Public: get booked slots for a date
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "cleaning" &&
    segments[5] === "bookings" &&
    !segments[6] &&
    req.method === "GET"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    const date = url.searchParams.get("date");
    if (!date) {
      sendJson(res, 400, { error: "date_required" });
      return;
    }
    try {
      const rows = await query(
        `SELECT time_slot AS "timeSlot", COUNT(*)::int AS "count"
         FROM service_bookings
         WHERE hotel_id = $1 AND booking_date = $2 AND status != 'cancelled'
         GROUP BY time_slot`,
        [hotelId, date]
      );
      sendJson(res, 200, { bookedSlots: rows });
      return;
    } catch (error) {
      console.error("cleaning_bookings_fetch_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  // POST /api/v1/hotels/:hotelId/cleaning/bookings - Guest: create cleaning booking + ticket + thread + event
  if (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments[2] === "hotels" &&
    segments[3] &&
    segments[4] === "cleaning" &&
    segments[5] === "bookings" &&
    !segments[6] &&
    req.method === "POST"
  ) {
    const hotelId = decodeURIComponent(segments[3]);
    const principal = requirePrincipal(req, res, url, ["guest"]);
    if (!principal) return;

    const body = await readJson(req);
    if (!body) {
      sendJson(res, 400, { error: "invalid_body" });
      return;
    }

    const { serviceId, bookingDate, timeSlot } = body;
    if (!serviceId || !bookingDate || !timeSlot) {
      sendJson(res, 400, { error: "missing_fields", required: ["serviceId", "bookingDate", "timeSlot"] });
      return;
    }

    const stayId = principal.stayId;
    if (!stayId) {
      sendJson(res, 400, { error: "missing_stay_context" });
      return;
    }

    try {
      const svcRows = await query(
        `SELECT id, name, price_cents, currency FROM upsell_services
         WHERE id = $1 AND hotel_id = $2 AND bookable = true AND enabled = true`,
        [serviceId, hotelId]
      );
      if (svcRows.length === 0) {
        sendJson(res, 404, { error: "service_not_found" });
        return;
      }
      const svc = svcRows[0];

      let roomNumber = "";
      const stays = await query(
        `SELECT room_number AS "roomNumber" FROM stays WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
        [stayId, hotelId]
      );
      roomNumber = stays[0]?.roomNumber ?? "";

      const guestName = getGuestDisplayName(principal) || "Guest";

      // 1. Create service booking
      const bookingId = `SB-${randomUUID().slice(0, 8).toUpperCase()}`;
      const ticketId = `T-${randomUUID().slice(0, 8).toUpperCase()}`;
      const eventId = `EV-${randomUUID().slice(0, 8).toUpperCase()}`;

      const bookingRows = await query(
        `INSERT INTO service_bookings (id, hotel_id, stay_id, upsell_service_id, guest_name, booking_date, time_slot, price_cents, currency, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed', NOW(), NOW())
         RETURNING id, hotel_id AS "hotelId", stay_id AS "stayId",
                   upsell_service_id AS "upsellServiceId",
                   guest_name AS "guestName",
                   booking_date AS "bookingDate",
                   time_slot AS "timeSlot",
                   price_cents AS "priceCents", currency, status,
                   created_at AS "createdAt"`,
        [bookingId, hotelId, stayId, serviceId, guestName, bookingDate, timeSlot, svc.price_cents, svc.currency]
      );

      // 2. Create ticket (request)
      const ticketTitle = `${svc.name} - ${bookingDate} ${timeSlot} - Room ${roomNumber || "—"}`;
      const ticketPayload = JSON.stringify({
        type: "cleaning_booking",
        serviceName: svc.name,
        bookingDate,
        timeSlot,
        guestName,
        priceCents: svc.price_cents,
        currency: svc.currency,
        bookingId,
        eventId
      });

      await query(
        `INSERT INTO tickets (id, hotel_id, stay_id, room_number, department, status, title, payload, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'housekeeping', 'pending', $5, $6::jsonb, NOW(), NOW())`,
        [ticketId, hotelId, stayId, roomNumber, ticketTitle, ticketPayload]
      );

      try {
        await emitRealtimeEvent({
          type: "ticket_created",
          hotelId,
          ticketId,
          stayId,
          roomNumber,
          department: "housekeeping",
          status: "pending"
        });
      } catch (err) {
        console.error("realtime_emit_failed", err);
      }

      // 3. Create or find thread + send initial message
      const initialMessage = `Demande de nettoyage pour le ${bookingDate}, créneau ${timeSlot}.\nChambre : ${roomNumber || "—"}\nPrix : ${(svc.price_cents / 100).toFixed(2)} ${svc.currency}`;

      const existingThreads = await query(
        `SELECT id FROM threads
         WHERE hotel_id = $1 AND stay_id = $2 AND department = 'housekeeping' AND status <> 'archived'
         ORDER BY updated_at DESC LIMIT 1`,
        [hotelId, stayId]
      );

      let threadId;
      if (existingThreads[0]) {
        threadId = existingThreads[0].id;
      } else {
        threadId = `TH-${randomUUID().slice(0, 8).toUpperCase()}`;
        const threadTitle = `Housekeeping - Room ${roomNumber || "—"}`;

        let assigneeId = null;
        try {
          assigneeId = await pickDefaultThreadAssignee({ hotelId, department: "housekeeping" });
        } catch (err) {
          console.error("thread_assign_default_failed", err);
        }

        await query(
          `INSERT INTO threads (id, hotel_id, stay_id, department, status, title, assigned_staff_user_id, created_at, updated_at)
           VALUES ($1, $2, $3, 'housekeeping', 'pending', $4, $5, NOW(), NOW())`,
          [threadId, hotelId, stayId, threadTitle, assigneeId]
        );
      }

      const messageId = `M-${randomUUID().slice(0, 8).toUpperCase()}`;
      await query(
        `INSERT INTO messages (id, thread_id, sender_type, sender_name, body_text, payload, created_at)
         VALUES ($1, $2, 'guest', $3, $4, $5::jsonb, NOW())`,
        [messageId, threadId, guestName, initialMessage, JSON.stringify({ type: "cleaning_booking", ticketId, bookingId })]
      );
      await query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [threadId]);

      try {
        await emitRealtimeEvent({
          type: "message_created",
          hotelId,
          stayId,
          threadId,
          messageId,
          department: "housekeeping",
          senderType: "guest"
        });
      } catch (err) {
        console.error("realtime_emit_failed", err);
      }

      // 4. Create event (agenda item)
      const slotStart = timeSlot.split(" - ")[0] || "10:00";
      const slotEnd = timeSlot.split(" - ")[1] || "11:00";
      const startAt = `${bookingDate}T${slotStart}:00`;
      const endAt = `${bookingDate}T${slotEnd}:00`;

      await query(
        `INSERT INTO events (id, hotel_id, stay_id, type, title, start_at, end_at, status, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, 'housekeeping', $4, $5, $6, 'scheduled', $7::jsonb, NOW(), NOW())`,
        [
          eventId,
          hotelId,
          stayId,
          `${svc.name} - Room ${roomNumber || "—"}`,
          startAt,
          endAt,
          JSON.stringify({
            department: "housekeeping",
            serviceName: svc.name,
            timeSlot,
            ticketId,
            threadId,
            bookingId,
            priceCents: svc.price_cents,
            currency: svc.currency
          })
        ]
      );

      // 5. Notify staff via email
      try {
        const recipients = await listStaffNotificationTargets({ hotelId, department: "housekeeping" });
        const subject = `Nettoyage • ${bookingDate} ${timeSlot} • Room ${roomNumber || "—"}`;
        const bodyText = `New cleaning booking.\n\nService: ${svc.name}\nDate: ${bookingDate}\nTime slot: ${timeSlot}\nRoom: ${roomNumber || "—"}\nGuest: ${guestName}\nPrice: ${(svc.price_cents / 100).toFixed(2)} ${svc.currency}`;

        for (const recipient of recipients) {
          await enqueueEmailOutbox({
            hotelId,
            toAddress: recipient.email,
            subject,
            bodyText,
            payload: { type: "cleaning_booking", ticketId, threadId, eventId, bookingId }
          });
        }
      } catch (err) {
        console.error("notification_enqueue_failed", err);
      }

      sendJson(res, 201, {
        booking: bookingRows[0],
        ticketId,
        threadId,
        eventId,
        message: "Booking confirmed"
      });
      return;
    } catch (error) {
      console.error("cleaning_booking_create_failed", error);
      sendJson(res, 500, { error: "create_failed" });
      return;
    }
  }

  // GET /api/v1/staff/service-bookings - Staff: list service bookings
  if (url.pathname === "/api/v1/staff/service-bookings" && req.method === "GET") {
    const principal = requirePrincipal(req, res, url, ["staff"]);
    if (!principal) return;

    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const status = url.searchParams.get("status");

    try {
      const where = ["sb.hotel_id = $1"];
      const params = [principal.hotelId];
      if (dateFrom) { params.push(dateFrom); where.push(`sb.booking_date >= $${params.length}`); }
      if (dateTo) { params.push(dateTo); where.push(`sb.booking_date <= $${params.length}`); }
      if (status) { params.push(status); where.push(`sb.status = $${params.length}`); }

      const rows = await query(
        `SELECT sb.id, sb.guest_name AS "guestName",
                sb.booking_date AS "bookingDate", sb.time_slot AS "timeSlot",
                sb.price_cents AS "priceCents", sb.currency, sb.status,
                sb.created_at AS "createdAt",
                us.name AS "serviceName"
         FROM service_bookings sb
         JOIN upsell_services us ON us.id = sb.upsell_service_id
         WHERE ${where.join(" AND ")}
         ORDER BY sb.booking_date DESC, sb.time_slot ASC
         LIMIT 100`,
        params
      );
      sendJson(res, 200, { bookings: rows });
      return;
    } catch (error) {
      console.error("service_bookings_list_failed", error);
      sendJson(res, 500, { error: "fetch_failed" });
      return;
    }
  }

  sendJson(res, 404, { error: "not_found" });
}

server.listen(port, host, () => {
  console.log(`mystay-backend listening on http://${host}:${port}`);
});
