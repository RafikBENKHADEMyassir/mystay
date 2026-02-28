import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { staffTokenCookieName } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { hotelId: string; channel: string } }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(staffTokenCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { hotelId, channel } = params;
  const response = await fetch(
    `${backendUrl}/api/v1/admin/hotels/${hotelId}/notifications/${channel}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body),
      cache: "no-store"
    }
  );

  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
}
