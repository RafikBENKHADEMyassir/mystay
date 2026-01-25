import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

import { hashPassword, verifyPassword } from "./auth/password.mjs";
import { signToken, verifyToken } from "./auth/token.mjs";
import { query } from "./db/postgres.mjs";
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

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : "*";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
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
  if (principal.role === "admin") return true;
  if (!Array.isArray(principal.departments) || principal.departments.length === 0) return false;
  return principal.departments.includes(department);
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

    let stay = stayRows[0];

    // If stay doesn't exist, try to look it up from PMS
    if (!stay) {
      // Try to find an appropriate hotel
      const hotels = await query(`SELECT id FROM hotels ORDER BY name ASC LIMIT 1`);
      if (!hotels[0]) {
        sendJson(res, 404, { error: "stay_not_found" });
        return;
      }

      const hotelId = hotels[0].id;
      const integrations = await getHotelIntegrations(hotelId);
      const integrationManager = new IntegrationManager(integrations);

      let reservation = null;
      try {
        reservation = await integrationManager.getPMS().getReservation(confirmationNumber);
      } catch (error) {
        console.error("pms_lookup_failed", error);
        sendJson(res, 404, { error: "stay_not_found" });
        return;
      }

      if (!reservation) {
        sendJson(res, 404, { error: "stay_not_found" });
        return;
      }

      const checkIn = typeof reservation?.checkInDate === "string" ? reservation.checkInDate.trim() : "";
      const checkOut = typeof reservation?.checkOutDate === "string" ? reservation.checkOutDate.trim() : "";
      const roomNumber = typeof reservation?.roomNumber === "string" ? reservation.roomNumber.trim() : null;

      if (!checkIn || !checkOut) {
        sendJson(res, 404, { error: "stay_not_found" });
        return;
      }

      const stayId = `S-${randomUUID().slice(0, 8).toUpperCase()}`;
      await query(
        `
          INSERT INTO stays (
            id, hotel_id, guest_id, confirmation_number, room_number, check_in, check_out, adults, children
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [stayId, hotelId, principal.guestId, confirmationNumber, roomNumber, checkIn, checkOut, 1, 0]
      );

      const hotelRow = await query(`SELECT name FROM hotels WHERE id = $1`, [hotelId]);
      stay = {
        stayId,
        hotelId,
        guestId: principal.guestId,
        confirmationNumber,
        roomNumber,
        checkIn,
        checkOut,
        adults: 1,
        children: 0,
        hotelName: hotelRow[0]?.name ?? "Hotel"
      };
    } else {
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

	  if (req.method === "GET" && url.pathname === "/api/v1/realtime/messages") {
	    const threadId = url.searchParams.get("threadId")?.trim();
	    if (!threadId) {
	      sendJson(res, 400, { error: "missing_thread_id" });
	      return;
	    }

    const principal = requirePrincipal(req, res, url, ["guest", "staff"]);
    if (!principal) return;

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

    const unsubscribe = subscribeMessages({ res, threadId, hotelId: scope.hotelId });
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
      departments: principal.role === "admin" ? null : principal.departments
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

    if (principal.role !== "admin") {
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
      if (!requireStaffRole(res, principal, ["staff", "admin"])) return;

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

  if (segments[0] === "api" && segments[1] === "v1" && segments[2] === "hotels" && segments[3]) {
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
      const roomNumber = typeof reservation?.roomNumber === "string" ? reservation.roomNumber.trim() : null;
      const numberOfGuests =
        typeof reservation?.numberOfGuests === "number" && Number.isFinite(reservation.numberOfGuests)
          ? reservation.numberOfGuests
          : 1;
      const adults = Math.max(1, Math.floor(numberOfGuests));
      const children = 0;

      const stayId = stayRow?.stay_id ?? `S-${randomUUID().slice(0, 8).toUpperCase()}`;
      await query(
        `
          INSERT INTO stays (
            id,
            hotel_id,
            confirmation_number,
            room_number,
            check_in,
            check_out,
            adults,
            children
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (confirmation_number) DO UPDATE
          SET
            room_number = EXCLUDED.room_number,
            check_in = EXCLUDED.check_in,
            check_out = EXCLUDED.check_out,
            adults = EXCLUDED.adults,
            children = EXCLUDED.children,
            updated_at = NOW()
        `,
        [stayId, hotelId, trimmedConfirmation, roomNumber, checkIn, checkOut, adults, children]
      );

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

    if (!serviceItemId) {
      sendJson(res, 400, { error: "missing_fields", required: ["serviceItemId"] });
      return;
    }

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
    if (serviceItem.hotelId !== principal.hotelId) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    // Get stay info for room number
    const stayId = principal.typ === "guest"
      ? principal.stayId
      : typeof body.stayId === "string" ? body.stayId.trim() : null;

    let roomNumber = typeof body.roomNumber === "string" ? body.roomNumber.trim() : "";
    if (!roomNumber && stayId) {
      const stays = await query(
        `SELECT room_number AS "roomNumber" FROM stays WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
        [stayId, principal.hotelId]
      );
      roomNumber = stays[0]?.roomNumber ?? "";
    }

    if (!roomNumber) {
      sendJson(res, 400, { error: "missing_room_number" });
      return;
    }

    // Create the ticket
    const ticketId = `T-${randomUUID().slice(0, 8).toUpperCase()}`;
    const status = serviceItem.requiresConfirmation ? "pending_confirmation" : "pending";

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
        principal.hotelId,
        stayId,
        roomNumber,
        serviceItem.department,
        status,
        serviceItem.nameDefault,
        serviceItemId,
        body.priority ?? "normal",
        "service_form",
        JSON.stringify({ formData, serviceItem: { id: serviceItem.id, name: serviceItem.nameDefault } })
      ]
    );

    const ticket = ticketRows[0];

    // Emit realtime event
    try {
      await emitRealtimeEvent({
        type: "ticket_created",
        hotelId: principal.hotelId,
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
        hotelId: principal.hotelId,
        department: ticket.department
      });

      const subject = `New service request • ${ticket.department} • Room ${ticket.roomNumber}`;
      const bodyText = `New service request: ${ticket.title}\n\nRoom: ${ticket.roomNumber}\nDepartment: ${ticket.department}\nTicket: ${ticket.id}`;

      for (const recipient of recipients) {
        await enqueueEmailOutbox({
          hotelId: principal.hotelId,
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
      estimatedTimeMinutes: serviceItem.estimatedTimeMinutes,
      requiresConfirmation: serviceItem.requiresConfirmation
    });
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
        if (principal.role !== "admin") {
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
        if (principal.role !== "admin") {
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
            ${whereClause}
          ) AS sub
          ORDER BY COALESCE("lastMessageAt", "updatedAt") DESC
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

      const department = typeof body.department === "string" ? body.department.trim() : "";
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const stayId =
        principal.typ === "guest"
          ? principal.stayId
          : typeof body.stayId === "string"
            ? body.stayId.trim()
            : null;
      const initialMessage = typeof body.initialMessage === "string" ? body.initialMessage.trim() : "";

      if (!department || !title) {
        sendJson(res, 400, { error: "missing_fields", required: ["department", "title"] });
        return;
      }

      const id = `TH-${randomUUID().slice(0, 8).toUpperCase()}`;

      const rows = await query(
        `
          INSERT INTO threads (id, hotel_id, stay_id, department, status, title, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
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
	        [id, principal.hotelId, stayId, department, "pending", title]
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
	          principal.typ === "staff" ? principal.displayName ?? body.senderName ?? "Staff" : body.senderName ?? "Guest";
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
            threadId: id,
            messageId,
            department
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
      if (!requireStaffRole(res, principal, ["staff", "admin"])) return;

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
	          (!Array.isArray(principal.departments) || principal.departments.length === 0)
	        ) {
	          sendJson(res, 403, { error: "forbidden" });
	          return;
	        }

	        const params = [threadId, principal.hotelId];
	        let where =
	          principal.typ === "guest"
	            ? `m.thread_id = $1 AND t.hotel_id = $2 AND t.stay_id = $3`
	            : `m.thread_id = $1 AND t.hotel_id = $2`;
	        if (principal.typ === "guest") params.push(principal.stayId);
	        if (principal.typ === "staff" && principal.role !== "admin") {
	          params.push(principal.departments);
	          where = `${where} AND t.department = ANY($${params.length}::text[])`;
	        }

        const items = await query(
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
            ORDER BY m.created_at ASC
            LIMIT 500
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
	          `SELECT id, department, title, assigned_staff_user_id AS "assignedStaffUserId" FROM threads WHERE ${scopeWhere} LIMIT 1`,
	          scopeParams
	        );
	        const existingThread = existing[0];
	        if (!existingThread) {
	          sendJson(res, 404, { error: "thread_not_found" });
	          return;
	        }

	        if (principal.typ === "staff" && !isDepartmentAllowed(principal, existingThread.department)) {
	          sendJson(res, 403, { error: "forbidden" });
	          return;
	        }

	        const senderType = principal.typ === "staff" ? "staff" : "guest";
	        const resolvedSenderName =
	          senderType === "staff" ? senderName ?? principal.displayName ?? "Staff" : senderName ?? "Guest";

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
	            threadId,
	            messageId: message.id,
	            department: existingThread.department
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
    addEqualsFilter(where, params, "status", url.searchParams.get("status"));
    addEqualsFilter(where, params, "type", url.searchParams.get("type"));

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
        LIMIT 200
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

  sendJson(res, 404, { error: "not_found" });
}

server.listen(port, host, () => {
  console.log(`mystay-backend listening on http://${host}:${port}`);
});
