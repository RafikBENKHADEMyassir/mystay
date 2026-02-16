import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/api/v1/hotels/public`, { cache: "no-store" });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
}
