import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export async function hashPassword(password) {
  const normalized = typeof password === "string" ? password : "";
  if (!normalized) throw new Error("missing_password");

  const salt = randomBytes(16);
  const derived = await scryptAsync(normalized, salt, keyLength);

  return `scrypt$${salt.toString("base64")}$${Buffer.from(derived).toString("base64")}`;
}

export async function verifyPassword(password, storedHash) {
  const normalized = typeof password === "string" ? password : "";
  if (!normalized) return false;
  if (!storedHash || typeof storedHash !== "string") return false;

  const [scheme, saltB64, derivedB64] = storedHash.split("$");
  if (scheme !== "scrypt" || !saltB64 || !derivedB64) return false;

  let salt;
  let expected;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(derivedB64, "base64");
  } catch {
    return false;
  }

  const actual = Buffer.from(await scryptAsync(normalized, salt, expected.length));
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

