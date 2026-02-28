import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mystay_staff_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/v1/staff/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
