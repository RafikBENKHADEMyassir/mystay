import { cookies } from "next/headers";

export const staffTokenCookieName = "mystay_staff_token";

export function getStaffToken() {
  return cookies().get(staffTokenCookieName)?.value ?? null;
}

