import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function getStaffAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mystay_staff_token")?.value;
  return token ?? null;
}

// GET /api/staff/room-images - List room images for current hotel
export async function GET(request: NextRequest) {
  const token = await getStaffAuth();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const isActive = searchParams.get("isActive");

  try {
    // Get staff's hotel ID from token
    const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await meRes.json();
    const hotelId = me.principal?.hotelId;

    if (!hotelId) {
      return NextResponse.json({ error: "no_hotel" }, { status: 400 });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/hotels/${hotelId}/room-images?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      // Fallback: return empty array if endpoint doesn't exist yet
      return NextResponse.json({ images: [], total: 0 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch room images:", error);
    return NextResponse.json({ images: [], total: 0 });
  }
}

// POST /api/staff/room-images - Create room image
export async function POST(request: NextRequest) {
  const token = await getStaffAuth();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await meRes.json();
    const hotelId = me.principal?.hotelId;

    if (!hotelId) {
      return NextResponse.json({ error: "no_hotel" }, { status: 400 });
    }

    // Proxy to backend
    const response = await fetch(`${API_BASE_URL}/api/v1/hotels/${hotelId}/room-images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create room image:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
