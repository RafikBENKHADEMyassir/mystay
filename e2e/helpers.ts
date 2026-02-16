/**
 * Shared helpers for E2E tests.
 * Runs against the dev stack: backend :4000, frontend :3000, admin :3001.
 */

export const BACKEND_URL = "http://localhost:4000";
export const FRONTEND_URL = "http://localhost:3000";
export const ADMIN_URL = "http://localhost:3001";

export const DEMO_CONFIRMATION = "DEMO123456";
export const GUEST_EMAIL = "sophie.martin@email.com";
export const GUEST_PASSWORD = "admin123";
export const STAFF_EMAIL = "manager@fourseasons.demo";
export const STAFF_PASSWORD = "admin123";
export const RESTAURANT_MANAGER_EMAIL = "restaurant@fourseasons.demo";
export const RESTAURANT_MANAGER_PASSWORD = "admin123";
export const HOTEL_ID = "H-FOURSEASONS";

/**
 * Get a guest token by looking up a demo reservation via the backend API.
 */
export async function getGuestToken(confirmation = DEMO_CONFIRMATION): Promise<{
  token: string;
  stayId: string;
  hotelId: string;
  roomNumber: string;
}> {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/stays/lookup?confirmation=${encodeURIComponent(confirmation)}`
  );
  if (!res.ok) throw new Error(`stays/lookup failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    token: data.token,
    stayId: data.stay.id,
    hotelId: data.hotel.id,
    roomNumber: data.stay.roomNumber ?? "",
  };
}

/**
 * Get a staff token by logging in with staff credentials.
 */
export async function getStaffToken(
  email = STAFF_EMAIL,
  password = STAFF_PASSWORD
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`staff login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

/**
 * Fetch JSON helper with auth header.
 */
export async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
