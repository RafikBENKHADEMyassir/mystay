import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(request: NextRequest) {
  const confirmation = request.nextUrl.searchParams.get("confirmation") ?? "";
  if (!confirmation) {
    return NextResponse.json({ error: "missing_confirmation" }, { status: 400 });
  }

  const url = new URL("/api/v1/stays/lookup", BACKEND_URL);
  url.searchParams.set("confirmation", confirmation);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
}
