import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(_request: Request, { params }: { params: { hotelId: string } }) {
  const hotelId = params.hotelId;
  const response = await fetch(`${BACKEND_URL}/api/v1/hotels/${encodeURIComponent(hotelId)}/experiences`, {
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
}

