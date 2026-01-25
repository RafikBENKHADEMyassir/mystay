import { cookies } from "next/headers";

export const staffTokenCookieName = "mystay_staff_token";

export type StaffPrincipal = {
  typ: "staff" | "platform_admin";
  staffUserId?: string;
  hotelId?: string;
  role?: string;
  departments?: string[];
  email?: string;
  displayName?: string;
  adminId?: string;
};

export function getStaffToken() {
  return cookies().get(staffTokenCookieName)?.value ?? null;
}

export function decodeStaffToken(token: string | null): StaffPrincipal | null {
  if (!token) return null;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // JWT uses base64url encoding - convert to standard base64
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }
    
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
    return payload as StaffPrincipal;
  } catch {
    return null;
  }
}

export function getStaffPrincipal(): StaffPrincipal | null {
  const token = getStaffToken();
  return decodeStaffToken(token);
}
