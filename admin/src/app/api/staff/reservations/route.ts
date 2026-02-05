import { NextResponse } from "next/server";

import { getStaffToken } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(request: Request) {
  const token = getStaffToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const backendRes = await fetch(query ? `${backendUrl}/api/v1/staff/reservations?${query}` : `${backendUrl}/api/v1/staff/reservations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const payload = await backendRes.json().catch(() => null);
  return NextResponse.json(payload ?? { error: "backend_error" }, { status: backendRes.status });
}

