import { NextRequest, NextResponse } from "next/server";

import { getStaffToken } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET() {
  const token = getStaffToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const backendRes = await fetch(`${backendUrl}/api/v1/staff/hotel-directory`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const payload = await backendRes.json().catch(() => null);
  return NextResponse.json(payload ?? { error: "backend_error" }, { status: backendRes.status });
}

export async function PATCH(request: NextRequest) {
  const token = getStaffToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const backendRes = await fetch(`${backendUrl}/api/v1/staff/hotel-directory`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = await backendRes.json().catch(() => null);
  return NextResponse.json(payload ?? { error: "backend_error" }, { status: backendRes.status });
}

