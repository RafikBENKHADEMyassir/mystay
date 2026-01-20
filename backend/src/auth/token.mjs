import { createHmac, timingSafeEqual } from "node:crypto";

let warnedMissingSecret = false;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn("AUTH_SECRET missing; using insecure dev fallback. Set AUTH_SECRET in backend/.env.");
  }

  return "dev-insecure-secret-change-me";
}

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64");
}

function signUnsigned(unsignedToken) {
  const secret = getAuthSecret();
  return createHmac("sha256", secret).update(unsignedToken).digest();
}

export function signToken(payload, { expiresInSeconds = 60 * 60 * 12 } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("invalid_token_payload");
  }

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(fullPayload));
  const unsigned = `${headerPart}.${payloadPart}`;
  const signature = base64UrlEncode(signUnsigned(unsigned));

  return `${unsigned}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string") throw new Error("missing_token");

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("invalid_token_format");

  const [headerPart, payloadPart, signaturePart] = parts;
  const unsigned = `${headerPart}.${payloadPart}`;

  const expected = signUnsigned(unsigned);
  const actual = base64UrlDecode(signaturePart);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("invalid_token_signature");
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8"));
  } catch {
    throw new Error("invalid_token_payload");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("invalid_token_payload");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    throw new Error("token_expired");
  }

  return payload;
}

