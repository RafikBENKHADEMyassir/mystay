import { NextResponse } from "next/server";

import { getStaffToken } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET() {
  const token = getStaffToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const backendRes = await fetch(`${backendUrl}/api/v1/realtime/hotel`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (!backendRes.ok || !backendRes.body) {
    const details = await backendRes.text().catch(() => null);
    return NextResponse.json({ error: "realtime_unavailable", details }, { status: 502 });
  }

  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
