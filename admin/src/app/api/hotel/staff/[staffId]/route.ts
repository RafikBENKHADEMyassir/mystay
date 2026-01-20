import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { staffTokenCookieName } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function getHotelIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload.hotelId ?? null;
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(staffTokenCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const hotelId = getHotelIdFromToken(token);
  if (!hotelId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const response = await fetch(`${backendUrl}/api/v1/hotels/${hotelId}/staff/${staffId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { success: true }, { status: response.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(staffTokenCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const hotelId = getHotelIdFromToken(token);
  if (!hotelId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const response = await fetch(`${backendUrl}/api/v1/hotels/${hotelId}/staff/${staffId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
}
