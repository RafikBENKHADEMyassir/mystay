import { redirect } from "next/navigation";

import { getStaffToken, staffTokenCookieName } from "@/lib/staff-token";

export { getStaffToken, staffTokenCookieName };

export function requireStaffToken() {
  const token = getStaffToken();
  if (!token) redirect("/login");
  return token;
}

