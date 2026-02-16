import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(request: Request, { params }: { params: { hotelId: string } }) {
  const hotelId = params.hotelId;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "en";

  const response = await fetch(
    `${BACKEND_URL}/api/v1/hotels/${encodeURIComponent(hotelId)}/guest-content?locale=${encodeURIComponent(locale)}`,
    { cache: "no-store" }
  );

  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
}
