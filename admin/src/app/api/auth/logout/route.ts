import { NextResponse } from "next/server";

import { staffTokenCookieName } from "@/lib/staff-token";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(staffTokenCookieName, "", { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 0 });
  return res;
}
