import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/guest/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? { error: "unknown_error" }, { status: response.status });
  } catch (error) {
    console.error("check-in proxy error:", error);
    return NextResponse.json({ error: "backend_unreachable" }, { status: 502 });
  }
}
