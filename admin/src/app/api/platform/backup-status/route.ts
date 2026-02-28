import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { staffTokenCookieName } from "@/lib/staff-token";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(staffTokenCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${backendUrl}/api/v1/admin/backup-status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: response.status });
}
