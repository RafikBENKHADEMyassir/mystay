import { NextResponse } from "next/server";

import { staffTokenCookieName } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  loginType?: unknown;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as LoginBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const loginType = typeof body.loginType === "string" ? body.loginType : "staff";

  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields", required: ["email", "password"] }, { status: 400 });
  }

  // Determine which endpoint to use
  const endpoint = loginType === "platform" 
    ? `${backendUrl}/api/v1/auth/platform/login`
    : `${backendUrl}/api/v1/auth/staff/login`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(payload ?? { error: "login_failed" }, { status: response.status });
  }

  const token = typeof payload?.token === "string" ? payload.token : "";
  if (!token) {
    return NextResponse.json({ error: "invalid_login_response" }, { status: 502 });
  }

  // For platform admin, return admin info; for staff, return user info
  const userData = loginType === "platform" ? payload?.admin : payload?.user;

  const res = NextResponse.json({ 
    ok: true, 
    user: userData ?? null,
    loginType
  });
  res.cookies.set(staffTokenCookieName, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return res;
}
